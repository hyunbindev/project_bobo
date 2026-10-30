import "server-only";

import type { Guild } from "discord.js";

import { discordLogger } from "@/lib/logger";
import { findDiscordAccountsForPlayers } from "@/lib/discord-accounts/repository";
import { getMainClanSummary } from "@/lib/clans/service";
import type { RecentWonMatch } from "@/lib/matches/types";
import { getSquadHistorySummary } from "@/lib/squad-history/service";
import type { SquadSummary } from "@/lib/squad-history/types";

export type WinMatchProfile = {
  userId: string;
  displayName: string;
};

export type WinMatchContext = {
  summary?: SquadSummary | null;
  profiles?: ReadonlyMap<string, WinMatchProfile>;
};

/** 집계나 프로필 조회 실패가 우승 알림 발송을 막지 않도록 한다. */
export async function loadWinMatchSummary(match: RecentWonMatch) {
  try {
    const clan = await getMainClanSummary();
    return clan ? await getSquadHistorySummary({ matchId: match.matchId, rosterId: match.rosterId, clanId: clan.id }) : null;
  } catch (error) {
    discordLogger.warn({ err: error, event: "discord.win_summary_failed", matchId: match.matchId }, "Failed to load squad summary for win message");
    return null;
  }
}

export async function loadWinMatchProfiles(match: RecentWonMatch, guild: Guild | null) {
  const profiles = new Map<string, WinMatchProfile>();
  if (!guild) return profiles;
  try {
    const accounts = await findDiscordAccountsForPlayers(
      match.members.map((member) => member.pubgAccountId), match.platform, guild.id,
    );
    // 멘션에 표시되는 닉네임은 Discord가 처리하므로 사용자별 API 조회가 필요 없다.
    for (const account of accounts) {
      profiles.set(account.pubgAccountId, {
        userId: account.discordUserId, displayName: account.discordDisplayName,
      });
    }
  } catch (error) {
    discordLogger.warn({ err: error, event: "discord.win_accounts_failed", guildId: guild.id, matchId: match.matchId }, "Failed to load linked Discord accounts");
  }
  return profiles;
}
