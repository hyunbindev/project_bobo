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
  description: "경기마다 킬 기록의 기복이 가장 큰 클랜원",
  metric: "킬 기복 지수",
  unit: "점",
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
