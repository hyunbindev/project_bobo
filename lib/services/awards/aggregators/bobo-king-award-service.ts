import { findBoboKingAwardRankings } from "@/lib/repositories/awards/bobo-king-award-repository";
import { createAwardAggregator } from "@/lib/services/awards/create-award-aggregator";

export const boboKingAwardAggregator = createAwardAggregator(
  {
    code: "bobo_king",
    label: "BOBOKING",
    title: "BOBOKING",
    description: "킬, 기절, 데미지 합산 평균",
    metric: "종합 점수",
    unit: "P",
  },
  findBoboKingAwardRankings,
);
