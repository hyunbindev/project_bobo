import type { PubgPlatform, PubgPlayer } from "@/lib/pubg/types";
import type { PlayerDiscordAccount } from "@/lib/db/schema/discord";

export type DiscordNicknameTarget = Pick<PlayerDiscordAccount,
  "id" | "discordGuildId" | "discordUserId" | "name" | "birthYear" |
  "nicknameStatus" | "lastAppliedNickname"
> & { pubgName: string };

export type DiscordNicknameUpdate =
  | { status: "updated"; nickname: string }
  | { status: "failed"; message: string };

/** URL로 전달받는 미검증 계정 식별자. 본인 확인 결과와 구분한다. */
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
