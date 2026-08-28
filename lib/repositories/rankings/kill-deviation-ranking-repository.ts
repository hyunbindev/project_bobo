import { sql } from "drizzle-orm";

import { matchParticipants } from "@/lib/db/schema";
import {
  findMetricRankings,
  type RankingRepositoryInput,
} from "@/lib/repositories/rankings/common-ranking-repository";

export function findKillDeviationRankings(input: RankingRepositoryInput) {
  return findMetricRankings({
    ...input,
    // 집계 기간에 기록한 경기별 킬 수 전체를 모집단으로 보고 변동성을 계산한다.
    metric: sql<number>`
      cast(
        coalesce(stddev_pop(${matchParticipants.kills}), 0)
        as double precision
      )
    `,
  });
}
