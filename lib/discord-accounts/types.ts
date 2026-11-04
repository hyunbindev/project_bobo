import type { PubgPlatform, PubgPlayer } from "@/lib/pubg/types";
import type { PlayerDiscordAccount } from "@/lib/db/schema/discord";

export type DiscordNicknameTarget = Pick<PlayerDiscordAccount,
  "id" | "discordGuildId" | "discordUserId" | "name" | "birthYear" |
  "nicknameStatus" | "lastAppliedNickname"
> & { pubgName: string };

export type DiscordNicknameUpdate =
  | { status: "updated"; nickname: string }
  | { status: "failed"; message: string };

/** Discord 식별자 쌍. 형식 검사는 발급 출처나 방문자의 본인 여부를 증명하지 않는다. */
export type DiscordRegistrationParams = {
  discordUserId: string;
  discordGuildId: string;
};

export type DiscordRegistrationIdentity = {
  discordDisplayName: string;
  discordGuildId: string;
  discordUserId: string;
  discordUsername: string;
};

export type RegisterDiscordAccountInput = DiscordRegistrationIdentity & {
  birthYear: number;
  name: string;
  nickname: string;
  platform: PubgPlatform;
};

export type LinkDiscordAccountInput = DiscordRegistrationIdentity & {
  player: PubgPlayer;
  name: string;
  birthYear: number;
};
