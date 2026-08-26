import type {
  RankingDefinition,
  RankingService,
} from "@/lib/rankings/types";
import { findReviveRankings } from "@/lib/repositories/rankings/revive-ranking-repository";
import {
  createRankingEntries,
  toRankingRepositoryInput,
} from "@/lib/services/rankings/ranking-service-utils";

export const reviveRankingDefinition: RankingDefinition = {
  code: "revive",
  label: "FIELD MEDIC",
  title: "누구예요? 어디예요? 여기예요?",
  description: "기절한 팀원을 평균 많이 부활시킨 클랜원",
  metric: "판당 부활",
  unit: "평균 회",
};

export const getReviveRanking: RankingService = async (input) => {
  const rows = await findReviveRankings(toRankingRepositoryInput(input));

  return {
    ...reviveRankingDefinition,
    rankings: createRankingEntries(rows),
  };
};
