import { sql } from "drizzle-orm";

import { matchParticipants } from "@/lib/db/schema";
import { findMetricRankings } from "@/lib/rankings/repositories/common-ranking-repository";
import type { RankingRepositoryInput } from "@/lib/rankings/types";

export function findAverageDamageRankings(input: RankingRepositoryInput) {
  return findMetricRankings({
    ...input,
    metric: sql<number>`
      cast(
        coalesce(avg(${matchParticipants.damageDealt}), 0)
        as double precision
      )
    `,
  });
}
