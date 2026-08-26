import type {
  RankingDefinition,
  RankingService,
} from "@/lib/rankings/types";
import { findDamageCarryRankings } from "@/lib/repositories/rankings/damage-carry-ranking-repository";
import {
  createRankingEntries,
  toRankingRepositoryInput,
} from "@/lib/services/rankings/ranking-service-utils";

export const damageCarryRankingDefinition: RankingDefinition = {
  code: "damage_carry",
  label: "ONE MAN ARMY",
  title: "독박 딜러",
  description: "팀 전체 딜량의 절반 이상을 담당한 경기가 많은 클랜원",
  metric: "팀 딜 50% 이상 경기 수",
  unit: "회",
};

export const getDamageCarryRanking: RankingService = async (input) => {
  const rows = await findDamageCarryRankings(toRankingRepositoryInput(input));

  return {
    ...damageCarryRankingDefinition,
    rankings: createRankingEntries(rows),
  };
};
