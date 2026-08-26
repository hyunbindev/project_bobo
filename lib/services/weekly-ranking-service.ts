import type {
  RankingDefinition,
  RankingResult,
  RankingServiceInput,
  RegularRankingResult,
  WeeklyRankingPageData,
  WeeklyRankingPeriod,
} from "@/lib/rankings/types";

import { averageDamageRankingDefinition, getAverageDamageRanking,} from
 "@/lib/services/rankings/average-damage-ranking-service";

import { boboKingRankingDefinition, getBoboKingRanking, } 
from "@/lib/services/rankings/bobo-king-ranking-service";

import { boostRankingDefinition, getBoostRanking,} from
 "@/lib/services/rankings/boost-ranking-service";

import { dbnoRankingDefinition, getDbnoRanking,} from
 "@/lib/services/rankings/dbno-ranking-service";

import { damageCarryRankingDefinition, getDamageCarryRanking,} from
 "@/lib/services/rankings/damage-carry-ranking-service";

import { driverRankingDefinition, getDriverRanking,} from
 "@/lib/services/rankings/driver-ranking-service";

import { getHeadshotRanking, headshotRankingDefinition,} from
 "@/lib/services/rankings/headshot-ranking-service";

import { getHealRanking, healRankingDefinition,} from
 "@/lib/services/rankings/heal-ranking-service";

import { getMaxKillsRanking, maxKillsRankingDefinition,} from
 "@/lib/services/rankings/max-kills-ranking-service";

import { getReviveRanking, reviveRankingDefinition,} from
 "@/lib/services/rankings/revive-ranking-service";

import { getSpectatorRanking, spectatorRankingDefinition,} from
 "@/lib/services/rankings/spectator-ranking-service";

import { getWalkerRanking, walkerRankingDefinition,} from
 "@/lib/services/rankings/walker-ranking-service";


export type {
  RankingEntry,
  RankingResult,
  RankingUnit,
  RegularRankingCode,
  RegularRankingResult,
  WeeklyRankingPageData,
  WeeklyRankingPeriod,
} from "@/lib/rankings/types";

const KST_OFFSET_MS = 9 * 60 * 60 * 1_000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1_000;

const weeklyRankingDefinitions: readonly RankingDefinition[] = [
  boboKingRankingDefinition,
  averageDamageRankingDefinition,
  damageCarryRankingDefinition,
  boostRankingDefinition,
  reviveRankingDefinition,
  healRankingDefinition,
  dbnoRankingDefinition,
  headshotRankingDefinition,
  maxKillsRankingDefinition,
  spectatorRankingDefinition,
  //driverRankingDefinition,
  //walkerRankingDefinition,
];

export type AggregateWeeklyRankingsInput = {
  clanId: string;
  referenceAt?: Date;
  minMatchCount?: number;
  limit?: number;
};

export type AggregateWeeklyRankingsResult = {
  clanId: string;
  period: WeeklyRankingPeriod;
  rankings: RankingResult[];
};

export type WeeklyRankingServiceDependencies = {
  saveResults: (result: AggregateWeeklyRankingsResult) => Promise<void>;
};

/** 페이지가 바로 렌더링할 수 있는 이번 주 어워드 데이터를 조립한다. */
export async function getWeeklyRankingPageData(
  clanId: string | null,
  referenceAt = new Date(),
): Promise<WeeklyRankingPageData> {
  const period = getCurrentWeeklyRankingPeriod(referenceAt);
  const rankings = clanId
    ? await runRankingServices({
        clanId,
        period,
        minMatchCount: 5,
        limit: 4,
      })
    : weeklyRankingDefinitions.map((definition) => ({
        ...definition,
        rankings: [],
      }));
  const boboKing = rankings.find((ranking) => ranking.code === "bobo_king");

  if (!boboKing) {
    throw new Error("BOBOKING ranking service did not return a result.");
  }

  return {
    period,
    boboKing,
    rankings: rankings.filter(isRegularRankingResult),
  };
}

/** 랭킹별 서비스를 동일한 입력으로 실행한다. */
export async function runRankingServices(
  input: RankingServiceInput,
): Promise<RankingResult[]> {
  validateInput(input);

  return Promise.all([
    getBoboKingRanking(input),
    getAverageDamageRanking(input),
    getDamageCarryRanking(input),
    getBoostRanking(input),
    getReviveRanking(input),
    getHealRanking(input),
    getDbnoRanking(input),
    getHeadshotRanking(input),
    getMaxKillsRanking(input),
    getSpectatorRanking(input),
    //getDriverRanking(input),
    //getWalkerRanking(input),
  ]);
}

/** 월요일 확정 배치에서 직전 완료 주차를 집계하고 저장한다. */
export async function aggregateWeeklyRankings(
  input: AggregateWeeklyRankingsInput,
  dependencies: WeeklyRankingServiceDependencies,
): Promise<AggregateWeeklyRankingsResult> {
  const serviceInput: RankingServiceInput = {
    clanId: input.clanId,
    period: getLastCompletedWeeklyRankingPeriod(input.referenceAt),
    minMatchCount: Math.max(Math.trunc(input.minMatchCount ?? 5), 1),
    limit: Math.min(Math.max(Math.trunc(input.limit ?? 4), 1), 100),
  };
  const result: AggregateWeeklyRankingsResult = {
    clanId: serviceInput.clanId,
    period: serviceInput.period,
    rankings: await runRankingServices(serviceInput),
  };

  await dependencies.saveResults(result);

  return result;
}

/** KST 기준 현재 진행 중인 월요일~일요일 주차를 구한다. */
export function getCurrentWeeklyRankingPeriod(
  referenceAt = new Date(),
): WeeklyRankingPeriod {
  const currentMondayAt = getCurrentMondayAt(referenceAt);

  return {
    startAt: new Date(currentMondayAt),
    endAt: new Date(currentMondayAt + WEEK_MS),
  };
}

/** KST 기준 가장 최근에 완료된 월요일~일요일 주차를 구한다. */
export function getLastCompletedWeeklyRankingPeriod(
  referenceAt = new Date(),
): WeeklyRankingPeriod {
  const currentMondayAt = getCurrentMondayAt(referenceAt);

  return {
    startAt: new Date(currentMondayAt - WEEK_MS),
    endAt: new Date(currentMondayAt),
  };
}

function validateInput(input: RankingServiceInput) {
  if (!input.clanId.trim()) {
    throw new TypeError("clanId is required.");
  }

  if (input.period.startAt >= input.period.endAt) {
    throw new RangeError("period.startAt must be before period.endAt.");
  }

  if (input.minMatchCount < 1 || input.limit < 1) {
    throw new RangeError("minMatchCount and limit must be positive.");
  }
}

function isRegularRankingResult(ranking: RankingResult): ranking is RegularRankingResult {
  return ranking.code !== "bobo_king";
}

function getCurrentMondayAt(referenceAt: Date) {
  if (Number.isNaN(referenceAt.getTime())) {
    throw new TypeError("referenceAt must be a valid date.");
  }

  const kstReference = new Date(referenceAt.getTime() + KST_OFFSET_MS);
  const dayFromMonday = (kstReference.getUTCDay() + 6) % 7;

  return (
    Date.UTC(
      kstReference.getUTCFullYear(),
      kstReference.getUTCMonth(),
      kstReference.getUTCDate() - dayFromMonday,
    ) - KST_OFFSET_MS
  );
}
