import type {
  RankingDefinition,
  RankingService,
} from "@/lib/rankings/types";
import { findHeadshotRankings } from "@/lib/repositories/rankings/headshot-ranking-repository";
import {
  createRankingEntries,
  toRankingRepositoryInput,
} from "@/lib/services/rankings/ranking-service-utils";

export const headshotRankingDefinition: RankingDefinition = {
  code: "headshot",
  label: "HEAD HUNTER",
  title: "머리카락 보인다",
  description: "전체 킬 중 헤드샷 비율이 가장 높은 클랜원",
  metric: "헤드샷 비율",
  unit: "%",
};

export const getHeadshotRanking: RankingService = async (input) => {
  const rows = await findHeadshotRankings(
    toRankingRepositoryInput(input),
  );

  return {
    ...headshotRankingDefinition,
    rankings: createRankingEntries(rows),
  };
};
