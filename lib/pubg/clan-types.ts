import type { PubgPlatform } from "@/lib/pubg/types";

// PUBG Clan API가 그대로 내려주는 JSON:API 리소스 형태다.
export type PubgClanResource = {
  type: "clan";
  id: string;
  attributes: {
    clanName: string;
    clanTag: string;
    clanLevel: number;
    clanMemberCount: number;
  };
  links?: {
    schema?: string;
    self?: string;
  };
};

export type PubgClanResponse = {
  data: PubgClanResource;
  links?: {
    self?: string;
  };
  meta?: Record<string, unknown>;
};

// 화면이나 DB에서 외부 API 형식을 몰라도 되도록 내부 형태로 정규화한다.
export type PubgClan = {
  id: string;
  platform: PubgPlatform;
  name: string;
  tag: string;
  level: number;
  memberCount: number;
};
