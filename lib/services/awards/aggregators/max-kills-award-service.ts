import { findMaxKillsAwardRankings } from "@/lib/repositories/awards/max-kills-award-repository";
import { createAwardAggregator } from "@/lib/services/awards/create-award-aggregator";

export const maxKillsAwardAggregator = createAwardAggregator(
  {
    code: "max_kills",
    label: "MAX KILLS",
    title: "'나'라는 악몽",
    description: "집계 기간 동안 한 경기에서 가장 많은 킬을 기록한 클랜원",
    metric: "매치 최고 킬",
    unit: "킬",
  },
  findMaxKillsAwardRankings,
);
