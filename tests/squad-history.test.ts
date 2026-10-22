import assert from "node:assert/strict";
import { test } from "node:test";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SquadHistorySection, SquadMatchHistorySection, SquadMatchHistorySkeleton } from "../components/clan-dashboard/squad-history";
import { SquadHistoryAccordion } from "../components/clan-dashboard/squad-history-accordion";
import { getMatchDetailScrollTarget, getSquadHistoryNavigation, squadHistoryHref } from "../lib/match-detail-navigation";
import type { SquadHistory } from "../lib/services/squad-history-service";
import { MatchHistoryTable } from "../components/clan-dashboard/match-history-table";
import { fetchSquadHistory } from "../lib/squad-history-client";

test("조합 비교는 동일 멤버의 이전 평균과 승률을 표시하고 목록의 여백을 예약하지 않는다", () => {
  const history: SquadHistory = {
      members: [{ id: "player-a", name: "A<script>" }, { id: "player-b", name: "한글닉네임" }],
      matchCount: 14, winCount: 2, winRate: 2 / 14 * 100,
      averageRank: 3.6, averageDamage: 850,
      previousMatchCount: 13, previousAverageKills: 6, previousAverageDamage: 800, previousAverageRank: 3.8,
      items: [{ matchId: "match", rosterId: "roster", mapName: "Baltic_Main", gameMode: "squad", matchType: "competitive", playedAt: new Date("2026-10-21T12:30:00Z"), rank: 1, kills: 8, damage: 1200 }],
      page: 2, totalPages: 2,
  };
  const summaryHtml = renderToStaticMarkup(createElement(SquadHistorySection, {
    history, mode: "경쟁전 · SQUAD", current: { kills: 8, damage: 1200, rank: 1 },
  }));
  const listHtml = renderToStaticMarkup(createElement(SquadMatchHistorySection, {
    history, onPageChange: () => {},
  }));
  assert.ok(summaryHtml.includes("<table"));
  assert.ok(listHtml.includes("<table"));
  assert.ok(summaryHtml.includes("이전 13경기 평균"));
  assert.ok(summaryHtml.includes("승률"));
  const html = summaryHtml + listHtml;
  assert.ok(html.includes("함께한 기록과 이번 경기"));
  assert.ok(!html.includes("현재 경기"));
  assert.ok(html.includes("#3.8"));
  assert.ok(html.includes("A&lt;script&gt;"));
  assert.ok(html.includes("(+400)"));
  assert.ok(html.includes("(+2.8)"));
  assert.ok(html.includes("2번째 치킨 경기"));
  assert.ok(!html.includes("min-h-240"));
  assert.ok(!html.includes("min-h-225"));
  assert.ok(html.includes('href="/matches/match/rosters/roster"'));
  assert.ok(html.includes("disabled="));
  assert.ok(html.includes("클랜원 합산 킬"));
  assert.ok(!html.includes(">DBNO<"));
  assert.ok(!html.includes(">MEMBERS<"));
});

test("첫 경기는 비교 수치를 만들어내지 않는다", () => {
  const html = renderToStaticMarkup(createElement(SquadHistorySection, {
    history: { members: [], matchCount: 1, winCount: 1, winRate: 100, averageRank: 1, averageDamage: 300,
      previousMatchCount: 0, previousAverageKills: null, previousAverageDamage: null, previousAverageRank: null },
    mode: "일반전 · SQUAD", current: { kills: 2, damage: 300, rank: 1 },
  }));
  assert.ok(html.includes("1번째 치킨 경기"));
  assert.ok(!html.includes("NaN"));
  assert.ok(!html.includes("딜 더"));
  assert.ok(!html.includes("이전 경기 평균 대비 변화량"));
});

test("감소량은 빨간색, 동일 수치는 중립색이며 비우승 경기를 치킨으로 표시하지 않는다", () => {
  const html = renderToStaticMarkup(createElement(SquadHistorySection, {
    history: { members: [{ id: "a", name: "PlayerA" }], matchCount: 5, winCount: 2, winRate: 40,
      averageRank: 3, averageDamage: 400, previousMatchCount: 4,
      previousAverageKills: 2, previousAverageDamage: 450, previousAverageRank: 3 },
    mode: "일반전 · SQUAD", current: { kills: 2, damage: 400, rank: 5 },
  }));
  assert.match(html, /text-destructive[^>]*[^]*?\(-50\)/);
  assert.ok(html.includes("(-2)"));
  assert.ok(html.includes("(0)"));
  assert.ok(html.includes("PlayerA의 "));
  assert.ok(html.includes("5번째 함께한 경기"));
  assert.ok(!html.includes("번째 치킨 경기"));
});

test("경기 목록은 기본 접힘이며 기존 탭 링크와 페이지 이동 URL을 지원한다", () => {
  assert.equal(getMatchDetailScrollTarget("#match-records"), "match-records");
  assert.equal(getMatchDetailScrollTarget("#squad-matches"), "squad-matches");
  assert.equal(getMatchDetailScrollTarget("#unknown"), null);
  assert.equal(getMatchDetailScrollTarget(""), null);
  assert.deepEqual(getSquadHistoryNavigation({}), { open: false, page: 1 });
  assert.deepEqual(getSquadHistoryNavigation({ tab: "invalid", squadPage: "-2" }), { open: true, page: 1 });
  assert.equal(getSquadHistoryNavigation({ tab: ["history", "match"] }).open, true);
  const query = { tab: "history", squadPage: "2", source: ["discord", "web"] };
  const next = new URL(squadHistoryHref(query, true, 3), "http://localhost");
  assert.equal(next.searchParams.get("tab"), null);
  assert.equal(next.searchParams.get("squadHistory"), "open");
  assert.equal(next.searchParams.get("squadPage"), "3");
  assert.deepEqual(next.searchParams.getAll("source"), ["discord", "web"]);
  assert.equal(next.hash, "#squad-matches");
  const collapsed = new URL(squadHistoryHref(query, false), "http://localhost");
  assert.equal(collapsed.searchParams.has("squadPage"), false);
  assert.equal(collapsed.hash, "#squad-history");
  const html = renderToStaticMarkup(createElement(SquadHistoryAccordion, { matchId: "match", rosterId: "roster", matchCount: 14 }));
  assert.ok(html.includes("<button"));
  assert.ok(html.includes('aria-expanded="false"'));
  assert.ok(!html.includes('role="tab"'));
  assert.ok(!html.includes('role="status"'));
});

test("목록 로딩 상태는 고정 목록 높이 없이 표시한다", () => {
  const html = renderToStaticMarkup(createElement(SquadMatchHistorySkeleton));
  assert.ok(html.includes('role="status"'));
  assert.ok(html.includes('aria-busy="true"'));
  assert.ok(html.includes('aria-label="함께한 경기 기록 로딩 중"'));
  assert.ok(!html.includes("함께한 경기 기록을 불러오는 중입니다."));
  assert.ok(!html.includes("<a "));
  assert.ok(!html.includes("<button"));
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
test("정확한 조합과 경기 시점으로 집계하고 이번 경기를 이전 평균에서 제외한다", {
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
    for (let n = 1; n <= 7; n++) {
      await client.query("insert into players values ($1, $2)", [uuid(1000 + n), `Player${n}`]);
    }
    await client.query("insert into clan_members values ($1,$2,'active'),($1,$3,'active'),($1,$4,'active'),($1,$5,'left'),($6,$7,'active')", [
      clanId, uuid(1001), uuid(1002), uuid(1003), uuid(1004), uuid(101), uuid(1005),
    ]);
    await client.query("insert into clan_members values ($1,$2,'active')", [clanId, uuid(1007)]);

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
    await match(3, [1, 2, 3], 1, 900); // AB 조회에 ABC 경기도 포함
    await match(0, [1, 2, 3, 7], 2, 1000); // AB·ABC 조회에 ABCD 경기도 포함
    await match(4, [1, 6], 1, 100); // 클랜원 한 명: 다른 조합
    await match(5, [1, 2], 1, 900, "squad", "official");
    await match(6, [1, 2], 1, 900, "duo");
    await match(7, [1, 2], 1, 900, "squad", "competitive", "steam");
    await match(8, [1, 2], 1, 900);
    await client.query("update match_participants set pubg_roster_id = 'other-roster' where match_id = $1 and player_id = $2", [uuid(8), uuid(1002)]);
    await match(9, [1, 2], 1, 900);
    await match(10, [1, 2], 3, 200);
    await client.query("update matches set played_at = '2026-10-22T12:00:00Z' where id = $1", [uuid(1)]);
    await client.query("update matches set played_at = '2026-10-23T12:00:00Z' where id = $1", [uuid(9)]);

    const summary = await findSquadHistorySummary(target, database);
    assert.ok(summary);
    assert.equal(summary.matchCount, 3);
    assert.equal(summary.winCount, 1);
    assert.equal(summary.averageRank, 3);
    assert.equal(summary.averageDamage, 1100 / 3);
    assert.equal(summary.previousMatchCount, 2);
    assert.equal(summary.previousAverageKills, 4);
    assert.equal(summary.previousAverageDamage, 400);
    assert.equal(summary.previousAverageRank, 4);
    assert.deepEqual(summary.members.map((m) => m.name), ["Player1", "Player2"]);
    const items = await findSquadHistoryMatches(target, 10, 0, database);
    assert.deepEqual(items.map((m) => m.matchId), [1, 10, 2].map(uuid));
    assert.equal(items.length, summary.matchCount);
    assert.equal(items.at(-1)?.damage, 600);
    assert.equal(items.at(-1)?.kills, 4);
    assert.equal(items.find((m) => m.matchId === uuid(3)), undefined);
    const triple = await findSquadHistorySummary({ ...target, matchId: uuid(3) }, database);
    assert.ok(triple);
    assert.equal(triple.matchCount, 1);
    assert.equal(triple.winCount, 1);
    assert.equal(triple.averageRank, 1);
    assert.equal(triple.averageDamage, 10899);
    assert.equal(triple.previousMatchCount, 0);
    assert.equal(triple.previousAverageDamage, null);
    assert.equal((await findSquadHistorySummary({ ...target, matchId: uuid(0) }, database))?.matchCount, 1);
    assert.ok(items[0].playedAt instanceof Date);
    assert.equal(await findSquadHistorySummary({ ...target, matchId: uuid(4) }, database), null);
    assert.equal(await findSquadHistorySummary({ ...target, matchId: uuid(999) }, database), null);

    for (let n = 11; n <= 20; n++) await match(n, [1, 2], 4, 100);
    await client.query("update matches set played_at = '2026-10-21T12:00:00Z' where id >= $1", [uuid(11)]);
    const firstPage = await findSquadHistoryMatches(target, 10, 0, database);
    const secondPage = await findSquadHistoryMatches(target, 10, 10, database);
    assert.equal(firstPage.length, 10);
    assert.equal(secondPage.length, 3);
    assert.equal(new Set([...firstPage, ...secondPage].map((m) => m.matchId)).size, 13);
    assert.equal((await findSquadHistorySummary(target, database))?.matchCount, 13);

    // Service도 같은 임시 테이블에서 조회해 페이지 보정과 승률을 검증한다.
    const { db } = await import("../lib/db");
    context.mock.method(db, "execute", database.execute.bind(database));
    const { getSquadHistory } = await import("../lib/services/squad-history-service");
    const lastPage = await getSquadHistory(target, 999);
    assert.ok(lastPage);
    assert.equal(lastPage.page, 2);
    assert.equal(lastPage.items.length, 3);
    assert.equal(lastPage.totalPages, 2);
    assert.equal(lastPage.winRate, 1 / 13 * 100);
    assert.equal((await getSquadHistory(target, -1))?.page, 1);
    assert.equal((await getSquadHistory(target, Infinity))?.page, 1);
    assert.equal((await getSquadHistory(target, 1.9))?.page, 1);
    assert.equal(await getSquadHistory({ ...target, matchId: uuid(4) }), null);
  } finally {
    await client.query("rollback");
    await client.end();
  }
});
