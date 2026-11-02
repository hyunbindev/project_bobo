import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { test } from "node:test";
import type { Interaction } from "discord.js";

test("Discord 명령 라우터는 중복 실행과 이미 응답한 interaction의 재응답을 막는다", async (context) => {
  const savedDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL ??= "postgres://unused:unused@127.0.0.1:1/unused";
  const resolver = Module as unknown as { _resolveFilename(request: string, ...args: unknown[]): string };
  const original = resolver._resolveFilename;
  const require = createRequire(`${process.cwd()}/package.json`);
  const alias = context.mock.method(resolver, "_resolveFilename", function (
    this: typeof resolver, request: string, ...args: unknown[]
  ) {
    return request === "server-only" ? require.resolve("next/dist/compiled/server-only/empty.js") : original.call(this, request, ...args);
  });
  try {
    const { handleDiscordInteraction } = await import("../lib/discord/commands/command-registry");
    const { discordLogger } = await import("../lib/logger");
    alias.mock.restore();
    context.mock.method(discordLogger, "error", () => {});
    const warn = context.mock.method(discordLogger, "warn", () => {});
    let nextId = 0;
    function interaction(overrides: Record<string, unknown> = {}) {
      return {
        id: `registry-test-${++nextId}`,
        commandName: "ping",
        guildId: "guild-test",
        user: { id: "user-test" },
        client: { ws: { ping: 1 } },
        isChatInputCommand: () => true,
        deferred: false,
        replied: false,
        reply: context.mock.fn(async () => {}),
        editReply: context.mock.fn(async () => {}),
        followUp: context.mock.fn(async () => {}),
        ...overrides,
      };
    }
    const handle = (value: ReturnType<typeof interaction>) => handleDiscordInteraction(value as unknown as Interaction);

    await context.test("같은 ID의 별도 객체를 동시에 받아도 한 번만 실행한다", async () => {
      const value = interaction();
      await Promise.all([handle(value), handle({ ...value })]);
      await handle({ ...value });
      assert.equal(value.reply.mock.calls.length, 1);
      const another = interaction();
      await handle(another);
      assert.equal(another.reply.mock.calls.length, 1);
    });

    for (const code of [40060, 10062]) await context.test(`${code} 오류에는 추가 응답을 보내지 않는다`, async () => {
      const value = interaction();
      value.reply = context.mock.fn(async () => { throw Object.assign(new Error("Discord API error"), { code }); });
      await handle(value);
      assert.equal(value.reply.mock.calls.length, 1);
      assert.equal(value.editReply.mock.calls.length, 0);
      assert.equal(value.followUp.mock.calls.length, 0);
      assert.ok(warn.mock.calls.length > 0);
    });

    for (const mode of ["deferred", "replied", "none"] as const) await context.test(`일반 오류는 응답 상태 ${mode}에 맞춰 안내한다`, async () => {
      let replies = 0;
      const value = interaction({ deferred: mode === "deferred", replied: mode === "replied" });
      value.reply = context.mock.fn(async () => { if (++replies === 1) throw new Error("Command failed"); });
      await handle(value);
      assert.equal(value.reply.mock.calls.length, mode === "none" ? 2 : 1);
      assert.equal(value.editReply.mock.calls.length, mode === "deferred" ? 1 : 0);
      assert.equal(value.followUp.mock.calls.length, mode === "replied" ? 1 : 0);
    });

    await context.test("오류 안내 중 40060이 발생해도 다시 보내지 않는다", async () => {
      let replies = 0;
      const value = interaction();
      value.reply = context.mock.fn(async () => {
        if (++replies === 1) throw new Error("Command failed");
        throw Object.assign(new Error("Already acknowledged"), { code: 40060 });
      });
      await assert.doesNotReject(handle(value));
      assert.equal(value.reply.mock.calls.length, 2);
      assert.equal(value.followUp.mock.calls.length, 0);
    });

    await context.test("미지원 명령어도 40060 발생 시 다시 응답하지 않는다", async () => {
      const value = interaction({ commandName: "unknown-command" });
      value.reply = context.mock.fn(async () => { throw Object.assign(new Error("Already acknowledged"), { code: 40060 }); });
      await assert.doesNotReject(handle(value));
      assert.equal(value.reply.mock.calls.length, 1);
    });
  } finally {
    alias.mock.restore();
    if (savedDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = savedDatabaseUrl;
  }
});
