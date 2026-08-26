import type {
  RankingDefinition,
  RankingService,
} from "@/lib/rankings/types";
import { findBoboKingRankings } from "@/lib/repositories/rankings/bobo-king-ranking-repository";
import {
  createRankingEntries,
  toRankingRepositoryInput,
} from "@/lib/services/rankings/ranking-service-utils";

export const boboKingRankingDefinition: RankingDefinition = {
  code: "bobo_king",
  label: "BOBOKING",
  title: "BOBOKING",
  description: "킬, 기절, 데미지 합산 평균",
  metric: "종합 점수",
  unit: "P",
};

export const getBoboKingRanking: RankingService = async (input) => {
  const rows = await findBoboKingRankings(
    toRankingRepositoryInput(input),
  );

  return {
    ...boboKingRankingDefinition,
    rankings: createRankingEntries(rows),
  };
};
