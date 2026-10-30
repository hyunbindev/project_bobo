
export type SquadHistoryInput = {
  matchId: string;
  rosterId: string;
  clanId: string;
};

export type SquadHistorySummary = {
  members: Array<{ id: string; name: string }>;
  matchCount: number;
  winCount: number;
  averageRank: number | null;
  averageDamage: number | null;
  previousMatchCount: number;
  previousAverageKills: number | null;
  previousAverageDamage: number | null;
  previousAverageRank: number | null;
};

export type SquadHistoryMatch = {
  matchId: string;
  rosterId: string;
  mapName: string;
  gameMode: string;
  matchType: string;
  playedAt: Date;
  rank: number;
  kills: number;
  damage: number;
};

export type SquadSummary = SquadHistorySummary & { winRate: number };

export type SquadHistory = SquadSummary & {
  items: SquadHistoryMatch[];
  page: number;
  totalPages: number;
};
