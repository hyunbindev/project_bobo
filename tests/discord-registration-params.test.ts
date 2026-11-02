import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { test } from "node:test";

import { getDiscordRegistrationParams } from "../lib/discord-accounts/registration-params";

const params = { discordUserId: "123456789012345678", discordGuildId: "234567890123456789" };

test("Discord ID는 숫자로 변환하지 않고 문자열로 전달한다", () => {
  assert.deepEqual(getDiscordRegistrationParams(params), params);
  assert.deepEqual(getDiscordRegistrationParams({ ...params, discordUserId: "18446744073709551615" }), {
    ...params, discordUserId: "18446744073709551615",
  });
});

test("누락·중복·잘못된 형식의 URL 파라미터는 등록 대상으로 사용하지 않는다", () => {
  for (const input of [
    null, {}, [], { discordUserId: params.discordUserId },
    { ...params, discordUserId: [params.discordUserId, "345678901234567890"] },
    { ...params, discordGuildId: "invalid" }, { ...params, discordUserId: 123456789012345678 },
    { ...params, discordUserId: "18446744073709551616" },
    { ...params, discordUserId: "0" }, { ...params, discordUserId: "-1" },
  ]) assert.equal(getDiscordRegistrationParams(input), null);
});

test("URL 파라미터를 Discord 인증 정보로 승격하지 않는다", () => {
  assert.deepEqual(getDiscordRegistrationParams({
    ...params, discordUsername: "untrusted", discordDisplayName: "untrusted", authenticated: true,
  }), params);
});

test("봇이 만드는 URL을 페이지 파라미터로 그대로 읽을 수 있다", async (context) => {
  const resolver = Module as unknown as { _resolveFilename(request: string, ...args: unknown[]): string };
  const original = resolver._resolveFilename;
  const require = createRequire(`${process.cwd()}/package.json`);
  const alias = context.mock.method(resolver, "_resolveFilename", function (this: typeof resolver, request: string, ...args: unknown[]) {
    return request === "server-only" ? require.resolve("next/dist/compiled/server-only/empty.js") : original.call(this, request, ...args);
  });
  const savedBaseUrl = process.env.APP_BASE_URL;
  process.env.APP_BASE_URL = "https://example.com";
  try {
    const { createDiscordRegistrationUrl } = await import("../lib/discord/discord-registration-url");
    const value = createDiscordRegistrationUrl(params.discordUserId, params.discordGuildId);
    assert.ok(value);
    const url = new URL(value);
    assert.equal(url.pathname, "/join/discord");
    assert.deepEqual(getDiscordRegistrationParams(Object.fromEntries(url.searchParams)), params);
    assert.equal(createDiscordRegistrationUrl("invalid", params.discordGuildId), null);
  } finally {
    alias.mock.restore();
    if (savedBaseUrl === undefined) delete process.env.APP_BASE_URL;
    else process.env.APP_BASE_URL = savedBaseUrl;
  }
});
