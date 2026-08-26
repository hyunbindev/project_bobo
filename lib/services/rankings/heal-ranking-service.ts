import type {
  RankingDefinition,
  RankingService,
} from "@/lib/rankings/types";
import { findHealRankings } from "@/lib/repositories/rankings/heal-ranking-repository";
import {
  createRankingEntries,
  toRankingRepositoryInput,
} from "@/lib/services/rankings/ranking-service-utils";

export const healRankingDefinition: RankingDefinition = {
  code: "heal",
  label: "BANDAGE MUMMY",
  title: "맞은거 까먹기",
  description: "회복 아이템을 평균 많이 사용한 클랜원",
  metric: "판당 회복",
  unit: "평균 회",
};

export const getHealRanking: RankingService = async (input) => {
  const rows = await findHealRankings(toRankingRepositoryInput(input));

  return {
    ...healRankingDefinition,
    rankings: createRankingEntries(rows),
  };
};
