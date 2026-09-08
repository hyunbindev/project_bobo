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
  description: "판당 평균 킬, 대미지, 기절을 반영한 종합 점수",
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
