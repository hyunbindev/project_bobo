import type {
  RankingDefinition,
  RankingService,
} from "@/lib/rankings/types";
import { findWalkerRankings } from "@/lib/repositories/rankings/walker-ranking-repository";
import {
  createRankingEntries,
  toRankingRepositoryInput,
} from "@/lib/services/rankings/ranking-service-utils";

export const walkerRankingDefinition: RankingDefinition = {
  code: "walker",
  label: "ROAD WARRIOR",
  title: "믿는 건 두 다리",
  description: "판당 도보 이동 거리가 가장 긴 클랜원",
  metric: "판당 도보 이동",
  unit: "km",
};

export const getWalkerRanking: RankingService = async (input) => {
  const rows = await findWalkerRankings(toRankingRepositoryInput(input));

  return {
    ...walkerRankingDefinition,
    rankings: createRankingEntries(rows),
  };
};
