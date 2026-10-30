import type { MatchRosterListItem } from "@/lib/matches/types";
export type PlayerTrendTone = "primary" | "info" | "support";

export type PlayerTrendPoint = {
  match: number;
  playedAt: string;
  mapName: string;
  gameMode: string;
  value: number;
  movingAverage: number | null;
};

export type PlayerTrendMetric = {
  label: string;
  currentValue: string;
  change: string;
  description: string;
  movingAverageSize: number;
  points: PlayerTrendPoint[];
  baseline: number | null;
  tone: PlayerTrendTone;
  lowerIsBetter?: boolean;
};

export type HighRecordDetail = {
  value: number;
  mapName: string;
  gameMode: string;
};

export type HighRecord = {
  maxDamage: HighRecordDetail;
  maxKills: HighRecordDetail;
  longestKillRange: HighRecordDetail;
  maxRevives: HighRecordDetail;
};

export type PlayerTrendMatch = {
  matchId: string;
  playedAt: Date;
  mapName: string;
  gameMode: string;
  damage: number;
  kills: number;
  rank: number;
};

export type PlayerMatchHistoryPage = {
  items: MatchRosterListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};
