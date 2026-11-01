import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { test } from "node:test";

test("Discord 등록은 클랜 가입 행을 만들지 않고 프로필을 저장한다", async (context) => {
  const envKeys = ["DATABASE_URL", "PUBG_API_KEY", "PUBG_CLAN_ID", "DISCORD_BOT_TOKEN"] as const;
  const savedEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  process.env.DATABASE_URL = "postgres://test:test@127.0.0.1:1/registration_test";
  process.env.PUBG_API_KEY = "test-api-key";
  process.env.PUBG_CLAN_ID = " clan.bobo ";
  process.env.DISCORD_BOT_TOKEN = "test-bot-token";

  const resolver = Module as unknown as {
    _resolveFilename(request: string, ...args: unknown[]): string;
  };
  const originalResolve = resolver._resolveFilename;
  const require = createRequire(`${process.cwd()}/package.json`);
  const alias = context.mock.method(resolver, "_resolveFilename", function (
    this: typeof resolver, request: string, ...args: unknown[]
  ) {
    if (request === "server-only") return require.resolve("next/dist/compiled/server-only/empty.js");
    return originalResolve.call(this, request, ...args);
  });

  try {
    const { POST } = await import("../app/api/clan-members/route");
    const { registerClanMember } = await import("../lib/members/service");
    const { withApiErrorHandler } = await import("../lib/api/route-handler");
    const { db } = await import("../lib/db");
    const { REST } = await import("discord.js");
    alias.mock.restore();

    // 검증 실패 시에는 캐시 조회나 DB 저장을 하지 않는다. 실제 DB에는 연결하지 않는다.
    context.mock.method(db, "select", () => { throw new Error("Unexpected DB read"); });
    context.mock.method(db, "transaction", async () => { throw new Error("Unexpected DB write"); });
    context.mock.method(db, "update", () => { throw new Error("Unexpected DB update"); });
    context.mock.method(REST.prototype, "patch", async () => { throw new Error("Unexpected Discord request"); });

    const input = {
      nickname: " PUBG_NAME ", name: "Member", birthYear: 1998, platform: "kakao",
    };
    const identity = {
      discordUserId: "user-a", discordGuildId: "guild-a",
      discordDisplayName: "Discord Member", discordUsername: "discord_member",
    };
    const authenticatedHandler = withApiErrorHandler(async (request) => Response.json({
      data: await registerClanMember(await request.json(), identity),
    }, { status: 201 }));
    const makeRequest = (body: unknown = input) => new Request("http://localhost/api/clan-members", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const request = (body: unknown = input) => authenticatedHandler(makeRequest(body), {});
    const playerResponse = (clanId: string | null = "clan.bobo") => ({
      data: [{
        id: "account.pubg-test", type: "player",
        attributes: { name: "PUBG_NAME", clanId },
        relationships: { matches: { data: [] } },
      }],
    });

    await context.test("Discord ID가 없거나 잘못되면 저장하지 않는다", async (subtest) => {
      const fetchMock = subtest.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected API request"); });
      const response = await POST(makeRequest({ ...input, ...identity }), {});
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error.code, "BAD_REQUEST");
      assert.equal((await POST(makeRequest(input), {})).status, 400);
      assert.equal(fetchMock.mock.calls.length, 0);
    });

    await context.test("입력 검증 실패 시 API와 DB를 호출하지 않는다", async (subtest) => {
      const fetchMock = subtest.mock.method(globalThis, "fetch", async () => {
        throw new Error("Unexpected API request");
      });
      for (const body of [
        { ...input, nickname: " " },
        { ...input, name: " " },
        { ...input, birthYear: new Date().getFullYear() + 1 },
        { ...input, platform: "unknown" },
      ]) assert.equal((await request(body)).status, 400);
      const invalidNickname = await request({ ...input, nickname: "one,two" });
      assert.equal(invalidNickname.status, 400);
      assert.equal((await invalidNickname.json()).error.code, "INVALID_PUBG_NICKNAME");
      assert.equal(fetchMock.mock.calls.length, 0);
    });

    await context.test("존재하지 않는 계정은 저장하지 않는다", async (subtest) => {
      const fetchMock = subtest.mock.method(globalThis, "fetch", async () => Response.json({ data: [] }));
      const response = await request();
      assert.equal(response.status, 404);
      assert.equal((await response.json()).error.code, "PUBG_PLAYER_NOT_FOUND");
      assert.equal(fetchMock.mock.calls.length, 1);
    });

    await context.test("URL의 Discord ID만으로도 PUBG 계정 검증을 진행한다", async (subtest) => {
      const fetchMock = subtest.mock.method(globalThis, "fetch", async () => Response.json({ data: [] }));
      const response = await POST(makeRequest({
        ...input, discordUserId: "348806182779224065", discordGuildId: "1543197573429465188",
      }), {});
      assert.equal(response.status, 404);
      assert.equal((await response.json()).error.code, "PUBG_PLAYER_NOT_FOUND");
      assert.equal(fetchMock.mock.calls.length, 1);
    });

    await context.test("호출 제한 응답을 보존하고 저장하지 않는다", async (subtest) => {
      subtest.mock.method(globalThis, "fetch", async () => new Response(null, {
        status: 429, headers: { "Retry-After": "30" },
      }));
      const response = await request();
      assert.equal(response.status, 429);
      assert.equal(response.headers.get("Retry-After"), "30");
      assert.equal((await response.json()).error.code, "PUBG_RATE_LIMITED");
    });

    await context.test("PUBG 404와 서버 오류를 구분한다", async (subtest) => {
      let status = 404;
      subtest.mock.method(globalThis, "fetch", async () => new Response(null, { status }));
      const notFound = await request();
      assert.equal(notFound.status, 404);
      assert.equal((await notFound.json()).error.code, "PUBG_PLAYER_NOT_FOUND");
      status = 503;
      const unavailable = await request();
      assert.equal(unavailable.status, 502);
      assert.equal((await unavailable.json()).error.code, "PUBG_API_ERROR");
    });

    for (const scenario of [
      { name: "메인 클랜 소속", clanId: "clan.bobo", nicknameDenied: false },
      { name: "다른 클랜 소속", clanId: "clan.other", nicknameDenied: false },
      { name: "클랜 미가입", clanId: null, nicknameDenied: false },
      { name: "닉네임 변경 권한 없음", clanId: null, nicknameDenied: true },
    ]) await context.test(`${scenario.name} 계정도 등록하고 실제 소속은 보존한다`, async (subtest) => {
      const fetchMock = subtest.mock.method(globalThis, "fetch", async (
        url: string | URL | Request, options?: RequestInit,
      ) => {
        const requested = new URL(String(url));
        assert.equal(requested.pathname, "/shards/kakao/players");
        assert.equal(requested.searchParams.get("filter[playerNames]"), "PUBG_NAME");
        assert.equal(options?.cache, "no-store");
        return Response.json(playerResponse(scenario.clanId));
      });
      const query = {
        from: () => query, where: () => query, limit: async () => [],
      };

      const { players, clanMembers, playerDiscordAccounts } = await import("../lib/db/schema");
      const inserted = new Map<unknown, Record<string, unknown>>();
      const tx = {
        select: () => query,
        insert(table: unknown) {
          let row: Record<string, unknown>;
          const insert = {
            values(value: Record<string, unknown>) {
              inserted.set(table, value);
              row = {
                id: table === players
                  ? "00000000-0000-4000-8000-000000000001"
                  : "00000000-0000-4000-8000-000000000002",
                ...value,
              };
              return insert;
            },
            onConflictDoUpdate: () => insert,
            returning: async () => [row],
          };
          return insert;
        },
      };
      const saveMock = subtest.mock.method(db, "transaction", async (
        callback: (transaction: typeof tx) => Promise<unknown>,
      ) => callback(tx));
      const nicknameMock = subtest.mock.method(REST.prototype, "patch", async (route: string, options?: { body?: unknown }) => {
        assert.equal(saveMock.mock.calls.length, 1, "DB 저장 이후에만 Discord를 변경한다");
        assert.equal(route, "/guilds/guild-a/members/user-a");
        assert.deepEqual(options?.body, { nick: "Member 98 / PUBG_NAME" });
        if (scenario.nicknameDenied) throw Object.assign(new Error("Missing Permissions"), { code: 50013 });
        return { nick: "Member 98 / PUBG_NAME", user: { username: "discord_member" } };
      });
      let updatedNames: Record<string, unknown> | undefined;
      subtest.mock.method(db, "update", () => ({
        set(value: Record<string, unknown>) {
          updatedNames = value;
          return { where: () => ({ returning: async () => [{ id: "account-row", ...value }] }) };
        },
      }));
      const response = await request();
      assert.equal(response.status, 201);
      const { data } = await response.json();
      assert.equal(data.player.id, "00000000-0000-4000-8000-000000000001");
      assert.equal(data.player.name, "PUBG_NAME");
      assert.equal(inserted.get(players)?.pubgClanId, scenario.clanId);
      assert.equal(inserted.has(clanMembers), false);
      assert.equal(inserted.get(playerDiscordAccounts)?.playerId, data.player.id);
      assert.equal(inserted.get(playerDiscordAccounts)?.name, "Member");
      assert.equal(inserted.get(playerDiscordAccounts)?.discordDisplayName, "Discord Member");
      assert.equal(inserted.get(playerDiscordAccounts)?.birthYear, 1998);
      assert.equal(fetchMock.mock.calls.length, 1);
      assert.equal(saveMock.mock.calls.length, 1);
      assert.equal(nicknameMock.mock.calls.length, 1);
      assert.equal(data.discordNicknameUpdate.status, scenario.nicknameDenied ? "failed" : "updated");
      if (scenario.nicknameDenied) {
        assert.match(data.discordNicknameUpdate.message, /권한/);
        assert.equal(updatedNames, undefined);
      } else {
        assert.equal(updatedNames?.discordDisplayName, "Member 98 / PUBG_NAME");
        assert.equal(updatedNames?.discordUsername, "discord_member");
      }
    });
  } finally {
    alias.mock.restore();
    for (const key of envKeys) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
  }
});
