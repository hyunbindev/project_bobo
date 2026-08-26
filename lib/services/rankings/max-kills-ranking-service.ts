import type {
  RankingDefinition,
  RankingService,
} from "@/lib/rankings/types";
import { RankingMetricRow } from "@/lib/repositories/rankings/common-ranking-repository";
import { findMaxKillsRankings } from "@/lib/repositories/rankings/max-kills-ranking-repository";
import {
  createRankingEntries,
  toRankingRepositoryInput,
} from "@/lib/services/rankings/ranking-service-utils";

export const maxKillsRankingDefinition: RankingDefinition = {
  code: "max_kills",
  label: "MAX KILLS",
  title: "'나'라는 악몽",
  description: "집계 기간 동안 한 경기에서 가장 많은 킬을 기록한 클랜원",
  metric: "매치 최고 킬",
  unit: "킬",
};

export const getMaxKillsRanking: RankingService = async (input) => {
  const rows = await findMaxKillsRankings(
    toRankingRepositoryInput(input),
  );
  const entries:readonly RankingMetricRow[] = createRankingEntries(rows)
  return {
    ...maxKillsRankingDefinition,
    title: entries.length >0 ? `'${entries[0].playerName}'라는 악몽` : maxKillsRankingDefinition.title,
    rankings: createRankingEntries(rows),
  };
};
