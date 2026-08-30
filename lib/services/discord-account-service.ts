import { BadRequestError, ConflictError } from "@/lib/api/errors";
import type { PubgPlatform } from "@/lib/pubg/types";
import {
  findClanMemberForDiscordRegistration,
  linkDiscordAccount,
} from "@/lib/repositories/discord-account-repository";
import { registerClanMember } from "@/lib/services/clan-member-service";

export type RegisterDiscordAccountInput = {
  birthYear: number;
  discordDisplayName: string;
  discordGuildId: string;
  discordUserId: string;
  discordUsername: string;
  nickname: string;
  platform: PubgPlatform;
};

export async function registerDiscordAccount(
  input: RegisterDiscordAccountInput,
) {
  const nickname = input.nickname.trim();
  const currentYear = new Date().getFullYear();

  if (!nickname || nickname.length > 64 || nickname.includes(",")) {
    throw new BadRequestError("올바른 PUBG 아이디를 입력해 주세요.");
  }

  if (
    !Number.isInteger(input.birthYear) ||
    input.birthYear < 1900 ||
    input.birthYear > currentYear
  ) {
    throw new BadRequestError(
      `출생연도는 1900년부터 ${currentYear}년 사이여야 합니다.`,
    );
  }

  // 자동 동기화로 이미 등록된 클랜원은 PUBG API를 호출하지 않고 즉시 재사용한다.
  const storedMember = await findClanMemberForDiscordRegistration(
    nickname,
    input.platform,
    process.env.PUBG_CLAN_ID?.trim() || undefined,
  );

  const clanMemberId = storedMember
    ? storedMember.clanMemberId
    : (
        await registerClanMember({
          nickname,
          displayName: input.discordDisplayName,
          birthYear: input.birthYear,
          platform: input.platform,
        })
      ).member.id;

  const result = await linkDiscordAccount({
    clanMemberId,
    discordGuildId: input.discordGuildId,
    discordUserId: input.discordUserId,
    discordDisplayName: input.discordDisplayName,
    discordUsername: input.discordUsername,
    birthYear: input.birthYear,
  });

  if (result.status === "discord_account_conflict") {
    throw new ConflictError(
      "이 Discord 계정은 이미 다른 PUBG 아이디와 연결되어 있습니다.",
    );
  }

  if (result.status === "clan_member_conflict") {
    throw new ConflictError(
      "해당 PUBG 아이디는 이미 다른 Discord 계정과 연결되어 있습니다.",
    );
  }

  return {
    account: result.account,
    pubgName: storedMember?.pubgName ?? nickname,
    usedStoredClanMember: storedMember !== null,
  };
}

