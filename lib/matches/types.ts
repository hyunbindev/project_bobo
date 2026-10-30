import type { PubgMatch } from "@/lib/pubg/match-types";

export type MatchRosterHistoryPage = {
  items: MatchRosterListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type RecentWonMatch = {
  id: string;
  matchId: string;
  rosterId: string;
  mapName: string;
  gameMode: string;
  matchType: string;
  playedAt: Date;
  rank: number;
  kills: number;
  damage: number;
  platform: PubgMatch["platform"];
  members: Array<{
    id: string;
    pubgAccountId: string;
    name: string;
    kills: number;
    damage: number;
  }>;
};

export type CreateRecentWonMatchesInput = {
  history: PubgMatch;
  storedMatchId: string;
  clanAccountIds: ReadonlySet<string>;
  minimumClanMemberCount?: number;
};

export type SaveMatchHistoryInput = {
  history: PubgMatch;
  participantAccountIds: Iterable<string>;
};

export type MatchRosterListItem = {
  matchId: string;
  pubgMatchId: string;
  rosterId: string;
  mapName: string;
  gameMode: string;
  matchType: string;
  playedAt: Date;
  rank: number;
  kills: number;
  dbnos: number;
  damage: number;
  participantCount: number;
  memberNames: string[];
};

export type FindMatchRosterHistoriesInput = {
  limit: number;
  offset: number;
  isWon: boolean;
  playerId?: string;
  clanId?: string;
};

export type MatchRosterDetailParticipant = {
  id: string;
  playerId: string;
  pubgAccountId: string;
  name: string;
  pubgClanId: string | null;
  teamId: number | null;
  teamRank: number | null;
  kills: number;
  assists: number;
  dbnos: number;
  headshotKills: number;
  revives: number;
  boosts: number;
  heals: number;
  killPlace: number;
  killStreaks: number;
  roadKills: number;
  teamKills: number;
  vehicleDestroys: number;
  weaponsAcquired: number;
  damageDealt: number;
  timeSurvived: number;
  longestKill: number;
  rideDistance: number;
  swimDistance: number;
  walkDistance: number;
  winPlace: number;
  deathType: string;
};

export type MatchRosterDetail = {
  match: {
    id: string;
    pubgMatchId: string;
    platform: "steam" | "kakao" | "psn" | "xbox";
    mapName: string;
    gameMode: string;
    matchType: string;
    duration: number;
    isCustomMatch: boolean;
    patchVersion: string | null;
    playedAt: Date;
    totalTeams: number;
  };
  roster: {
    id: string;
    teamId: number | null;
    rank: number;
  };
  participants: MatchRosterDetailParticipant[];
};
