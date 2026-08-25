import { findWalkerAwardRankings } from "@/lib/repositories/awards/walker-award-repository";
import { createAwardAggregator } from "@/lib/services/awards/create-award-aggregator";

export const walkerAwardAggregator = createAwardAggregator(
  {
    code: "walker",
    label: "ROAD WARRIOR",
    title: "믿는 건 두 다리",
    description: "판당 도보 이동 거리가 가장 긴 클랜원",
    metric: "판당 도보 이동",
    unit: "km",
  },
  findWalkerAwardRankings,
);
