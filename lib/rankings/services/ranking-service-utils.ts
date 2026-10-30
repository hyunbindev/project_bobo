import type {
  RankingEntry,
  RankingServiceInput,
  RankingMetricRow,
  RankingRepositoryInput,
} from "@/lib/rankings/types";

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
