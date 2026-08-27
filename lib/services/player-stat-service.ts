import { cache } from "react";

import { BadRequestError } from "@/lib/api/errors";
import {
  countPlayerMatchRosterHistories,
  findMatchRosterHistories,
  type MatchRosterListItem,
} from "@/lib/repositories/match-repository";
import {
  findPlayerHighRecord,
  findPlayerTrendMatches,
  type HighRecord,
  type PlayerTrendMatch,
} from "@/lib/repositories/player-stat-repository";
import type {
  PlayerTrendMetric,
  PlayerTrendTone,
} from "@/lib/player-stat-types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// 같은 서버 렌더링 안에서 동일 플레이어 집계를 여러 번 요청해도 쿼리는 한 번만 실행한다.
export const getPlayerHighRecord = cache(
  async (playerId: string): Promise<HighRecord | null> => {
    if (!UUID_PATTERN.test(playerId)) {
      throw new BadRequestError("playerId must be a valid UUID.");
    }

    return findPlayerHighRecord(playerId);
  },
);

const TREND_DAYS = 14;
const TREND_MATCH_LIMIT = 50;
const MOVING_AVERAGE_SIZE = 5;

type TrendMetricDefinition = {
  label: string;
  tone: PlayerTrendTone;
  lowerIsBetter?: boolean;
  selectValue: (match: PlayerTrendMatch) => number;
  formatValue: (value: number) => string;
  formatChange: (current: number, previous: number) => string;
};

const trendMetricDefinitions: TrendMetricDefinition[] = [
  {
    label: "AVERAGE DAMAGE",
    tone: "primary",
    selectValue: (match) => match.damage,
    formatValue: (value) => Math.round(value).toLocaleString("ko-KR"),
    formatChange: formatPercentChange,
  },
  {
    label: "AVERAGE KILLS",
    tone: "info",
    selectValue: (match) => match.kills,
    formatValue: (value) => value.toFixed(1),
    formatChange: formatAbsoluteChange,
  },
  {
    label: "AVERAGE RANK",
    tone: "support",
    lowerIsBetter: true,
    selectValue: (match) => match.rank,
    formatValue: (value) => `#${value.toFixed(1)}`,
    formatChange: formatRankChange,
  },
];

export const getPlayerPerformanceTrends = cache(
  async (playerId: string, clanId: string): Promise<PlayerTrendMetric[]> => {
    if (!UUID_PATTERN.test(playerId)) {
      throw new BadRequestError("playerId must be a valid UUID.");
    }

    if (!UUID_PATTERN.test(clanId)) {
      throw new BadRequestError("clanId must be a valid UUID.");
    }

    const since = new Date(
      Date.now() - TREND_DAYS * 24 * 60 * 60 * 1_000,
    );
    const matches = await findPlayerTrendMatches(
      playerId,
      clanId,
      since,
      TREND_MATCH_LIMIT,
    );
    const chronologicalMatches = matches.toReversed();

    return trendMetricDefinitions.map((definition) => createTrendMetric(chronologicalMatches, definition),);
  },
);

function createTrendMetric(
  matches: PlayerTrendMatch[],
  definition: TrendMetricDefinition,
): PlayerTrendMetric {
  const values = matches.map(definition.selectValue);
  const hasMovingAverage = values.length >= MOVING_AVERAGE_SIZE;
  const latestWindow = values.slice(-MOVING_AVERAGE_SIZE);
  const current = hasMovingAverage
    ? average(latestWindow)
    : (values.at(-1) ?? 0);
    
  const previousWindow = values.slice(
    -(MOVING_AVERAGE_SIZE * 2),
    -MOVING_AVERAGE_SIZE,
  );
  const previous =
    previousWindow.length === MOVING_AVERAGE_SIZE
      ? average(previousWindow)
      : null;
  const baseline =
    values.length === TREND_MATCH_LIMIT ? average(values) : null;

  return {
    label: definition.label,
    currentValue: values.length === 0 ? "-" : definition.formatValue(current),
    
    change:
      previous === null ? "—" : definition.formatChange(current, previous),
    
      description:
      baseline === null
        ? `최근 ${values.length}경기`
        : `최근 ${TREND_MATCH_LIMIT}경기 평균 ${definition.formatValue(baseline)}`,

    points: matches.map((match, index) => ({
      match: index + 1,
      playedAt: match.playedAt.toISOString(),
      mapName: match.mapName,
      gameMode: match.gameMode,
      value: definition.selectValue(match),
      movingAverage:
        index < MOVING_AVERAGE_SIZE - 1
          ? null
          : average(
            matches
              .slice(index - MOVING_AVERAGE_SIZE + 1, index + 1)
              .map(definition.selectValue),
          ),
    })),
    baseline,
    tone: definition.tone,
    lowerIsBetter: definition.lowerIsBetter,
  };
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatPercentChange(current: number, previous: number) {
  if (previous === 0) { return current === 0 ? "0.0%" : "NEW"; }

  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
}

function formatAbsoluteChange(current: number, previous: number) {
  const change = current - previous;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}`;
}

function formatRankChange(current: number, previous: number) {
  const improvement = previous - current;

  if (improvement === 0) {
    return "—";
  }

  return `${improvement > 0 ? "▲" : "▼"} ${Math.abs(improvement).toFixed(1)}`;
}

export type PlayerMatchHistoryPage = {
  items: MatchRosterListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export async function getPlayerMatchHistoryPage(
  playerId: string,
  clanId: string,
  requestedPage = 1,
  pageSize = 10,
): Promise<PlayerMatchHistoryPage> {
  if (!UUID_PATTERN.test(playerId)) {
    throw new BadRequestError("playerId must be a valid UUID.");
  }

  const normalizedPageSize = Math.min(Math.max(Math.trunc(pageSize), 1), 100);
  const totalCount = await countPlayerMatchRosterHistories(playerId, clanId);
  const totalPages = Math.max(Math.ceil(totalCount / normalizedPageSize), 1);
  const page = Math.min(
    Math.max(Math.trunc(requestedPage) || 1, 1),
    totalPages,
  );
  const items =
    totalCount === 0
      ? []
      : await findMatchRosterHistories({
        playerId,
        clanId,
        isWon: false,
        limit: normalizedPageSize,
        offset: (page - 1) * normalizedPageSize,
      });

  return {
    items,
    page,
    pageSize: normalizedPageSize,
    totalCount,
    totalPages,
  };
}

export type { HighRecord } from "@/lib/repositories/player-stat-repository";
