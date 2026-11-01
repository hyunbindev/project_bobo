import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { test } from "node:test";
import { ButtonStyle, MessageFlags, type ChatInputCommandInteraction } from "discord.js";

test("시작하기 명령은 실행한 사용자에게만 해당 서버의 개인 등록 링크를 제공한다", async (context) => {
  const resolver = Module as unknown as { _resolveFilename(request: string, ...args: unknown[]): string };
  const original = resolver._resolveFilename;
  const require = createRequire(`${process.cwd()}/package.json`);
  const alias = context.mock.method(resolver, "_resolveFilename", function (
    this: typeof resolver, request: string, ...args: unknown[]
  ) {
    return request === "server-only" ? require.resolve("next/dist/compiled/server-only/empty.js") : original.call(this, request, ...args);
  });
  const savedBaseUrl = process.env.APP_BASE_URL;
  const savedNodeEnv = process.env.NODE_ENV;
  Object.assign(process.env, { APP_BASE_URL: "https://bobo.example", NODE_ENV: "production" });
  try {
    const { registrationLinkCommand } = await import("../lib/discord/commands/registration-link-command");
    alias.mock.restore();

    async function execute(guildId: string | null, userId = "348806182779224065") {
      const reply = context.mock.fn(async (options: unknown) => { void options; });
      await registrationLinkCommand.execute({
        guildId, user: { id: userId }, reply,
      } as unknown as ChatInputCommandInteraction);
      assert.equal(reply.mock.calls.length, 1);
      return reply.mock.calls[0].arguments[0] as {
        flags: number;
        content: string;
        components?: { toJSON(): { components: { style: number; url: string }[] } }[];
      };
    }

    for (const userId of ["348806182779224065", "348806182779224066"]) {
      const response = await execute("1543197573429465188", userId);
      assert.equal(response.flags, MessageFlags.Ephemeral);
      const button = response.components?.[0].toJSON().components[0];
      assert.ok(button);
      assert.equal(button.style, ButtonStyle.Link);
      const url = new URL(button.url);
      assert.equal(url.origin, "https://bobo.example");
      assert.equal(url.pathname, "/join/discord");
      assert.equal(url.searchParams.get("discordGuildId"), "1543197573429465188");
      assert.equal(url.searchParams.get("discordUserId"), userId);
    }

    const dmResponse = await execute(null);
    assert.equal(dmResponse.flags, MessageFlags.Ephemeral);
    assert.equal(dmResponse.components, undefined);
    assert.match(dmResponse.content, /서버 안/);

    delete process.env.APP_BASE_URL;
    const unavailable = await execute("1543197573429465188");
    assert.equal(unavailable.flags, MessageFlags.Ephemeral);
    assert.equal(unavailable.components, undefined);
    assert.match(unavailable.content, /관리자/);
  } finally {
    alias.mock.restore();
    if (savedBaseUrl === undefined) delete process.env.APP_BASE_URL;
    else process.env.APP_BASE_URL = savedBaseUrl;
    if (savedNodeEnv === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else Object.assign(process.env, { NODE_ENV: savedNodeEnv });
  }
});
