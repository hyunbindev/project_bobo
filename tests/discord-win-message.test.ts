import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import Module, { createRequire } from "node:module";
import type { Guild } from "discord.js";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import type { RecentWonMatch } from "../lib/matches/types";
import type { SquadSummary } from "../lib/squad-history/types";

const match: RecentWonMatch = {
  id: "match:roster", matchId: "00000000-0000-4000-8000-000000000001", rosterId: "roster",
  platform: "kakao", mapName: "Baltic_Main", gameMode: "squad", matchType: "competitive",
  playedAt: new Date("2026-10-26T12:00:00Z"), rank: 1, kills: 12, damage: 2450,
  members: [
    { id: "participant-b", pubgAccountId: "account.b", name: "Player_B", kills: 4, damage: 720 },
    { id: "participant-a", pubgAccountId: "account.a", name: "Player_A", kills: 5, damage: 980 },
  ],
};
const summary: SquadSummary = {
  members: [{ id: "a", name: "Player_A" }, { id: "b", name: "Player_B" }],
  matchCount: 32, winCount: 7, winRate: 7 / 32 * 100,
  averageRank: 5, averageDamage: 1500, previousMatchCount: 31,
  previousAverageKills: 5, previousAverageDamage: 1450, previousAverageRank: 6,
};

async function modules(context: TestContext) {
  process.env.DATABASE_URL ??= "postgresql://unused:unused@127.0.0.1:1/unused";
  const resolver = Module as unknown as { _resolveFilename(request: string, ...args: unknown[]): string };
  const original = resolver._resolveFilename;
  const require = createRequire(`${process.cwd()}/package.json`);
  const alias = context.mock.method(resolver, "_resolveFilename", function (this: typeof resolver, request: string, ...args: unknown[]) {
    return request === "server-only" ? require.resolve("next/dist/compiled/server-only/empty.js") : original.call(this, request, ...args);
  });
  try {
    return {
      ...await import("../lib/discord/messages/create-win-match-message"),
      ...await import("../lib/discord/messages/win-match-context"),
      ...await import("../lib/db"),
    };
  } finally { alias.mock.restore(); }
}

test("우승 메시지는 프로필·조합 기록·두 상세 링크를 포함하고 알림 멘션을 억제한다", async (context) => {
  const { createWinMatchMessage } = await modules(context);
  const previousUrl = process.env.APP_BASE_URL;
  process.env.APP_BASE_URL = "https://example.com";
  try {
    const message = createWinMatchMessage(match, {
      summary,
      profiles: new Map([["account.a", { userId: "123456789012345678", displayName: "Discord A" }]]),
    });
    const payload = message.components[0].toJSON();
    const text = JSON.stringify(payload);
    assert.deepEqual(message.allowedMentions, { parse: [] });
    assert.ok(text.includes("<@123456789012345678>"));
    assert.ok(text.includes("함께한 32매치 중 7번째 치킨"));
    assert.ok(!text.includes("조합 승률"));
    assert.ok(!text.includes("이번 조합 딜량"));
    assert.ok(!text.includes("이전 평균"));
    assert.ok(text.includes("2,450"));
    assert.ok(text.indexOf("Player\\\\_A") < text.indexOf("Player\\\\_B"));
    const sections = payload.components.filter((component) => component.type === 9);
    assert.equal(sections.length, 0);
    assert.ok(!text.includes('"type":11'));
    assert.ok(text.includes("#match-records"));
    assert.ok(text.includes("?squadHistory=open&squadPage=1#squad-summary"));
    assert.ok(!text.includes("자동 경기 알림"));
    assert.ok(!text.includes("-# Match"));
    const fallback = JSON.stringify(createWinMatchMessage(match).components[0].toJSON());
    assert.ok(!fallback.includes('"type":9'));
    assert.ok(!fallback.includes("번째 치킨"));
    assert.ok(fallback.includes("BOBO SQUAD"));
  } finally {
    if (previousUrl === undefined) delete process.env.APP_BASE_URL;
    else process.env.APP_BASE_URL = previousUrl;
  }
});

test("추가 데이터 조회 실패와 DM에서도 우승 메시지 생성용 빈 정보를 반환한다", async (context) => {
  const { loadWinMatchProfiles, loadWinMatchSummary, db } = await modules(context);
  assert.equal((await loadWinMatchProfiles(match, null)).size, 0);
  context.mock.method(db, "select", () => { throw new Error("Test database unavailable"); });
  assert.equal(await loadWinMatchSummary(match), null);
  assert.equal((await loadWinMatchProfiles(match, { id: "guild-a" } as Guild)).size, 0);
});

test("연동 이름과 멘션 정보를 사용자별 Discord API 조회 없이 반환한다", async (context) => {
  const { loadWinMatchProfiles, db } = await modules(context);
  const query = {
    from() { return this; },
    innerJoin() { return this; },
    where() { return Promise.resolve([
      { pubgAccountId: "account.a", discordUserId: "user1", discordDisplayName: "Stored A" },
      { pubgAccountId: "account.b", discordUserId: "user2", discordDisplayName: "Stored B" },
    ]); },
  };
  context.mock.method(db, "select", () => query);
  const fetched: string[] = [];
  const guild = { id: "guild-a", members: { fetch: async (id: string) => {
    fetched.push(id);
    if (id === "user2") throw new Error("Member unavailable");
    return { id, displayName: "Current A" };
  } } } as unknown as Guild;
  const profiles = await loadWinMatchProfiles(match, guild);
  assert.deepEqual(fetched, []);
  assert.equal(profiles.get("account.a")?.displayName, "Stored A");
  assert.equal(profiles.get("account.a")?.userId, "user1");
  assert.equal(profiles.get("account.b")?.displayName, "Stored B");
  assert.equal(profiles.get("account.b")?.userId, "user2");
  assert.equal(profiles.get("participant-a"), undefined);
});

test("연동 정보는 고정 PUBG ID·플랫폼·발송 서버로 조회한다", {
  skip: !process.env.TEST_DATABASE_URL,
}, async (context) => {
  const { loadWinMatchProfiles, db } = await modules(context);
  const client = new Client({ connectionString: process.env.TEST_DATABASE_URL });
  await client.connect();
  const database = drizzle({ client });
  context.mock.method(db, "select", database.select.bind(database));
  try {
    await client.query("begin");
    await client.query(`
      create temp table players (id uuid, pubg_account_id text, platform text) on commit drop;
      create temp table clan_members (id uuid, player_id uuid, status text) on commit drop;
      create temp table clan_member_discord_accounts (clan_member_id uuid, discord_guild_id text, discord_user_id text, discord_display_name text) on commit drop;
    `);
    const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
    for (const [n, account, platform, status, guild] of [
      [1, "account.a", "kakao", "active", "guild-a"],
      [2, "account.b", "kakao", "active", "guild-a"],
      [3, "account.a", "steam", "active", "guild-a"],
      [4, "account.a", "kakao", "left", "guild-a"],
      [5, "account.a", "kakao", "active", "guild-b"],
    ] as const) {
      await client.query("insert into players values ($1,$2,$3)", [uuid(n), account, platform]);
      await client.query("insert into clan_members values ($1,$1,$2)", [uuid(n), status]);
      await client.query("insert into clan_member_discord_accounts values ($1,$2,$3,$4)", [uuid(n), guild, `user${n}`, `Stored${n}`]);
    }
    const fetched: string[] = [];
    const guild = { id: "guild-a", members: { fetch: async (id: string) => {
      fetched.push(id);
      if (id === "user2") throw new Error("Member unavailable");
      return { id, displayName: "Current A" };
    } } } as unknown as Guild;
    const profiles = await loadWinMatchProfiles(match, guild);
    assert.deepEqual(fetched, []);
    assert.equal(profiles.get("account.a")?.displayName, "Stored1");
    assert.equal(profiles.get("account.a")?.userId, "user1");
    assert.equal(profiles.get("account.b")?.displayName, "Stored2");
    assert.equal(profiles.get("account.b")?.userId, "user2");
    assert.equal(profiles.get("participant-a"), undefined);
  } finally {
    await client.query("rollback");
    await client.end();
  }
});
