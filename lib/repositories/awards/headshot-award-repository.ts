import { sql } from "drizzle-orm";

import { matchParticipants } from "@/lib/db/schema";
import {
  findAwardMetricRankings,
  type AwardRepositoryInput,
} from "@/lib/repositories/awards/common-award-repository";

export function findHeadshotAwardRankings(input: AwardRepositoryInput) {
  return findAwardMetricRankings({
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
