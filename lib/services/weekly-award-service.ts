import type {
  AwardAggregationContext,
  AwardResult,
  RegularAwardResult,
  WeeklyAwardPageData,
  WeeklyAwardPeriod,
} from "@/lib/awards/types";
import { awardAggregators } from "@/lib/services/awards/registry";

export type {
  AwardRanking,
  AwardResult,
  AwardUnit,
  RegularAwardCode,
  RegularAwardResult,
  WeeklyAwardPageData,
  WeeklyAwardPeriod,
} from "@/lib/awards/types";

const KST_OFFSET_MS = 9 * 60 * 60 * 1_000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1_000;

export type AggregateWeeklyAwardsInput = {
  clanId: string;
  referenceAt?: Date;
  minMatchCount?: number;
  limit?: number;
};

export type AggregateWeeklyAwardsResult = {
  clanId: string;
  period: WeeklyAwardPeriod;
  awards: AwardResult[];
};

export type WeeklyAwardServiceDependencies = {
  saveResults: (result: AggregateWeeklyAwardsResult) => Promise<void>;
};

/** 페이지가 바로 렌더링할 수 있는 이번 주 어워드 데이터를 조립한다. */
export async function getWeeklyAwardPageData(
  clanId: string | null,
  referenceAt = new Date(),
): Promise<WeeklyAwardPageData> {
  const period = getCurrentWeeklyAwardPeriod(referenceAt);
  const awards = clanId
    ? await runAwardAggregators({
        clanId,
        period,
        minMatchCount: 5,
        limit: 4,
      })
    : awardAggregators.map((aggregator) => ({
        ...aggregator.definition,
        rankings: [],
      }));
  const boboKing = awards.find((award) => award.code === "bobo_king");

  if (!boboKing) {
    throw new Error("BOBOKING aggregator is not registered.");
  }

  return {
    period,
    boboKing,
    awards: awards.filter(isRegularAwardResult),
  };
}

/** 등록된 집계기를 서로 독립적으로 실행한다. */
export async function runAwardAggregators(
  context: AwardAggregationContext,
): Promise<AwardResult[]> {
  validateContext(context);

  return Promise.all(
    awardAggregators.map((aggregator) => aggregator.aggregate(context)),
  );
}

/** 월요일 확정 배치에서 직전 완료 주차를 집계하고 저장한다. */
export async function aggregateWeeklyAwards(
  input: AggregateWeeklyAwardsInput,
  dependencies: WeeklyAwardServiceDependencies,
): Promise<AggregateWeeklyAwardsResult> {
  const context: AwardAggregationContext = {
    clanId: input.clanId,
    period: getLastCompletedWeeklyAwardPeriod(input.referenceAt),
    minMatchCount: Math.max(Math.trunc(input.minMatchCount ?? 5), 1),
    limit: Math.min(Math.max(Math.trunc(input.limit ?? 4), 1), 100),
  };
  const result: AggregateWeeklyAwardsResult = {
    clanId: context.clanId,
    period: context.period,
    awards: await runAwardAggregators(context),
  };

  await dependencies.saveResults(result);

  return result;
}

/** KST 기준 현재 진행 중인 월요일~일요일 주차를 구한다. */
export function getCurrentWeeklyAwardPeriod(
  referenceAt = new Date(),
): WeeklyAwardPeriod {
  const currentMondayAt = getCurrentMondayAt(referenceAt);

  return {
    startAt: new Date(currentMondayAt),
    endAt: new Date(currentMondayAt + WEEK_MS),
  };
}

/** KST 기준 가장 최근에 완료된 월요일~일요일 주차를 구한다. */
export function getLastCompletedWeeklyAwardPeriod(
  referenceAt = new Date(),
): WeeklyAwardPeriod {
  const currentMondayAt = getCurrentMondayAt(referenceAt);

  return {
    startAt: new Date(currentMondayAt - WEEK_MS),
    endAt: new Date(currentMondayAt),
  };
}

function validateContext(context: AwardAggregationContext) {
  if (!context.clanId.trim()) {
    throw new TypeError("clanId is required.");
  }

  if (context.period.startAt >= context.period.endAt) {
    throw new RangeError("period.startAt must be before period.endAt.");
  }

  if (context.minMatchCount < 1 || context.limit < 1) {
    throw new RangeError("minMatchCount and limit must be positive.");
  }
}

function isRegularAwardResult(award: AwardResult): award is RegularAwardResult {
  return award.code !== "bobo_king";
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
