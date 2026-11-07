import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { test } from "node:test";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";

test("수집된 Discord 행은 등록 시 같은 ID로 연결하고 기존 설정을 보존한다", async (context) => {
  process.env.DATABASE_URL ??= "postgresql://unused:unused@127.0.0.1:1/unused";
  const resolver = Module as unknown as { _resolveFilename(request: string, ...args: unknown[]): string };
  const original = resolver._resolveFilename;
  const require = createRequire(`${process.cwd()}/package.json`);
  const alias = context.mock.method(resolver, "_resolveFilename", function (
    this: typeof resolver, request: string, ...args: unknown[]
  ) {
    return request === "server-only" ? require.resolve("next/dist/compiled/server-only/empty.js") : original.call(this, request, ...args);
  });
  try {
    const { linkDiscordAccount } = await import("../lib/discord-accounts/repository");
    const { db } = await import("../lib/db");
    const { playerDiscordAccounts, players } = await import("../lib/db/schema");
    alias.mock.restore();
    const input = {
      discordGuildId: "guild-a", discordUserId: "user-a", discordUsername: "", discordDisplayName: "",
      name: "Member", birthYear: 1998,
      player: { accountId: "account.test", name: "PUBG_NAME", platform: "kakao" as const, clanId: null, matchIds: [] },
    };
    const existing = {
      id: "collected-row", playerId: null as string | null, name: null, birthYear: null,
      discordUsername: "original-username", discordDisplayName: "original-display-name", isAutoSync: false,
    };
    let accountWrites = 0;
    const tx = {
      select(fields: Record<string, unknown>) {
        return { from: () => ({ where: () => ({ limit: async () =>
          "playerId" in fields ? [{ playerId: existing.playerId }] : [] }) }) };
      },
      insert(table: unknown) {
        return { values(values: Record<string, unknown>) {
          return { onConflictDoUpdate(options: { set: Record<string, unknown>; setWhere?: SQL }) {
            if (table === players) return { returning: async () => [{ id: "player-a", ...values }] };
            assert.equal(table, playerDiscordAccounts);
            assert.ok(options.setWhere);
            const query = new PgDialect().sqlToQuery(options.setWhere);
            assert.match(query.sql, /"player_id" is null or/);
            assert.deepEqual(query.params, ["player-a"]);
            assert.equal(options.set.isAutoSync, undefined);
            assert.equal(options.set.discordDisplayName, undefined);
            assert.equal(options.set.discordUsername, undefined);
            accountWrites++;
            return { returning: async () => [{ ...existing, ...options.set }] };
          } };
        } };
      },
    };
    context.mock.method(db, "transaction", async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx));
    const { account } = await linkDiscordAccount(input);
    assert.equal(account.id, existing.id);
    assert.equal(account.playerId, "player-a");
    assert.equal(account.name, input.name);
    assert.equal(account.birthYear, input.birthYear);
    assert.equal(account.isAutoSync, false);
    assert.equal(account.discordDisplayName, existing.discordDisplayName);
    assert.equal(account.discordUsername, existing.discordUsername);
    assert.equal(accountWrites, 1);

    // 수집 행은 연결 가능하지만, 이미 다른 PUBG 계정과 연결된 행은 바꾸지 않는다.
    existing.playerId = "another-player";
    await assert.rejects(linkDiscordAccount(input), /이미 등록/);
    assert.equal(accountWrites, 1);
  } finally {
    alias.mock.restore();
  }
});
