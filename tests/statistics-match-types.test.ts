import assert from "node:assert/strict";
import { test } from "node:test";
import { sql } from "drizzle-orm";

test("최고 기록과 모든 랭킹 쿼리는 일반전·경쟁전을 허용 목록으로 제한한다", async (context) => {
  // 실제 DB 연결 없이 저장소가 생성하는 SQL과 바인딩 값을 확인한다.
  process.env.DATABASE_URL ??= "postgresql://unused:unused@127.0.0.1:1/unused";
  const { pool } = await import("../lib/db");
  const { findPlayerHighRecord } = await import("../lib/player-stats/repository");
  const { findMetricRankings } = await import("../lib/rankings/repositories/common-ranking-repository");
  const { findDamageCarryRankings } = await import("../lib/rankings/repositories/damage-carry-ranking-repository");
  const { findSpectatorRankings } = await import("../lib/rankings/repositories/spectator-ranking-repository");

  const queries: Array<{ text: string; values: unknown[] }> = [];
  context.mock.method(pool, "query", async (query: { text: string }, values: unknown[]) => {
    queries.push({ text: query.text, values });
    return { rows: [] };
  });

  const input = {
    clanId: "00000000-0000-4000-8000-000000000001",
    startAt: new Date("2026-10-25T15:00:00Z"),
    endAt: new Date("2026-11-01T15:00:00Z"),
    limit: 4,
  };

  await findPlayerHighRecord("00000000-0000-4000-8000-000000000002");
  await findMetricRankings({ ...input, metric: sql<number>`1` });
  await findDamageCarryRankings(input);
  await findSpectatorRankings(input);

  assert.equal(queries.length, 4);
  for (const query of queries) {
    const filter = query.text.match(/"matches"\."match_type" in \(\$(\d+), \$(\d+)\)/);
    assert.ok(filter, "match_type을 두 값의 IN 조건으로 제한해야 한다");
    assert.deepEqual(
      [query.values[Number(filter[1]) - 1], query.values[Number(filter[2]) - 1]],
      ["official", "competitive"],
    );
  }
});
