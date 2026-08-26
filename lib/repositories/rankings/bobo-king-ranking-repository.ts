import { sql } from "drizzle-orm";

import { matchParticipants } from "@/lib/db/schema";
import {
  findMetricRankings,
  type RankingRepositoryInput,
} from "@/lib/repositories/rankings/common-ranking-repository";

export function findBoboKingRankings(input: RankingRepositoryInput) {
  return findMetricRankings({
    ...input,
    // (총 킬 × 총 대미지 × 총 기절) ÷ 경기 수
    metric: sql<number>`
      cast(
        (
          coalesce(sum(${matchParticipants.kills}), 0) *
          coalesce(sum(${matchParticipants.damageDealt}), 0) *
          coalesce(sum(${matchParticipants.dbnos}), 0)
        ) / nullif(count(*), 0)
        as double precision
      )
    `,
  });
}
