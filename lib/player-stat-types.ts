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
