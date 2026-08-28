import type {
  RankingDefinition,
  RankingService,
} from "@/lib/rankings/types";
import { findKillDeviationRankings } from "@/lib/repositories/rankings/kill-deviation-ranking-repository";
import {
  createRankingEntries,
  toRankingRepositoryInput,
} from "@/lib/services/rankings/ranking-service-utils";

export const killDeviationRankingDefinition: RankingDefinition = {
  code: "kill_deviation",
  label: "ALL OR NOTHING",
  title: "모 아니면 도",
  description: "집계 기간 동안 경기별 킬 수의 표준편차가 가장 큰 클랜원",
  metric: "킬 표준편차",
  unit: "킬 σ",
};

export const getKillDeviationRanking: RankingService = async (input) => {
  const rows = await findKillDeviationRankings(
    toRankingRepositoryInput(input),
  );

  return {
    ...killDeviationRankingDefinition,
    rankings: createRankingEntries(rows),
  };
};
