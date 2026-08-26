import type {
  RankingDefinition,
  RankingService,
} from "@/lib/rankings/types";
import { findSpectatorRankings } from "@/lib/repositories/rankings/spectator-ranking-repository";
import {
  createRankingEntries,
  toRankingRepositoryInput,
} from "@/lib/services/rankings/ranking-service-utils";

export const spectatorRankingDefinition: RankingDefinition = {
  code: "spectator",
  label: "PRO SPECTATOR",
  title: "프로 관전러",
  description: "클랜 팀원보다 먼저 죽고 판당 평균 오래 관전한 클랜원",
  metric: "판당 평균 관전",
  unit: "분",
};

export const getSpectatorRanking: RankingService = async (input) => {
  const rows = await findSpectatorRankings(toRankingRepositoryInput(input));

  return {
    ...spectatorRankingDefinition,
    rankings: createRankingEntries(rows),
  };
};
