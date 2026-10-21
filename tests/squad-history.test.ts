import assert from "node:assert/strict";
import { test } from "node:test";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SquadHistorySection, SquadMatchHistorySection } from "../components/clan-dashboard/squad-history";
import { MatchDetailTabs } from "../components/clan-dashboard/match-detail-tabs";
import { getMatchDetailTab, matchDetailHref } from "../lib/match-detail-navigation";
import type { SquadHistory } from "../lib/services/squad-history-service";
import { MatchHistoryTable } from "../components/clan-dashboard/match-history-table";
import { fetchSquadHistory } from "../lib/squad-history-client";

test("조합 전적 화면은 닉네임과 경기 목록을 표시하며 현재 경기 배지는 없다", () => {
  const history: SquadHistory = {
      members: [{ id: "player-a", name: "A<script>" }, { id: "player-b", name: "한글닉네임" }],
      matchCount: 14, winCount: 2, winRate: 2 / 14 * 100,
      averageRank: 3.6, averageDamage: 850,
      items: [{ matchId: "match", rosterId: "roster", mapName: "Baltic_Main", gameMode: "squad", matchType: "competitive", playedAt: new Date("2026-10-21T12:30:00Z"), rank: 1, kills: 8, damage: 1200 }],
      page: 2, totalPages: 2,
  };
  const summaryHtml = renderToStaticMarkup(createElement(SquadHistorySection, {
    history, mode: "경쟁전 · SQUAD",
  }));
  const listHtml = renderToStaticMarkup(createElement(SquadMatchHistorySection, {
    history, onPageChange: () => {},
  }));
  assert.ok(!summaryHtml.includes("<table"));
  assert.ok(listHtml.includes("<table"));
  assert.ok(listHtml.includes('id="squad-matches"'));
  assert.ok(summaryHtml.includes("SQUAD MEMBER"));
  const html = summaryHtml + listHtml;
  assert.ok(html.includes("함께한 클랜원 정보"));
  assert.ok(!html.includes("현재 경기"));
  assert.ok(html.includes("#3.6"));
  assert.ok(html.includes("A&lt;script&gt;"));
  assert.ok(html.includes("평균 클랜원 합산 딜량"));
  assert.ok(html.includes('href="/matches/match/rosters/roster"'));
  assert.ok(html.includes("disabled="));
  assert.ok(html.includes("클랜원 합산 킬"));
  assert.ok(!html.includes(">DBNO<"));
  assert.ok(!html.includes(">MEMBERS<"));
});

test("탭 기본값과 페이지 이동 시 함께한 전적 선택을 유지한다", () => {
  assert.equal(getMatchDetailTab({}), "match");
  assert.equal(getMatchDetailTab({ tab: "invalid" }), "match");
  assert.equal(getMatchDetailTab({ tab: ["history", "match"] }), "history");
  const query = { tab: "history", squadPage: "2", source: ["discord", "web"] };
  const next = new URL(matchDetailHref(query, "history", 3), "http://localhost");
  assert.equal(next.searchParams.get("tab"), "history");
  assert.equal(next.searchParams.get("squadPage"), "3");
  assert.deepEqual(next.searchParams.getAll("source"), ["discord", "web"]);
  assert.equal(next.hash, "#squad-matches");
  const match = new URL(matchDetailHref(query, "match"), "http://localhost");
  assert.equal(match.searchParams.get("tab"), "match");
  assert.equal(match.searchParams.get("squadPage"), "2");
  assert.equal(match.hash, "#match-records");
  for (const activeTab of ["match", "history"] as const) {
    const html = renderToStaticMarkup(createElement(MatchDetailTabs, {
      initialTab: activeTab, matchId: "match", rosterId: "roster",
    }, "이번 경기 내용"));
    assert.ok(html.includes("이번 경기"));
    assert.ok(html.includes("함께한 전적"));
    assert.equal((html.match(/aria-selected="true"/g) ?? []).length, 1);
    assert.equal((html.match(/role="tab"/g) ?? []).length, 2);
    assert.ok(html.includes('role="tabpanel"'));
    if (activeTab === "history") assert.ok(html.includes('role="status"'));
  }
});

test("비동기 전적 조회는 날짜를 복원하고 취소 신호와 페이지를 전달한다", async (context) => {
  const controller = new AbortController();
  const fetchMock = context.mock.method(globalThis, "fetch", async () => Response.json({
    data: {
      members: [], matchCount: 1, winCount: 1, winRate: 100, averageRank: 1,
      averageDamage: 300, page: 2, totalPages: 2,
      items: [{ matchId: "m", rosterId: "r", mapName: "Baltic_Main", gameMode: "squad", matchType: "competitive", playedAt: "2026-10-21T12:30:00Z", rank: 1, kills: 2, damage: 300 }],
    },
  }));
  const result = await fetchSquadHistory("match", "roster/id", 2, controller.signal);
  assert.ok(result?.items[0].playedAt instanceof Date);
  assert.equal(result.items[0].playedAt.toISOString(), "2026-10-21T12:30:00.000Z");
  const [url, options] = fetchMock.mock.calls[0].arguments as unknown as [string, RequestInit];
  assert.equal(url, "/api/matches/match/rosters/roster%2Fid/squad-history?page=2");
  assert.equal(options.signal, controller.signal);
  assert.equal(options.cache, "no-store");
});

test("비동기 API 실패·빈 기록·요청 취소를 구분한다", async (context) => {
  context.mock.method(globalThis, "fetch", async () => new Response(null, { status: 500 }));
  await assert.rejects(fetchSquadHistory("m", "r", 1, new AbortController().signal), /불러오지 못했습니다/);
  context.mock.restoreAll();
  context.mock.method(globalThis, "fetch", async () => Response.json({ data: null }));
  assert.equal(await fetchSquadHistory("m", "r", 1, new AbortController().signal), null);
  context.mock.restoreAll();
  context.mock.method(globalThis, "fetch", async () => { throw new DOMException("Aborted", "AbortError"); });
  await assert.rejects(fetchSquadHistory("m", "r", 1, new AbortController().signal), { name: "AbortError" });
});

test("공용 전적 표의 기본 팀 기록 표시를 유지한다", () => {
  const html = renderToStaticMarkup(createElement(MatchHistoryTable, {
    matches: [{
      matchId: "match", rosterId: "roster", mapName: "Baltic_Main",
      gameMode: "squad", matchType: "competitive", playedAt: new Date("2026-10-21T12:30:00Z"),
      rank: 1, kills: 8, damage: 1200, dbnos: 3, memberNames: ["PlayerA"],
    }],
  }));
  assert.ok(html.includes("TEAM KILLS"));
  assert.ok(html.includes("DBNO"));
  assert.ok(html.includes("MEMBERS"));
  assert.ok(html.includes("PlayerA"));
  assert.ok(!html.includes("현재 경기"));
  assert.ok(!html.includes("클랜원 합산"));
});

// TEST_DATABASE_URL을 지정하고 npx tsx --test tests/squad-history.test.ts로 실행한다.
// 트랜잭션 내부의 임시 테이블만 사용하며 실제 서비스 데이터는 변경하지 않는다.
test("조합 통계와 목록은 외부인·모드·소속·구성원을 동일하게 판정한다", {
  skip: !process.env.TEST_DATABASE_URL,
}, async (context) => {
  process.env.DATABASE_URL ??= process.env.TEST_DATABASE_URL;
  const { findSquadHistorySummary, findSquadHistoryMatches } = await import(
    "../lib/repositories/squad-history-repository"
  );
  const client = new Client({ connectionString: process.env.TEST_DATABASE_URL });
  await client.connect();
  const database = drizzle({ client });
  const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const clanId = uuid(100);
  const target = { matchId: uuid(1), rosterId: "roster", clanId };

  try {
    await client.query("begin");
    await client.query(`
      create temp table players (id uuid primary key, name text) on commit drop;
      create temp table clan_members (
        clan_id uuid, player_id uuid, status text, unique(clan_id, player_id)
      ) on commit drop;
      create temp table matches (
        id uuid primary key, platform text, match_type text, game_mode text,
        map_name text, played_at timestamptz
      ) on commit drop;
      create temp table match_participants (
        match_id uuid, player_id uuid, pubg_roster_id text,
        team_rank integer, win_place integer, kills integer, damage_dealt double precision,
        unique(match_id, player_id)
      ) on commit drop;
    `);
    for (let n = 1; n <= 6; n++) {
      await client.query("insert into players values ($1, $2)", [uuid(1000 + n), `Player${n}`]);
    }
    await client.query("insert into clan_members values ($1,$2,'active'),($1,$3,'active'),($1,$4,'active'),($1,$5,'left'),($6,$7,'active')", [
      clanId, uuid(1001), uuid(1002), uuid(1003), uuid(1004), uuid(101), uuid(1005),
    ]);

    async function match(
      n: number, members: number[], rank: number, damage: number,
      mode = "squad", type = "competitive", platform = "kakao",
    ) {
      await client.query("insert into matches values ($1,$2,$3,$4,'Baltic_Main',$5)", [
        uuid(n), platform, type, mode, new Date(Date.UTC(2026, 9, n)),
      ]);
      for (const player of members) {
        await client.query("insert into match_participants values ($1,$2,'roster',$3,$3,2,$4)", [
          uuid(n), uuid(1000 + player), rank, player <= 2 ? damage / 2 : 9999,
        ]);
      }
    }

    await match(1, [1, 2, 5, 6], 1, 300); // 외부 클랜원도 조합·딜량에서 제외
    await match(2, [2, 1, 4], 5, 600); // 순서 변경·탈퇴자는 조합에 영향 없음
    await match(3, [1, 2, 3], 1, 900); // 추가 클랜원: 다른 조합
    await match(4, [1, 6], 1, 100); // 클랜원 한 명: 다른 조합
    await match(5, [1, 2], 1, 900, "squad", "official");
    await match(6, [1, 2], 1, 900, "duo");
    await match(7, [1, 2], 1, 900, "squad", "competitive", "steam");
    await match(8, [1, 2], 1, 900);
    await client.query("update match_participants set pubg_roster_id = 'other-roster' where match_id = $1 and player_id = $2", [uuid(8), uuid(1002)]);
    await match(9, [1, 2], 1, 900);
    await match(10, [1, 2], 3, 200);

    const summary = await findSquadHistorySummary(target, database);
    assert.ok(summary);
    assert.equal(summary.matchCount, 4);
    assert.equal(summary.winCount, 2);
    assert.equal(summary.averageRank, 2.5);
    assert.equal(summary.averageDamage, 500);
    assert.deepEqual(summary.members.map((m) => m.name), ["Player1", "Player2"]);
    const items = await findSquadHistoryMatches(target, 10, 0, database);
    assert.deepEqual(items.map((m) => m.matchId), [10, 9, 2, 1].map(uuid));
    assert.equal(items.length, summary.matchCount);
    assert.equal(items.at(-1)?.damage, 300);
    assert.equal(items.at(-1)?.kills, 4);
    assert.ok(items[0].playedAt instanceof Date);
    assert.equal(await findSquadHistorySummary({ ...target, matchId: uuid(4) }, database), null);
    assert.equal(await findSquadHistorySummary({ ...target, matchId: uuid(999) }, database), null);

    for (let n = 11; n <= 20; n++) await match(n, [1, 2], 4, 100);
    await client.query("update matches set played_at = '2026-10-21T12:00:00Z' where id >= $1", [uuid(11)]);
    const firstPage = await findSquadHistoryMatches(target, 10, 0, database);
    const secondPage = await findSquadHistoryMatches(target, 10, 10, database);
    assert.equal(firstPage.length, 10);
    assert.equal(secondPage.length, 4);
    assert.equal(new Set([...firstPage, ...secondPage].map((m) => m.matchId)).size, 14);
    assert.equal((await findSquadHistorySummary(target, database))?.matchCount, 14);

    // Service도 같은 임시 테이블에서 조회해 페이지 보정과 승률을 검증한다.
    const { db } = await import("../lib/db");
    context.mock.method(db, "execute", database.execute.bind(database));
    const { getSquadHistory } = await import("../lib/services/squad-history-service");
    const lastPage = await getSquadHistory(target, 999);
    assert.ok(lastPage);
    assert.equal(lastPage.page, 2);
    assert.equal(lastPage.items.length, 4);
    assert.equal(lastPage.totalPages, 2);
    assert.equal(lastPage.winRate, 2 / 14 * 100);
    assert.equal((await getSquadHistory(target, -1))?.page, 1);
    assert.equal((await getSquadHistory(target, Infinity))?.page, 1);
    assert.equal((await getSquadHistory(target, 1.9))?.page, 1);
    assert.equal(await getSquadHistory({ ...target, matchId: uuid(4) }), null);
  } finally {
    await client.query("rollback");
    await client.end();
  }
});
