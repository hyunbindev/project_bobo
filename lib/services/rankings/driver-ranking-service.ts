import type {
  RankingDefinition,
  RankingService,
} from "@/lib/rankings/types";
import { findDriverRankings } from "@/lib/repositories/rankings/driver-ranking-repository";
import {
  createRankingEntries,
  toRankingRepositoryInput,
} from "@/lib/services/rankings/ranking-service-utils";

export const driverRankingDefinition: RankingDefinition = {
  code: "driver",
  label: "DESIGNATED DRIVER",
  title: "핸들이 고장난 8톤 트럭",
  description: "판당 차량 이동 거리가 가장 긴 클랜원",
  metric: "판당 차량 이동",
  unit: "km",
};

export const getDriverRanking: RankingService = async (input) => {
  const rows = await findDriverRankings(toRankingRepositoryInput(input));

  return {
    ...driverRankingDefinition,
    rankings: createRankingEntries(rows),
  };
};
