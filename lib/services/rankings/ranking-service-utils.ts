import type {
  RankingEntry,
  RankingServiceInput,
} from "@/lib/rankings/types";
import type {
  RankingMetricRow,
  RankingRepositoryInput,
} from "@/lib/repositories/rankings/common-ranking-repository";

export function toRankingRepositoryInput(
  input: RankingServiceInput,
): RankingRepositoryInput {
  return {
    clanId: input.clanId,
    startAt: input.period.startAt,
    endAt: input.period.endAt,
    limit: input.limit,
  };
}

export function createRankingEntries(
  rows: RankingMetricRow[],
): RankingEntry[] {
  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}
