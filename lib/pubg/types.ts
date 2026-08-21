export const PUBG_PLATFORMS = ["steam", "kakao", "psn", "xbox"] as const;

export type PubgPlatform = (typeof PUBG_PLATFORMS)[number];

export type PubgResourceIdentifier = {
  type: string;
  id: string;
};

export type PubgPlayerResource = {
  type: "player";
  id: string;
  attributes: {
    name: string;
    shardId: string;
    clanId?: string;
  };
  relationships: {
    matches: {
      data: PubgResourceIdentifier[];
    };
  };
};

export type PubgPlayersResponse = {
  data: PubgPlayerResource[];
  links?: {
    self?: string;
  };
  meta?: Record<string, unknown>;
};

export type PubgPlayer = {
  accountId: string;
  name: string;
  platform: PubgPlatform;
  clanId: string | null;
  matchIds: string[];
};
