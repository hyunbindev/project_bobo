import { findHealAwardRankings } from "@/lib/repositories/awards/heal-award-repository";
import { createAwardAggregator } from "@/lib/services/awards/create-award-aggregator";

export const healAwardAggregator = createAwardAggregator(
  {
    code: "heal",
    label: "BANDAGE MUMMY",
    title: "맞은거 까먹기",
    description: "회복 아이템을 평균 많이 사용한 클랜원",
    metric: "판당 회복",
    unit: "평균 회",
  },
  findHealAwardRankings,
);
