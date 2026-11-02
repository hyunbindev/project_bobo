import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { test, type TestContext } from "node:test";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import type { Logger } from "pino";
import type { DiscordNicknameTarget } from "../lib/discord-accounts/types";

test("닉네임 동기화는 변경·실패 건만 적용하고 결과를 저장한다", async (context) => {
  process.env.DATABASE_URL ??= "postgresql://unused:unused@127.0.0.1:1/unused";
  const previousToken = process.env.DISCORD_BOT_TOKEN;
  const previousApiKey = process.env.PUBG_API_KEY;
  process.env.DISCORD_BOT_TOKEN = "test-token";
  process.env.PUBG_API_KEY = "test-api-key";
  const resolver = Module as unknown as { _resolveFilename(request: string, ...args: unknown[]): string };
  const original = resolver._resolveFilename;
  const require = createRequire(`${process.cwd()}/package.json`);
  const alias = context.mock.method(resolver, "_resolveFilename", function (this: typeof resolver, request: string, ...args: unknown[]) {
    return request === "server-only" ? require.resolve("next/dist/compiled/server-only/empty.js") : original.call(this, request, ...args);
  });

  try {
    const { syncDiscordNicknames } = await import("../lib/discord-accounts/service");
    const { discoverMemberMatchIdsTask } = await import("../lib/sync/match/tasks/discover-member-match-ids-task");
    const { db } = await import("../lib/db");
    const { REST } = await import("discord.js");
    alias.mock.restore();

    const base: DiscordNicknameTarget = {
      id: "account-row", discordGuildId: "guild-a", discordUserId: "user-a",
      name: "Member", birthYear: 1998, pubgName: "NEW_NAME",
      nicknameStatus: "completed", lastAppliedNickname: "Member 98 / OLD_NAME",
    };

    function setup(subtest: TestContext, targets: DiscordNicknameTarget[], deniedUsers: string[] = []) {
      const rows = targets.map((target) => ({ ...target, nicknameError: null as string | null }));
      const writes: Array<Record<string, unknown>> = [];
      const query = {
        from: () => query,
        innerJoin: () => query,
        where: async (condition: SQL) => {
          assert.deepEqual(new PgDialect().sqlToQuery(condition).params, ["account.pubg", "kakao"]);
          return rows;
        },
      };
      const selectMock = subtest.mock.method(db, "select", () => query);
      subtest.mock.method(db, "update", () => ({
        set(values: Record<string, unknown>) {
          return {
            where(condition: SQL) {
              const [id] = new PgDialect().sqlToQuery(condition).params;
              const row = rows.find((entry) => entry.id === id);
              assert.ok(row);
              writes.push({ id, ...values });
              Object.assign(row, values);
              return { returning: async () => [row] };
            },
          };
        },
      }));
      const patchMock = subtest.mock.method(REST.prototype, "patch", async (route: string, options: { body: { nick: string } }) => {
        if (deniedUsers.some((user) => route.endsWith(`/members/${user}`))) {
          throw Object.assign(new Error("Missing Permissions"), { code: 50013 });
        }
        return { nick: options.body.nick, user: { username: "discord_member" } };
      });
      return { rows, writes, patchMock, selectMock };
    }

    await context.test("PUBG 이름이 바뀌면 pending 이후 completed와 마지막 적용값을 저장한다", async (subtest) => {
      const state = setup(subtest, [base]);
      await syncDiscordNicknames(["account.pubg", "account.pubg"], "kakao");
      assert.equal(state.patchMock.mock.calls.length, 1);
      assert.deepEqual(state.patchMock.mock.calls[0].arguments, [
        "/guilds/guild-a/members/user-a", { body: { nick: "Member 98 / NEW_NAME" }, reason: "BOBO account registration" },
      ]);
      assert.deepEqual(state.writes.map((write) => write.nicknameStatus), ["pending", "completed"]);
      assert.equal(state.rows[0].lastAppliedNickname, "Member 98 / NEW_NAME");
      assert.equal(state.rows[0].nicknameError, null);
    });

    await context.test("이미 적용한 이름과 같으면 Discord 요청과 상태 갱신을 생략한다", async (subtest) => {
      const state = setup(subtest, [{ ...base, lastAppliedNickname: "Member 98 / NEW_NAME" }]);
      await syncDiscordNicknames(["account.pubg"], "kakao");
      assert.equal(state.patchMock.mock.calls.length, 0);
      assert.equal(state.writes.length, 0);
    });

    for (const status of ["pending", "failed"] as const) {
      await context.test(`${status} 상태는 이름이 같아도 재시도하고 성공 시 완료한다`, async (subtest) => {
        const state = setup(subtest, [{ ...base, nicknameStatus: status, lastAppliedNickname: "Member 98 / NEW_NAME" }]);
        await syncDiscordNicknames(["account.pubg"], "kakao");
        assert.equal(state.patchMock.mock.calls.length, 1);
        assert.equal(state.rows[0].nicknameStatus, "completed");
      });
    }

    await context.test("한 계정의 권한 실패는 기록하고 다른 서버 계정은 계속 처리한다", async (subtest) => {
      const state = setup(subtest, [base, { ...base, id: "account-b", discordGuildId: "guild-b", discordUserId: "user-b" }], ["user-a"]);
      await syncDiscordNicknames(["account.pubg"], "kakao");
      assert.equal(state.patchMock.mock.calls.length, 2);
      assert.equal(state.rows[0].nicknameStatus, "failed");
      assert.match(state.rows[0].nicknameError!, /권한/);
      assert.equal(state.rows[0].lastAppliedNickname, "Member 98 / OLD_NAME");
      assert.equal(state.rows[1].nicknameStatus, "completed");
    });

    await context.test("32자 초과는 Discord 호출 없이 실패 사유를 저장한다", async (subtest) => {
      const state = setup(subtest, [{ ...base, pubgName: "A".repeat(40) }]);
      await syncDiscordNicknames(["account.pubg"], "kakao");
      assert.equal(state.patchMock.mock.calls.length, 0);
      assert.equal(state.rows[0].nicknameStatus, "failed");
      assert.match(state.rows[0].nicknameError!, /32자/);
    });

    await context.test("연동 계정 또는 조회 대상이 없으면 Discord를 호출하지 않는다", async (subtest) => {
      const state = setup(subtest, []);
      await syncDiscordNicknames([], "kakao");
      assert.equal(state.selectMock.mock.calls.length, 0);
      await syncDiscordNicknames(["account.pubg"], "kakao");
      assert.equal(state.patchMock.mock.calls.length, 0);
    });

    await context.test("Discord 연동 조회 실패에도 플레이어 갱신 후 최근 경기 ID 수집을 계속한다", async (subtest) => {
      let saved = false;
      const errors: unknown[] = [];
      subtest.mock.method(globalThis, "fetch", async () => Response.json({
        data: [{
          id: "account.pubg", type: "player", attributes: { name: "NEW_NAME", clanId: "clan.bobo" },
          relationships: { matches: { data: [{ id: "match-a" }] } },
        }],
      }));
      subtest.mock.method(db, "transaction", async () => { saved = true; return []; });
      subtest.mock.method(db, "select", () => {
        assert.equal(saved, true);
        throw new Error("Nickname lookup unavailable");
      });
      const matchIds = await discoverMemberMatchIdsTask({
        targetClanId: "clan.bobo",
        targetClan: { id: "clan.bobo", platform: "kakao", name: "BOBO", tag: "BOBO", level: 1, memberCount: 2 },
        memberAccountIds: ["account.pubg"], clanPubgAccountIds: new Set(["account.pubg"]),
      }, { error: (...args: unknown[]) => errors.push(args) } as unknown as Logger, { requestCount: 0, rateLimitCount: 0 });
      assert.deepEqual(matchIds, ["match-a"]);
      assert.equal(errors.length, 1);
    });
  } finally {
    alias.mock.restore();
    if (previousToken === undefined) delete process.env.DISCORD_BOT_TOKEN;
    else process.env.DISCORD_BOT_TOKEN = previousToken;
    if (previousApiKey === undefined) delete process.env.PUBG_API_KEY;
    else process.env.PUBG_API_KEY = previousApiKey;
  }
});
