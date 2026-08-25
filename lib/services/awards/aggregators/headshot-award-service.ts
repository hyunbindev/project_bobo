import { findHeadshotAwardRankings } from "@/lib/repositories/awards/headshot-award-repository";
import { createAwardAggregator } from "@/lib/services/awards/create-award-aggregator";

export const headshotAwardAggregator = createAwardAggregator(
  {
    code: "headshot",
    label: "HEAD HUNTER",
    title: "머리카락 보인다",
    description: "전체 킬 중 헤드샷 비율이 가장 높은 클랜원",
    metric: "헤드샷 비율",
    unit: "%",
  },
  findHeadshotAwardRankings,
);
