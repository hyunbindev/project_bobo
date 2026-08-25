import { sql } from "drizzle-orm";

import { matchParticipants } from "@/lib/db/schema";
import {
  findAwardMetricRankings,
  type AwardRepositoryInput,
} from "@/lib/repositories/awards/common-award-repository";

export function findDbnoAwardRankings(input: AwardRepositoryInput) {
  return findAwardMetricRankings({
    ...input,
    metric: sql<number>`
      cast(coalesce(avg(${matchParticipants.dbnos}), 0) as double precision)
    `,
  });
}
