import { ApiError, BadRequestError, NotFoundError } from "@/lib/api/errors";
import { getMainClanSummary } from "@/lib/clans/service";
import {
  findDiscordNicknameTargets,
  findDiscordNicknameTarget,
  linkDiscordAccount,
  updateDiscordAccountNames,
  updateDiscordNicknameStatus,
  saveFailedVoiceCollection,
} from "@/lib/discord-accounts/repository";
import type { DiscordNicknameTarget, DiscordNicknameUpdate, DiscordRegistrationIdentity, RegisterDiscordAccountInput } from "@/lib/discord-accounts/types";
import { updateDiscordMemberNickname } from "@/lib/discord/members/update-member-nickname";
import { discordLogger } from "@/lib/logger";
import { resolvePubgPlayer } from "@/lib/members/player-service";
import type { PubgPlatform } from "@/lib/pubg/types";

/** API가 토큰에서 검증한 계정으로만 재시도한다. */
export async function retryDiscordNickname(identity: DiscordRegistrationIdentity) {
  const target = await findDiscordNicknameTarget(identity);
  if (!target) throw new NotFoundError("등록된 계정을 찾을 수 없습니다. 계정을 먼저 등록해 주세요.");
  return applyDiscordNickname(target);
}

/** 검증한 계정·프로필만 저장한다. 음성채널 수집에서도 닉네임 변경 없이 사용한다. */
export async function collectDiscordAccount(
  input: RegisterDiscordAccountInput,
  options: { isAutoSync?: boolean } = {},
) {
  const nickname = input.nickname.trim();
  const name = input.name.trim();
  const currentYear = new Date().getFullYear();
  if (!name || name.length > 30) {
    throw new BadRequestError("이름은 1자 이상 30자 이하로 입력해 주세요.");
  }
  if (!Number.isInteger(input.birthYear) || input.birthYear < 1900 || input.birthYear > currentYear) {
    throw new BadRequestError(`출생연도는 1900년부터 ${currentYear}년 사이여야 합니다.`);
  }
  if (!input.discordGuildId.trim() || !input.discordUserId.trim()) {
    throw new BadRequestError("Discord 계정과 서버 정보가 필요합니다.");
  }

  const player = await resolvePubgPlayer(nickname, input.platform);
  return linkDiscordAccount({ ...input, player, name, isAutoSync: options.isAutoSync });
}

export async function registerDiscordAccount(input: RegisterDiscordAccountInput) {
  const result = await collectDiscordAccount(input);
  const discordNicknameUpdate = await applyDiscordNickname({
    ...result.account, name: input.name.trim(), birthYear: input.birthYear, pubgName: result.player.name,
  });
  return { ...result, pubgName: result.player.name, discordNicknameUpdate };
}

export async function collectVoiceDiscordAccount(input: RegisterDiscordAccountInput) {
  const clanId = process.env.PUBG_CLAN_ID?.trim() || (await getMainClanSummary())?.pubgClanId;
  if (!clanId) throw new Error("Main PUBG clan is not configured");
  let player;
  try {
    player = await resolvePubgPlayer(input.nickname, input.platform);
  } catch (error) {
    if (error instanceof ApiError && error.code === "PUBG_PLAYER_NOT_FOUND") {
      return saveFailedVoiceCollection(input, "PUBG_PLAYER_NOT_FOUND");
    }
    throw error;
  }
  if (player.clanId !== clanId) return saveFailedVoiceCollection(input, "PUBG_CLAN_MISMATCH");
  return linkDiscordAccount({ ...input, name: input.name.trim(), player, isAutoSync: false });
}

/** 등록과 주기적 동기화에서 동일한 닉네임 적용·재시도 규칙을 사용한다. */
async function applyDiscordNickname(target: DiscordNicknameTarget): Promise<DiscordNicknameUpdate> {
  const nickname = `${target.name.trim()} ${String(target.birthYear).slice(-2)} / ${target.pubgName}`;
  if (target.nicknameStatus === "completed" && target.lastAppliedNickname === nickname) {
    return { status: "updated", nickname };
  }

  let message = Array.from(nickname).length > 32
    ? "서버 닉네임이 32자를 초과해 변경하지 못했습니다. 이름을 줄여 다시 등록해 주세요."
    : undefined;
  try {
    await updateDiscordNicknameStatus(target.id, "pending");
    if (message) {
      await updateDiscordNicknameStatus(target.id, "failed", message);
      return { status: "failed", message };
    }
    const names = await updateDiscordMemberNickname(target.discordGuildId, target.discordUserId, nickname);
    await updateDiscordAccountNames(target.id, names);
    return { status: "updated", nickname: names.discordDisplayName };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    discordLogger.warn({
      event: "discord.member_nickname_update_failed",
      discordGuildId: target.discordGuildId,
      discordUserId: target.discordUserId,
      code,
    }, "Failed to apply registered member nickname");

    message ??= code === 50013 || code === 50001
      ? "봇의 닉네임 관리 권한과 역할 순서를 관리자에게 확인해 주세요. 서버 소유자의 닉네임은 변경할 수 없습니다."
      : code === 10007 || code === 10004
        ? "Discord 서버 또는 사용자를 찾지 못했습니다. 가입한 서버의 등록 링크인지 확인해 주세요."
        : "서버 닉네임 변경을 완료하지 못했습니다. 잠시 후 다시 등록하거나 관리자에게 문의해 주세요.";
    try {
      await updateDiscordNicknameStatus(target.id, "failed", message);
    } catch (saveError) {
      discordLogger.error({ err: saveError, event: "discord.nickname_status_save_failed", accountId: target.id }, "Failed to save nickname sync status");
    }
    return { status: "failed", message };
  }
}

/** 조회에 성공한 플레이어의 연동 계정만 처리하며, 한 계정의 실패는 다음 계정을 막지 않는다. */
export async function syncDiscordNicknames(accountIds: string[], platform: PubgPlatform) {
  const targets = await findDiscordNicknameTargets(accountIds, platform);
  for (const target of targets) {
    await applyDiscordNickname(target);
  }
}
