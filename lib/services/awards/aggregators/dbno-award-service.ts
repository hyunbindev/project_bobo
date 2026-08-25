import { findDbnoAwardRankings } from "@/lib/repositories/awards/dbno-award-repository";
import { createAwardAggregator } from "@/lib/services/awards/create-award-aggregator";

export const dbnoAwardAggregator = createAwardAggregator(
  {
    code: "dbno",
    label: "KNOCK FACTORY",
    title: "난 말로 안해",
    description: "킬 여부와 상관없이 상대를 가장 자주 바닥에 눕힌 클랜원",
    metric: "판당 DBNO",
    unit: "평균 회",
  },
  findDbnoAwardRankings,
);
