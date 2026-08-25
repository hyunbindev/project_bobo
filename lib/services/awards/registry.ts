import { boboKingAwardAggregator } from "@/lib/services/awards/aggregators/bobo-king-award-service";
import { boostAwardAggregator } from "@/lib/services/awards/aggregators/boost-award-service";
import { dbnoAwardAggregator } from "@/lib/services/awards/aggregators/dbno-award-service";
import { driverAwardAggregator } from "@/lib/services/awards/aggregators/driver-award-service";
import { headshotAwardAggregator } from "@/lib/services/awards/aggregators/headshot-award-service";
import { healAwardAggregator } from "@/lib/services/awards/aggregators/heal-award-service";
import { maxKillsAwardAggregator } from "@/lib/services/awards/aggregators/max-kills-award-service";
import { reviveAwardAggregator } from "@/lib/services/awards/aggregators/revive-award-service";
import { walkerAwardAggregator } from "@/lib/services/awards/aggregators/walker-award-service";
import type { AwardAggregator } from "@/lib/awards/types";

/** 이 배열에서 집계기의 노출 순서, 추가, 제거를 관리한다. */
export const awardAggregators = [
  boboKingAwardAggregator,
  boostAwardAggregator,
  reviveAwardAggregator,
  healAwardAggregator,
  dbnoAwardAggregator,
  headshotAwardAggregator,
  maxKillsAwardAggregator,
  driverAwardAggregator,
  walkerAwardAggregator,
] satisfies readonly AwardAggregator[];
