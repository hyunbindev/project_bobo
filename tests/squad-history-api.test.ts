import assert from "node:assert/strict";
import { test } from "node:test";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import Module, { createRequire } from "node:module";

// TEST_DATABASE_URL을 설정하고 node --conditions=react-server --import tsx --test tests/squad-history-api.test.ts로 실행.
test("전적 API는 입력 검증·페이지 보정·JSON 날짜·빈 조합을 처리한다", {
  skip: !process.env.TEST_DATABASE_URL,
}, async (context) => {
  process.env.DATABASE_URL ??= process.env.TEST_DATABASE_URL;
  // Next.js가 적용하는 server-only 서버 번들 alias를 Node 테스트에도 적용한다.
  const resolver = Module as unknown as {
    _resolveFilename(request: string, ...args: unknown[]): string;
  };
  const originalResolve = resolver._resolveFilename;
  const require = createRequire(`${process.cwd()}/package.json`);
  const alias = context.mock.method(resolver, "_resolveFilename", function (this: typeof resolver, request: string, ...args: unknown[]) {
    if (request === "server-only") return require.resolve("next/dist/compiled/server-only/empty.js");
    return originalResolve.call(this, request, ...args);
  });
  const { GET } = await import("../app/api/matches/[matchId]/rosters/[rosterId]/squad-history/route");
  alias.mock.restore();
  const { db } = await import("../lib/db");
  const client = new Client({ connectionString: process.env.TEST_DATABASE_URL });
  await client.connect();
  const database = drizzle({ client });
  context.mock.method(db, "execute", database.execute.bind(database));
  context.mock.method(db, "select", database.select.bind(database));
  const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const savedClanId = process.env.PUBG_CLAN_ID;
  process.env.PUBG_CLAN_ID = "test-clan";

  async function request(page = "1", matchId = uuid(1)) {
    return GET(new Request(`http://localhost/api/matches/${matchId}/rosters/roster/squad-history?page=${page}`), {
      params: Promise.resolve({ matchId, rosterId: "roster" }),
    });
  }

  try {
    await client.query("begin");
    await client.query(`
      create temp table clans (
        id uuid primary key, pubg_clan_id text, platform text, name text, tag text,
        level integer, member_count integer, last_synced_at timestamptz
      ) on commit drop;
      create temp table clan_members (
        id uuid, clan_id uuid, player_id uuid, status text, profile_registered boolean
      ) on commit drop;
      create temp table players (id uuid primary key, name text) on commit drop;
      create temp table matches (
        id uuid primary key, platform text, match_type text, game_mode text,
        map_name text, played_at timestamptz
      ) on commit drop;
      create temp table match_participants (
        match_id uuid, player_id uuid, pubg_roster_id text, team_rank integer,
        win_place integer, kills integer, damage_dealt double precision
      ) on commit drop;
    `);
    await client.query("insert into clans values ($1,'test-clan','kakao','Test','TEST',1,2,now())", [uuid(10)]);
    for (const n of [20, 21]) {
      await client.query("insert into players values ($1,$2)", [uuid(n), `Player${n}`]);
      await client.query("insert into clan_members values ($1,$2,$3,'active',true)", [uuid(n + 10), uuid(10), uuid(n)]);
    }
    await client.query("insert into matches values ($1,'kakao','competitive','squad','Baltic_Main','2026-10-22T12:00:00Z')", [uuid(1)]);
    await client.query("insert into match_participants values ($1,$2,'roster',1,1,2,300),($1,$3,'roster',1,1,3,400)", [uuid(1), uuid(20), uuid(21)]);

    assert.equal((await request("1", "invalid-id")).status, 400);
    for (const page of ["0", "-1", "1.5", "NaN", "Infinity", "9007199254740992"]) {
      assert.equal((await request(page)).status, 400, page);
    }
    const response = await request("999");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    const { data } = await response.json();
    assert.equal(data.page, 1);
    assert.equal(data.items.length, 1);
    assert.equal(data.matchCount, 1);
    assert.equal(data.items[0].damage, 700);
    assert.equal(data.items[0].playedAt, "2026-10-22T12:00:00.000Z");
    assert.deepEqual(await (await request("1", uuid(2))).json(), { data: null });
  } finally {
    if (savedClanId === undefined) delete process.env.PUBG_CLAN_ID;
    else process.env.PUBG_CLAN_ID = savedClanId;
    await client.query("rollback");
    await client.end();
  }
});
