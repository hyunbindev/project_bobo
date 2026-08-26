import type {
  RankingDefinition,
  RankingService,
} from "@/lib/rankings/types";
import { findDbnoRankings } from "@/lib/repositories/rankings/dbno-ranking-repository";
import {
  createRankingEntries,
  toRankingRepositoryInput,
} from "@/lib/services/rankings/ranking-service-utils";

export const dbnoRankingDefinition: RankingDefinition = {
  code: "dbno",
  label: "KNOCK FACTORY",
  title: "난 말로 안해",
  description: "킬 여부와 상관없이 상대를 가장 자주 바닥에 눕힌 클랜원",
  metric: "판당 DBNO",
  unit: "평균 회",
};

export const getDbnoRanking: RankingService = async (input) => {
  const rows = await findDbnoRankings(toRankingRepositoryInput(input));

  return {
    ...dbnoRankingDefinition,
    rankings: createRankingEntries(rows),
  };
};
