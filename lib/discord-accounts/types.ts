import type { PubgPlatform } from "@/lib/pubg/types";

export type RegisterDiscordAccountInput = {
  birthYear: number;
  discordDisplayName: string;
  discordGuildId: string;
  discordUserId: string;
  discordUsername: string;
  nickname: string;
  platform: PubgPlatform;
};

export type LinkDiscordAccountInput = {
  clanMemberId: string;
  discordGuildId: string;
  discordUserId: string;
  discordDisplayName: string;
  discordUsername: string;
  birthYear: number;
};
