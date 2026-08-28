import type { RankingCode } from "@/lib/db/schema";

export type WeeklyRankingPeriod = {
  // 기간은 [startAt, endAt) 형식이며 endAt 시각은 포함하지 않는다.
  startAt: Date;
  endAt: Date;
};

export type RankingServiceInput = {
  clanId: string;
  period: WeeklyRankingPeriod;
  minMatchCount: number;
  limit: number;
};

export type RankingEntry = {
  playerId: string;
  playerName: string;
  rank: number;
  value: number;
  matchCount: number;
};

export type RankingUnit =
  | "평균 회"
  | "회"
  | "킬"
  | "킬 σ"
  | "딜"
  | "%"
  | "m"
  | "km"
  | "분"
  | "P";

export type RankingResult = {
  code: RankingCode;
  label: string;
  title: string;
  description: string;
  metric: string;
  unit: RankingUnit;
  rankings: RankingEntry[];
};

export type RankingDefinition = Omit<RankingResult, "rankings">;

export type RankingService = (
  input: RankingServiceInput,
) => Promise<RankingResult>;

export type RegularRankingCode = Exclude<RankingCode, "bobo_king">;
export type RegularRankingResult = Omit<RankingResult, "code"> & {
  code: RegularRankingCode;
};

export type WeeklyRankingPageData = {
  period: WeeklyRankingPeriod;
  boboKing: RankingResult;
  rankings: RegularRankingResult[];
};
