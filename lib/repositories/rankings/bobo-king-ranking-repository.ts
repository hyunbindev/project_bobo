import { sql } from "drizzle-orm";

import { matchParticipants } from "@/lib/db/schema";
import {
  findMetricRankings,
  type RankingRepositoryInput,
} from "@/lib/repositories/rankings/common-ranking-repository";

export function findBoboKingRankings(input: RankingRepositoryInput) {
  return findMetricRankings({
    ...input,
    // 판수가 많다는 이유만으로 점수가 커지지 않도록 각 지표의 판당 평균을 사용한다.
    // 최종 로그 변환은 순위를 유지하면서 플레이어 간 점수 격차만 완만하게 만든다.
    metric: sql<number>`
      cast(
        ln(
          1 +
          coalesce(avg(${matchParticipants.kills}), 0)::double precision *
          coalesce(avg(${matchParticipants.damageDealt}), 0) *
          coalesce(avg(${matchParticipants.dbnos}), 0)::double precision
        ) * 100
        as double precision
      )
    `,
  });
}
