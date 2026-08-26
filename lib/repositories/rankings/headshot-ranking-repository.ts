import { sql } from "drizzle-orm";

import { matchParticipants } from "@/lib/db/schema";
import {
  findMetricRankings,
  type RankingRepositoryInput,
} from "@/lib/repositories/rankings/common-ranking-repository";

export function findHeadshotRankings(input: RankingRepositoryInput) {
  return findMetricRankings({
    ...input,
    metric: sql<number>`
      cast(
        coalesce(
          sum(${matchParticipants.headshotKills}) * 100.0 /
          nullif(sum(${matchParticipants.kills}), 0),
          0
        )
        as double precision
      )
    `,
  });
}
