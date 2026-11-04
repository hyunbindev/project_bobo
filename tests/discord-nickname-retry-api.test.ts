import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { test } from "node:test";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";

test("사용자 별명 재시도는 기존 등록 정보만 사용하고 실패 후 다시 성공할 수 있다", async (context) => {
  const savedEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
    DISCORD_REGISTRATION_ENCRYPTION_KEY: process.env.DISCORD_REGISTRATION_ENCRYPTION_KEY,
  };
  process.env.DATABASE_URL = "postgres://unused:unused@127.0.0.1:1/unused";
  process.env.DISCORD_BOT_TOKEN = "test-token";
  process.env.DISCORD_REGISTRATION_ENCRYPTION_KEY = Buffer.alloc(32, 20).toString("base64");
  const resolver = Module as unknown as { _resolveFilename(request: string, ...args: unknown[]): string };
  const original = resolver._resolveFilename;
  const require = createRequire(`${process.cwd()}/package.json`);
  const alias = context.mock.method(resolver, "_resolveFilename", function (
    this: typeof resolver, request: string, ...args: unknown[]
  ) {
    return request === "server-only" ? require.resolve("next/dist/compiled/server-only/empty.js") : original.call(this, request, ...args);
  });
  try {
    const { POST } = await import("../app/api/discord-accounts/nickname/retry/route");
    const { createRegistrationToken } = await import("../lib/discord-accounts/registration-token");
    const { db } = await import("../lib/db");
    const { REST } = await import("discord.js");
    alias.mock.restore();
    const params = { discordGuildId: "1543197573429465188", discordUserId: "392287872381616130" };
    const token = createRegistrationToken(params);
    const account = {
      id: "registered-account", ...params, name: "Member", birthYear: 1998,
      nicknameStatus: "failed", lastAppliedNickname: null, nicknameError: "Missing Permissions",
    };
    const writes: Record<string, unknown>[] = [];
    let exists = true;
    let denied = true;
    context.mock.method(db, "select", () => {
      const query = {
        from: () => query, innerJoin: () => query,
        where(condition: SQL) {
          assert.deepEqual(new PgDialect().sqlToQuery(condition).params, [params.discordGuildId, params.discordUserId]);
          return query;
        },
        limit: async () => exists ? [{ account: { ...account }, pubgName: "PUBG_NAME" }] : [],
      };
      return query;
    });
    context.mock.method(db, "update", () => ({
      set(values: Record<string, unknown>) {
        return { where(condition: SQL) {
          assert.deepEqual(new PgDialect().sqlToQuery(condition).params, [account.id]);
          Object.assign(account, values);
          writes.push(values);
          return { returning: async () => [{ ...account }] };
        } };
      },
    }));
    context.mock.method(db, "transaction", async () => { throw new Error("Registration must not run again"); });
    const fetchMock = context.mock.method(globalThis, "fetch", async () => { throw new Error("No PUBG requests expected"); });
    const patch = context.mock.method(REST.prototype, "patch", async (route: string, options?: { body?: unknown }) => {
      assert.equal(route, `/guilds/${params.discordGuildId}/members/${params.discordUserId}`);
      assert.deepEqual(options?.body, { nick: "Member 98 / PUBG_NAME" });
      if (denied) throw Object.assign(new Error("Missing Permissions"), { code: 50013 });
      return { nick: "Member 98 / PUBG_NAME", user: { username: "member" } };
    });
    const request = (body: unknown = { token }) => POST(new Request("http://localhost/api/discord-accounts/nickname/retry", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }), {});

    for (const body of [{}, params, { ...params, discordUserId: "invalid" }, { token: token.slice(0, -8) }]) {
      assert.equal((await request(body)).status, 401);
    }
    assert.equal(patch.mock.calls.length, 0);
    exists = false;
    const missing = await request();
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error.code, "NOT_FOUND");
    assert.equal(patch.mock.calls.length, 0);
    exists = true;

    const failure = await request();
    assert.equal(failure.status, 200);
    assert.equal((await failure.json()).data.discordNicknameUpdate.status, "failed");
    assert.equal(account.nicknameStatus, "failed");
    assert.deepEqual(writes.map((row) => row.nicknameStatus), ["pending", "failed"]);

    denied = false;
    // 클라이언트가 추가 정보를 보내도 DB에 저장된 이름·출생연도·PUBG 이름만 사용한다.
    const success = await request({ token, discordUserId: "123", discordGuildId: "456", name: "Untrusted", birthYear: 1900, nickname: "OTHER_PLAYER" });
    assert.equal(success.status, 200);
    assert.deepEqual((await success.json()).data.discordNicknameUpdate, { status: "updated", nickname: "Member 98 / PUBG_NAME" });
    assert.equal(account.nicknameStatus, "completed");
    assert.equal(account.nicknameError, null);
    assert.equal(account.lastAppliedNickname, "Member 98 / PUBG_NAME");
    assert.equal(patch.mock.calls.length, 2);
    assert.equal(fetchMock.mock.calls.length, 0);

    await request();
    assert.equal(patch.mock.calls.length, 2, "이미 완료된 동일 별명은 중복 변경하지 않는다");
  } finally {
    alias.mock.restore();
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
