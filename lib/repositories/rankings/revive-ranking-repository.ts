import { sql } from "drizzle-orm";

import { matchParticipants } from "@/lib/db/schema";
import {
  findMetricRankings,
  type RankingRepositoryInput,
} from "@/lib/repositories/rankings/common-ranking-repository";

export function findReviveRankings(input: RankingRepositoryInput) {
  return findMetricRankings({
    ...input,
    metric: sql<number>`
      cast(coalesce(avg(${matchParticipants.revives}), 0) as double precision)
    `,
  });
}
