import assert from "node:assert/strict";
import { createCipheriv } from "node:crypto";
import Module, { createRequire } from "node:module";
import { test } from "node:test";

import { ApiError } from "../lib/api/errors";

test("등록 토큰은 만료 없이 계정을 보호하고 변조·잘못된 키·평문 ID를 거부한다", async (context) => {
  const savedKey = process.env.DISCORD_REGISTRATION_ENCRYPTION_KEY;
  const key = Buffer.alloc(32, 21);
  process.env.DISCORD_REGISTRATION_ENCRYPTION_KEY = key.toString("base64");
  const resolver = Module as unknown as { _resolveFilename(request: string, ...args: unknown[]): string };
  const original = resolver._resolveFilename;
  const require = createRequire(`${process.cwd()}/package.json`);
  const alias = context.mock.method(resolver, "_resolveFilename", function (
    this: typeof resolver, request: string, ...args: unknown[]
  ) {
    return request === "server-only" ? require.resolve("next/dist/compiled/server-only/empty.js") : original.call(this, request, ...args);
  });
  try {
    const { createRegistrationToken, decryptRegistrationToken, requireDiscordRegistrationIdentity } =
      await import("../lib/discord-accounts/registration-token");
    alias.mock.restore();
    const params = { discordUserId: "123456789012345678", discordGuildId: "234567890123456789" };
    const token = createRegistrationToken(params);

    await context.test("동일 계정도 랜덤 IV로 다르게 발급하고 시간 경과 후 재사용할 수 있다", (subtest) => {
      assert.deepEqual(decryptRegistrationToken(token), params);
      assert.notEqual(createRegistrationToken(params), token);
      assert.ok(!token.includes(params.discordUserId));
      assert.ok(!token.includes(params.discordGuildId));
      subtest.mock.method(Date, "now", () => Date.UTC(2100, 0, 1));
      assert.deepEqual(decryptRegistrationToken(token), params);
      assert.deepEqual(requireDiscordRegistrationIdentity({ token, discordUserId: "999", discordGuildId: "888" }), {
        ...params, discordDisplayName: "", discordUsername: "",
      });
    });

    await context.test("IV·암호문·인증 태그의 변경과 축약된 태그를 거부한다", () => {
      const parts = token.split(".");
      for (const index of [1, 2, 3]) {
        const modified = [...parts];
        const bytes = Buffer.from(modified[index], "base64url");
        bytes[0] ^= 1;
        modified[index] = bytes.toString("base64url");
        assert.equal(decryptRegistrationToken(modified.join(".")), null);
      }
      assert.equal(decryptRegistrationToken([...parts.slice(0, 3), Buffer.alloc(8).toString("base64url")].join(".")), null);
    });

    await context.test("잘못된 형식·평문 ID·중복 파라미터를 거부한다", () => {
      for (const value of [null, "", {}, [token], "x".repeat(1025), token.replace("v1.", "v2."), `${token}.extra`]) {
        assert.equal(decryptRegistrationToken(value), null);
      }
      for (const input of [null, {}, params, { token: [token] }, { token: "invalid" }]) {
        assert.throws(() => requireDiscordRegistrationIdentity(input), (error) => error instanceof ApiError && error.status === 401);
      }
    });

    await context.test("인증된 암호문도 용도·복호화 후 스키마가 다르면 거부한다", () => {
      function encryptPayload(plaintext: string, purpose = "bobo:discord-registration:v1") {
        const iv = Buffer.alloc(12, 31);
        const cipher = createCipheriv("aes-256-gcm", key, iv);
        cipher.setAAD(Buffer.from(purpose));
        const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
        return ["v1", iv.toString("base64url"), ciphertext.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
      }
      for (const payload of ["invalid-json", "[]", "{}", JSON.stringify({ ...params, discordUserId: 123 }), JSON.stringify({ ...params, discordGuildId: "0" })]) {
        assert.equal(decryptRegistrationToken(encryptPayload(payload)), null);
      }
      assert.equal(decryptRegistrationToken(encryptPayload(JSON.stringify(params), "other-purpose")), null);
    });

    await context.test("다른 키는 거부하고 키 누락·잘못된 설정은 500으로 구분한다", () => {
      process.env.DISCORD_REGISTRATION_ENCRYPTION_KEY = Buffer.alloc(32, 22).toString("base64");
      assert.equal(decryptRegistrationToken(token), null);
      for (const value of [undefined, "", "not-base64", Buffer.alloc(16).toString("base64")]) {
        if (value === undefined) delete process.env.DISCORD_REGISTRATION_ENCRYPTION_KEY;
        else process.env.DISCORD_REGISTRATION_ENCRYPTION_KEY = value;
        assert.throws(() => createRegistrationToken(params), (error) => error instanceof ApiError && error.status === 500);
        assert.throws(() => decryptRegistrationToken(token), (error) => error instanceof ApiError && error.status === 500);
      }
      process.env.DISCORD_REGISTRATION_ENCRYPTION_KEY = key.toString("base64");
      assert.deepEqual(decryptRegistrationToken(token), params);
    });
  } finally {
    alias.mock.restore();
    if (savedKey === undefined) delete process.env.DISCORD_REGISTRATION_ENCRYPTION_KEY;
    else process.env.DISCORD_REGISTRATION_ENCRYPTION_KEY = savedKey;
  }
});
