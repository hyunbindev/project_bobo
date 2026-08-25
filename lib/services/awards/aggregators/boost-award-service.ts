import { findBoostAwardRankings } from "@/lib/repositories/awards/boost-award-repository";
import { createAwardAggregator } from "@/lib/services/awards/create-award-aggregator";

export const boostAwardAggregator = createAwardAggregator(
  {
    code: "boost",
    label: "BOOST ADDICT",
    title: "약물 중독",
    description:
      "진통제, 에너지 드링크, 아드레날린을 판당 가장 많이 사용한 클랜원",
    metric: "판당 부스트",
    unit: "평균 회",
  },
  findBoostAwardRankings,
);
