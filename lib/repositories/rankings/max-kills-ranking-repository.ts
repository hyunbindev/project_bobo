import { sql } from "drizzle-orm";

import { matchParticipants } from "@/lib/db/schema";
import {
  findMetricRankings,
  type RankingRepositoryInput,
} from "@/lib/repositories/rankings/common-ranking-repository";

export function findMaxKillsRankings(input: RankingRepositoryInput) {
  return findMetricRankings({
    ...input,
    metric: sql<number>`
      cast(coalesce(max(${matchParticipants.kills}), 0) as integer)
    `,
  });
}
