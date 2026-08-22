import type { PubgPlatform, PubgResourceIdentifier } from "@/lib/pubg/types";

export const PUBG_GAME_MODES = [
  "solo",
  "solo-fpp",
  "duo",
  "duo-fpp",
  "squad",
  "squad-fpp",
] as const;

export type PubgGameMode = (typeof PUBG_GAME_MODES)[number];

export type PubgGameModeStats = {
  assists: number;
  boosts: number;
  dBNOs: number;
  dailyKills: number;
  dailyWins: number;
  damageDealt: number;
  days: number;
  headshotKills: number;
  heals: number;
  kills: number;
  longestKill: number;
  longestTimeSurvived: number;
  losses: number;
  maxKillStreaks: number;
  mostSurvivalTime: number;
  revives: number;
  rideDistance: number;
  roadKills: number;
  roundMostKills: number;
  roundsPlayed: number;
  suicides: number;
  swimDistance: number;
  teamKills: number;
  timeSurvived: number;
  top10s: number;
  vehicleDestroys: number;
  walkDistance: number;
  weaponsAcquired: number;
  weeklyKills: number;
  weeklyWins: number;
  wins: number;
};

export type PubgSeasonResource = {
  type: "season";
  id: string;
  attributes: {
    isCurrentSeason: boolean;
    isOffseason: boolean;
  };
};

export type PubgSeasonsResponse = {
  data: PubgSeasonResource[];
};

export type PubgPlayerSeasonResponse = {
  data: {
    type: "playerSeason";
    attributes: {
      gameModeStats: Partial<Record<PubgGameMode, PubgGameModeStats>>;
      bestRankPoint?: number;
    };
    relationships?: Partial<
      Record<
        | "matchesSolo"
        | "matchesSoloFPP"
        | "matchesDuo"
        | "matchesDuoFPP"
        | "matchesSquad"
        | "matchesSquadFPP",
        { data: PubgResourceIdentifier[] }
      >
    > & {
      player?: {
        data: PubgResourceIdentifier;
      };
      season?: {
        data: PubgResourceIdentifier;
      };
    };
  };
};

export type PubgPlayerSeasonStats = {
  accountId: string;
  platform: PubgPlatform;
  seasonId: string;
  bestRankPoint: number | null;
  gameModeStats: Partial<Record<PubgGameMode, PubgGameModeStats>>;
  matchIds: string[];
};
