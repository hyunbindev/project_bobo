import type { AwardCode } from "@/lib/db/schema";

export type WeeklyAwardPeriod = {
  // 기간은 [startAt, endAt) 형식이며 endAt 시각은 포함하지 않는다.
  startAt: Date;
  endAt: Date;
};

export type AwardAggregationContext = {
  clanId: string;
  period: WeeklyAwardPeriod;
  minMatchCount: number;
  limit: number;
};

export type AwardRanking = {
  playerId: string;
  playerName: string;
  rank: number;
  value: number;
  matchCount: number;
};

export type AwardUnit = "평균 회" | "킬" | "%" | "m" | "km" | "P";

export type AwardResult = {
  code: AwardCode;
  label: string;
  title: string;
  description: string;
  metric: string;
  unit: AwardUnit;
  rankings: AwardRanking[];
};

export type AwardDefinition = Omit<AwardResult, "rankings">;

export type AwardAggregator = {
  code: AwardCode;
  definition: AwardDefinition;
  aggregate: (context: AwardAggregationContext) => Promise<AwardResult>;
};

export type RegularAwardCode = Exclude<AwardCode, "bobo_king">;
export type RegularAwardResult = Omit<AwardResult, "code"> & {
  code: RegularAwardCode;
};

export type WeeklyAwardPageData = {
  period: WeeklyAwardPeriod;
  boboKing: AwardResult;
  awards: RegularAwardResult[];
};
