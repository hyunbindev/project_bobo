import type { AwardAggregator, AwardDefinition } from "@/lib/awards/types";
import type {
  AwardMetricRankingRow,
  AwardRepositoryInput,
} from "@/lib/repositories/awards/common-award-repository";

type AwardRankingFinder = (
  input: AwardRepositoryInput,
) => Promise<AwardMetricRankingRow[]>;

/** Repository 결과에 어워드 정의와 순위를 조립한다. */
export function createAwardAggregator(
  definition: AwardDefinition,
  findRankings: AwardRankingFinder,
): AwardAggregator {
  return {
    code: definition.code,
    definition,
    async aggregate(context) {
      const rows = await findRankings({
        clanId: context.clanId,
        startAt: context.period.startAt,
        endAt: context.period.endAt,
        minMatchCount: context.minMatchCount,
        limit: context.limit,
      });

      return {
        ...definition,
        rankings: rows.map((row, index) => ({
          ...row,
          rank: index + 1,
        })),
      };
    },
  };
}
