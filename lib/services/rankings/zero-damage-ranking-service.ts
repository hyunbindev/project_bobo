import type { RankingDefinition, RankingService } from "@/lib/rankings/types";
import { findZeroDamageRankings } from "@/lib/repositories/rankings/zero-damage-ranking-repository";
import {
  createRankingEntries,
  toRankingRepositoryInput,
} from "@/lib/services/rankings/ranking-service-utils";

export const zeroDamageRankingDefinition: RankingDefinition = {
  code: "zero_damage",
  label: "ZERO DAMAGE",
  title: "아 총이 안나와!!",
  description: "대미지를 주지 못하고 끝난 경기가 가장 많은 클랜원",
  metric: "0딜 경기",
  unit: "회",
};

export const getZeroDamageRanking: RankingService = async (input) => {
  const rows = await findZeroDamageRankings(toRankingRepositoryInput(input));

  return {
    ...zeroDamageRankingDefinition,
    rankings: createRankingEntries(rows),
  };
};
