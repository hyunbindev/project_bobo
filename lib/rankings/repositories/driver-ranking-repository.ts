import { sql } from "drizzle-orm";

import { matchParticipants } from "@/lib/db/schema";
import { findMetricRankings } from "@/lib/rankings/repositories/common-ranking-repository";
import type { RankingRepositoryInput } from "@/lib/rankings/types";

export function findDriverRankings(input: RankingRepositoryInput) {
  return findMetricRankings({
    ...input,
    metric: sql<number>`
      cast(
        coalesce(avg(${matchParticipants.rideDistance}), 0) / 1000.0
        as double precision
      )
    `,
  });
}
