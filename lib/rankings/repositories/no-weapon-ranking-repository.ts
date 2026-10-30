import { sql } from "drizzle-orm";

import { matchParticipants } from "@/lib/db/schema";
import { findMetricRankings } from "@/lib/rankings/repositories/common-ranking-repository";
import type { RankingRepositoryInput } from "@/lib/rankings/types";

export function findNoWeaponRankings(input: RankingRepositoryInput) {
  return findMetricRankings({
    ...input,
    metric: sql<number>`
      cast(
        count(*) filter (
          where ${matchParticipants.weaponsAcquired} = 0
        )
        as integer
      )
    `,
  });
}
