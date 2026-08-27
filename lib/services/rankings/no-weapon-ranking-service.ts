import type { RankingDefinition, RankingService } from "@/lib/rankings/types";
import { findNoWeaponRankings } from "@/lib/repositories/rankings/no-weapon-ranking-repository";
import {
  createRankingEntries,
  toRankingRepositoryInput,
} from "@/lib/services/rankings/ranking-service-utils";

export const noWeaponRankingDefinition: RankingDefinition = {
  code: "no_weapon",
  label: "UNARMED",
  title: "아 총이 안 나와!!",
  description: "무기를 한 번도 줍지 못하고 끝난 경기가 가장 많은 클랜원",
  metric: "무기 미획득 경기",
  unit: "회",
};

export const getNoWeaponRanking: RankingService = async (input) => {
  const rows = await findNoWeaponRankings(toRankingRepositoryInput(input));

  return {
    ...noWeaponRankingDefinition,
    rankings: createRankingEntries(rows.filter((row) => row.value > 0)),
  };
};
