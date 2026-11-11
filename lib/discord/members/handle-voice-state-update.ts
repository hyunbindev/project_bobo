import "server-only";

import type { VoiceState } from "discord.js";

import { hasDiscordRegistration } from "@/lib/discord-accounts/repository";
import { collectVoiceDiscordAccount } from "@/lib/discord-accounts/service";
import { discordLogger } from "@/lib/logger";

const pendingMembers = new Set<string>();
const DISPLAY_NAME_PATTERN = /^\s*([가-힣A-Za-z]+)\s*(\d{2})\s*\/\s*([A-Za-z0-9_-]+)\s*$/;

/** 기존 회원의 표시 이름을 파싱·검증하여 연동한다. DM·닉네임 변경은 실행하지 않는다. */
export async function handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
  if (!newState.channelId || oldState.channelId === newState.channelId) return;

  const identity = { discordGuildId: newState.guild.id, discordUserId: newState.id };
  const key = `${identity.discordGuildId}:${identity.discordUserId}`;
  if (pendingMembers.has(key)) return;
  pendingMembers.add(key);

  try {
    const member = newState.member ?? await newState.guild.members.fetch(newState.id);
    if (member.user.bot || await hasDiscordRegistration(identity, true)) return;
    const match = member.displayName.match(DISPLAY_NAME_PATTERN);
    if (!match) return;
    const [, name, birthYearSuffix, pubgNickname] = match;
    const yearSuffix = Number.parseInt(birthYearSuffix, 10);
    const birthYear = yearSuffix > 50 ? 1900 + yearSuffix : 2000 + yearSuffix;
    if (birthYear > new Date().getFullYear()) return;

    const result = await collectVoiceDiscordAccount({
      ...identity,
      discordUsername: member.user.username,
      discordDisplayName: member.displayName,
      name,
      birthYear,
      nickname: pubgNickname,
      // 기존 Discord 직접 등록 명령과 같은 카카오 플랫폼으로 조회한다.
      platform: "kakao",
    });

    if (!result.player) {
      discordLogger.info({ event: "discord.voice_member_collection_rejected", ...identity },
        "Saved Discord profile without a PUBG player connection");
      return;
    }

    discordLogger.info({ event: "discord.voice_member_collected", ...identity },
      "Collected verified Discord member from voice activity");

  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    discordLogger.warn({
      event: "discord.voice_member_collection_failed", ...identity,
      code: typeof code === "number" || typeof code === "string" ? code : undefined,
    }, "Could not collect Discord member from voice activity");
  } finally {
    pendingMembers.delete(key);
  }
}
