import type {
  RankingDefinition,
  RankingService,
} from "@/lib/rankings/types";
import { findBoostRankings } from "@/lib/repositories/rankings/boost-ranking-repository";
import {
  createRankingEntries,
  toRankingRepositoryInput,
} from "@/lib/services/rankings/ranking-service-utils";

export const boostRankingDefinition: RankingDefinition = {
  code: "boost",
  label: "BOOST ADDICT",
  title: "약물 중독",
  description:
    "진통제, 에너지 드링크, 아드레날린을 판당 가장 많이 사용한 클랜원",
  metric: "판당 부스트",
  unit: "평균 회",
};

export const getBoostRanking: RankingService = async (input) => {
  const rows = await findBoostRankings(toRankingRepositoryInput(input));

  return {
    ...boostRankingDefinition,
    rankings: createRankingEntries(rows),
  };
};
