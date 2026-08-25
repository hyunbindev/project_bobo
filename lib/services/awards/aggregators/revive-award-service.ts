import { findReviveAwardRankings } from "@/lib/repositories/awards/revive-award-repository";
import { createAwardAggregator } from "@/lib/services/awards/create-award-aggregator";

export const reviveAwardAggregator = createAwardAggregator(
  {
    code: "revive",
    label: "FIELD MEDIC",
    title: "이머전시! 이머전시!",
    description: "기절한 팀원을 평균 많이 부활시킨 클랜원",
    metric: "판당 부활",
    unit: "평균 회",
  },
  findReviveAwardRankings,
);
