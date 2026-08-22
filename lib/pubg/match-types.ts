import type { PubgPlatform, PubgResourceIdentifier } from "@/lib/pubg/types";

export type PubgMatchResource = {
  type: "match";
  id: string;
  attributes: {
    createdAt: string;
    duration: number;
    matchType: string;
    gameMode: string;
    mapName: string;
    isCustomMatch: boolean;
    // 일부 실제 응답에서는 공식 스키마와 달리 필드 자체가 생략된다.
    patchVersion?: string;
    seasonState: string;
    shardId: string;
    stats: Record<string, unknown> | null;
    tags: Record<string, unknown> | null;
    titleId: string;
  };
  relationships: {
    assets: { data: PubgResourceIdentifier[] };
    rosters: { data: PubgResourceIdentifier[] };
  };
};

export type PubgParticipantStats = {
  DBNOs: number;
  assists: number;
  boosts: number;
  damageDealt: number;
  deathType: string;
  headshotKills: number;
  heals: number;
  killPlace: number;
  killStreaks: number;
  kills: number;
  longestKill: number;
  name: string;
  playerId: string;
  revives: number;
  rideDistance: number;
  roadKills: number;
  swimDistance: number;
  teamKills: number;
  timeSurvived: number;
  vehicleDestroys: number;
  walkDistance: number;
  weaponsAcquired: number;
  winPlace: number;
};

export type PubgParticipantResource = {
  type: "participant";
  id: string;
  attributes: {
    actor?: string;
    shardId: string;
    stats: PubgParticipantStats;
  };
};

export type PubgRosterResource = {
  type: "roster";
  id: string;
  attributes: {
    shardId: string;
    stats: {
      rank: number;
      teamId: number;
    };
    // 공식 Match 스키마에서 won은 boolean이 아니라 문자열로 정의되어 있다.
    won: string;
  };
  relationships: {
    participants: {
      data: PubgResourceIdentifier[];
    };
  };
};

export type PubgAssetResource = {
  type: "asset";
  id: string;
  attributes: {
    URL: string;
    createdAt: string;
    description: string;
    name: string;
  };
};

export type PubgMatchIncludedResource =
  | PubgParticipantResource
  | PubgRosterResource
  | PubgAssetResource;

export type PubgMatchResponse = {
  data: PubgMatchResource;
  included: PubgMatchIncludedResource[];
  links?: { self?: string };
  meta?: Record<string, unknown>;
};

export type PubgMatchRoster = {
  id: string;
  teamId: number;
  rank: number;
  won: boolean;
  participantIds: string[];
};

export type PubgMatchParticipant = {
  id: string;
  rosterId: string | null;
  teamId: number | null;
  teamRank: number | null;
  stats: PubgParticipantStats;
};

export type PubgMatch = {
  id: string;
  platform: PubgPlatform;
  createdAt: string;
  duration: number;
  matchType: string;
  gameMode: string;
  mapName: string;
  isCustomMatch: boolean;
  patchVersion: string | null;
  seasonState: string;
  titleId: string;
  telemetryUrl: string | null;
  rosters: PubgMatchRoster[];
  participants: PubgMatchParticipant[];
};
