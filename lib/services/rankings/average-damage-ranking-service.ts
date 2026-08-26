import type {
  RankingDefinition,
  RankingService,
} from "@/lib/rankings/types";
import { findAverageDamageRankings } from "@/lib/repositories/rankings/average-damage-ranking-repository";
import {
  createRankingEntries,
  toRankingRepositoryInput,
} from "@/lib/services/rankings/ranking-service-utils";

export const averageDamageRankingDefinition: RankingDefinition = {
  code: "average_damage",
  label: "DAMAGE DEALER",
  title: "무호흡 딜링",
  description: "판당 평균 대미지가 가장 높은 클랜원",
  metric: "판당 평균 대미지",
  unit: "딜",
};

export const getAverageDamageRanking: RankingService = async (input) => {
  const rows = await findAverageDamageRankings(
    toRankingRepositoryInput(input),
  );

  return {
    ...averageDamageRankingDefinition,
    rankings: createRankingEntries(rows),
  };
};
