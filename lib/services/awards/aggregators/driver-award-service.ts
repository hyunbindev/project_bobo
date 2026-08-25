import { findDriverAwardRankings } from "@/lib/repositories/awards/driver-award-repository";
import { createAwardAggregator } from "@/lib/services/awards/create-award-aggregator";

export const driverAwardAggregator = createAwardAggregator(
  {
    code: "driver",
    label: "DESIGNATED DRIVER",
    title: "프로 관전러",
    description: "판당 차량 이동 거리가 가장 긴 클랜원",
    metric: "판당 차량 이동",
    unit: "km",
  },
  findDriverAwardRankings,
);
