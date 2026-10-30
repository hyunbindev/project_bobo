import { sql } from "drizzle-orm";

import { matchParticipants } from "@/lib/db/schema";
import { findMetricRankings } from "@/lib/rankings/repositories/common-ranking-repository";
import type { RankingRepositoryInput } from "@/lib/rankings/types";

export function findZeroDamageRankings(input: RankingRepositoryInput) {
  return findMetricRankings({
    ...input,
    // 전체 유효 경기 중 대미지를 전혀 주지 못한 경기만 센다.
    metric: sql<number>`
      cast(
        count(*) filter (
          where ${matchParticipants.damageDealt} = 0
        )
        as integer
      )
    `,
  });
}
