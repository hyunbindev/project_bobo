import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { test, type TestContext } from "node:test";
import type { VoiceState } from "discord.js";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

test("음성 활동은 미연동 회원만 수집하고 DM·닉네임 변경을 실행하지 않는다", async (context) => {
  process.env.DATABASE_URL ??= "postgresql://unused:unused@127.0.0.1:1/unused";
  const previousClanId = process.env.PUBG_CLAN_ID;
  process.env.PUBG_CLAN_ID = "clan.main";
  const previousApiKey = process.env.PUBG_API_KEY;
  process.env.PUBG_API_KEY = "test-api-key";
  const resolver = Module as unknown as { _resolveFilename(request: string, ...args: unknown[]): string };
  const original = resolver._resolveFilename;
  const require = createRequire(`${process.cwd()}/package.json`);
  const alias = context.mock.method(resolver, "_resolveFilename", function (
    this: typeof resolver, request: string, ...args: unknown[]
  ) {
    return request === "server-only" ? require.resolve("next/dist/compiled/server-only/empty.js") : original.call(this, request, ...args);
  });

  try {
    const { handleVoiceStateUpdate } = await import("../lib/discord/members/handle-voice-state-update");
    const { db } = await import("../lib/db");
    const { playerDiscordAccounts } = await import("../lib/db/schema");
    const { players } = await import("../lib/db/schema");
    const { REST } = await import("discord.js");
    const { discordLogger } = await import("../lib/logger");
    alias.mock.restore();

    function setup(subtest: TestContext) {
      const joinedAt = new Date("2026-10-01T00:00:00Z");
      const send = subtest.mock.fn(async () => { throw new Error("DM must not be sent"); });
      const setNickname = subtest.mock.fn(async () => { throw new Error("Nickname must not be changed"); });
      const member = { user: { bot: false, username: "discord-user" }, displayName: "현빈 98 / Nopanty_B_cup", joinedAt, send, setNickname };
      const fetch = subtest.mock.fn(async () => member);
      const state = {
        id: "392287872381616130", channelId: "voice-a",
        guild: { id: "1543197573429465188", members: { fetch } }, member,
      } as unknown as VoiceState;
      let registered = false;
      let fail = false;
      let storedPlayer = true;
      let clanId: string | null = "clan.main";
      const saved = new Map<string, Record<string, unknown>>();
      const playerWrites: unknown[] = [];
      const info = subtest.mock.method(discordLogger, "info", () => undefined);
      const warn = subtest.mock.method(discordLogger, "warn", () => undefined);
      const patch = subtest.mock.method(REST.prototype, "patch", async () => { throw new Error("Discord must not be modified"); });
      const api = subtest.mock.method(globalThis, "fetch", async () => new Response("unavailable", { status: 503 }));
      const select = subtest.mock.method(db, "select", () => ({
        from(table: unknown) {
          if (table === players) {
            return { where(condition: SQL) {
              assert.deepEqual(new PgDialect().sqlToQuery(condition).params, ["Nopanty_B_cup", "kakao"]);
              return { limit: async () => storedPlayer ? [{
                pubgAccountId: "account.test", name: "Nopanty_B_cup", platform: "kakao", pubgClanId: clanId,
              }] : [] };
            } };
          }
          assert.equal(table, playerDiscordAccounts);
          return { where(condition: SQL) {
            const query = new PgDialect().sqlToQuery(condition);
            assert.match(query.sql, /discord_guild_id/);
            assert.match(query.sql, /discord_user_id/);
            assert.match(query.sql, /"player_id" is not null/);
            assert.match(query.sql, /"name" is not null/);
            assert.match(query.sql, /"birth_year" is not null/);
            assert.equal(query.params.length, 3);
            assert.equal(query.params[2], "failed");
            assert.equal(query.params[1], state.id);
            return { limit: async () => registered || saved.has(`${query.params[0]}:${query.params[1]}`)
              ? [{ id: "registered-account" }] : [] };
          } };
        },
      }));
      const tx = {
        select: () => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }),
        insert(table: unknown) {
          return { values(input: Record<string, unknown>) {
            return { onConflictDoUpdate(options: { target: unknown[]; set: Record<string, unknown> }) {
              if (table === players) { playerWrites.push(input); return { returning: async () => [{ id: "player-a", ...input }] }; }
              assert.equal(table, playerDiscordAccounts);
              assert.deepEqual(options.target, [playerDiscordAccounts.discordGuildId, playerDiscordAccounts.discordUserId]);
              assert.equal(input.playerId, clanId === "clan.main" ? "player-a" : null);
              assert.equal(input.name, "현빈");
              assert.equal(input.birthYear, 1998);
              assert.equal(input.isAutoSync, false);
              assert.equal(options.set.isAutoSync, false);
              return { returning: async () => {
                const key = `${input.discordGuildId}:${input.discordUserId}`;
                saved.set(key, input);
                return [{ id: "collected-member", ...input }];
              } };
            } };
          } };
        },
      };
      const insert = subtest.mock.method(db, "transaction", async (callback: (transaction: typeof tx) => Promise<unknown>) => {
        if (fail) throw Object.assign(new Error("DB unavailable"), { code: "DB_FAILED" });
        return callback(tx);
      });
      return { state, member, saved, playerWrites, select, insert, info, warn, fetch, send, setNickname, patch, api,
        missPlayer: () => { storedPlayer = false; },
        clan: (value: string | null) => { clanId = value; },
        register: () => { registered = true; }, fail: (value: boolean) => { fail = value; } };
    }

    await context.test("입장·이동 시 서버별로 최초 한 번 저장하고 동시·반복 이벤트도 중복되지 않는다", async (subtest) => {
      const s = setup(subtest);
      const disconnected = { ...s.state, channelId: null } as VoiceState;
      await Promise.all([handleVoiceStateUpdate(disconnected, s.state), handleVoiceStateUpdate(disconnected, s.state)]);
      assert.equal(s.insert.mock.calls.length, 1);
      await handleVoiceStateUpdate(s.state, { ...s.state, channelId: "voice-b" } as VoiceState);
      assert.equal(s.saved.size, 1);
      assert.deepEqual([...s.saved.values()][0], {
        discordGuildId: s.state.guild.id, discordUserId: s.state.id,
        discordUsername: "discord-user", discordDisplayName: "현빈 98 / Nopanty_B_cup",
        playerId: "player-a", name: "현빈", birthYear: 1998,
        isAutoSync: false,
      });
      const otherGuild = { ...s.state, guild: { ...s.state.guild, id: "1543197575690063880" } } as VoiceState;
      await handleVoiceStateUpdate(disconnected, otherGuild);
      assert.equal(s.saved.size, 2);
      assert.equal(s.info.mock.calls.length, 2);
      assert.equal(s.send.mock.calls.length, 0);
      assert.equal(s.setNickname.mock.calls.length, 0);
      assert.equal(s.patch.mock.calls.length, 0);
      assert.equal(s.api.mock.calls.length, 0);
    });

    await context.test("퇴장과 음소거 변경은 조회·저장하지 않는다", async (subtest) => {
      const s = setup(subtest);
      await handleVoiceStateUpdate(s.state, { ...s.state, channelId: null } as VoiceState);
      await handleVoiceStateUpdate(s.state, s.state);
      assert.equal(s.select.mock.calls.length, 0);
      assert.equal(s.insert.mock.calls.length, 0);
    });

    await context.test("표시 이름 형식 오류·미래 출생연도는 계정 조회와 저장을 생략한다", async (subtest) => {
      const s = setup(subtest);
      const previous = { ...s.state, channelId: null } as VoiceState;
      for (const displayName of ["일반닉네임", "현빈 50 / Nopanty_B_cup"]) {
        s.member.displayName = displayName;
        await handleVoiceStateUpdate(previous, s.state);
      }
      assert.equal(s.insert.mock.calls.length, 0);
      assert.equal(s.api.mock.calls.length, 0);
      assert.equal(s.select.mock.calls.length, 2); // 등록 여부 조회만 실행
    });

    await context.test("PUBG 조회 실패는 저장·Discord 변경 없이 기록하고 다음 이벤트에서 재시도한다", async (subtest) => {
      const s = setup(subtest);
      s.missPlayer();
      const previous = { ...s.state, channelId: null } as VoiceState;
      await handleVoiceStateUpdate(previous, s.state);
      assert.equal(s.api.mock.calls.length, 1);
      assert.equal(s.insert.mock.calls.length, 0);
      assert.equal(s.saved.size, 0);
      assert.equal(s.warn.mock.calls.length, 1);
      assert.equal(s.patch.mock.calls.length, 0);
      await handleVoiceStateUpdate(previous, s.state);
      assert.equal(s.api.mock.calls.length, 2);
    });

    await context.test("봇 계정과 현재 서버에서 연동된 회원은 제외한다", async (subtest) => {
      const s = setup(subtest);
      const previous = { ...s.state, channelId: null } as VoiceState;
      s.member.user.bot = true;
      await handleVoiceStateUpdate(previous, s.state);
      assert.equal(s.select.mock.calls.length, 0);
      s.member.user.bot = false;
      s.register();
      await handleVoiceStateUpdate(previous, s.state);
      assert.equal(s.insert.mock.calls.length, 0);
    });

    await context.test("캐시가 없는 회원은 개별 조회하고 실패 후 다음 입장에서 재수집할 수 있다", async (subtest) => {
      const s = setup(subtest);
      const uncached = { ...s.state, member: null } as VoiceState;
      const previous = { ...s.state, channelId: null } as VoiceState;
      s.fail(true);
      await handleVoiceStateUpdate(previous, uncached);
      assert.equal(s.warn.mock.calls.length, 1);
      assert.equal(s.saved.size, 0);
      s.fail(false);
      await handleVoiceStateUpdate(previous, uncached);
      assert.equal(s.fetch.mock.calls.length, 2);
      assert.deepEqual(s.fetch.mock.calls[0].arguments, [s.state.id]);
      assert.equal(s.saved.size, 1);
    });
    await context.test("clan mismatch and no clan persist failed profiles without player writes or retries", async (subtest) => {
      for (const clanId of ["clan.other", null]) {
        const s = setup(subtest);
        s.clan(clanId);
        const previous = { ...s.state, channelId: null } as VoiceState;
        await handleVoiceStateUpdate(previous, s.state);
        const account = [...s.saved.values()][0];
        assert.equal(account.playerId, null);
        assert.equal(account.nicknameStatus, "failed");
        assert.equal(account.nicknameError, "PUBG_CLAN_MISMATCH");
        assert.equal(account.discordGuildId, s.state.guild.id);
        assert.equal(account.discordUserId, s.state.id);
        assert.equal(account.discordDisplayName, s.member.displayName);
        assert.equal(account.birthYear, 1998);
        assert.equal(s.playerWrites.length, 0);
        await handleVoiceStateUpdate(previous, s.state);
        assert.equal(s.insert.mock.calls.length, 1);
        assert.equal(s.api.mock.calls.length, 0);
        subtest.mock.restoreAll();
      }
    });

    await context.test("missing PUBG account persists terminal failure and skips subsequent API lookup", async (subtest) => {
      const s = setup(subtest);
      s.missPlayer();
      s.clan(null);
      s.api.mock.mockImplementation(async () => new Response(JSON.stringify({ data: [] }), { status: 200 }));
      const previous = { ...s.state, channelId: null } as VoiceState;
      await handleVoiceStateUpdate(previous, s.state);
      assert.equal([...s.saved.values()][0].nicknameError, "PUBG_PLAYER_NOT_FOUND");
      assert.equal([...s.saved.values()][0].playerId, null);
      assert.equal(s.playerWrites.length, 0);
      await handleVoiceStateUpdate(previous, s.state);
      assert.equal(s.api.mock.calls.length, 1);
    });
  } finally {
    alias.mock.restore();
    if (previousClanId === undefined) delete process.env.PUBG_CLAN_ID;
    else process.env.PUBG_CLAN_ID = previousClanId;
    if (previousApiKey === undefined) delete process.env.PUBG_API_KEY;
    else process.env.PUBG_API_KEY = previousApiKey;
  }
});
