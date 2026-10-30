import "server-only";

import { createWinMatchMessage } from "@/lib/discord/messages/create-win-match-message";
import { getDiscordSendableChannel } from "@/lib/discord/messages/send-discord-message";
import { loadWinMatchProfiles, loadWinMatchSummary } from "@/lib/discord/messages/win-match-context";
import { discordLogger } from "@/lib/logger";
import type { RecentWonMatch } from "@/lib/matches/types";

const DISCORD_CHANNEL_IDS = [
  ...new Set(
    (process.env.DISCORD_CHANNEL_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  ),
];

export type MatchWinNotificationResult = {
  sent: boolean;
  channelIds: string[];
};

/** 설정된 Discord 채널들로 치킨 경기 알림을 전송한다. */
export async function sendMatchWinNotification(
  match: RecentWonMatch,
): Promise<MatchWinNotificationResult> {
  if (DISCORD_CHANNEL_IDS.length === 0) {
    throw new Error("DISCORD_CHANNEL_IDS is not configured.");
  }

  const sentChannelIds: string[] = [];
  const summary = await loadWinMatchSummary(match);

  for (const channelId of DISCORD_CHANNEL_IDS) {
    const channel = await getDiscordSendableChannel(channelId);
    const profiles = await loadWinMatchProfiles(match, "guild" in channel ? channel.guild : null);
    await channel.send(createWinMatchMessage(match, { summary, profiles }));

    sentChannelIds.push(channelId);

    discordLogger.info(
      {
        event: "discord.match_win_notification_sent",
        channelId,
        matchId: match.matchId,
        rosterId: match.rosterId,
      },
      "Discord match win notification sent",
    );
  }

  return {
    sent: sentChannelIds.length > 0,
    channelIds: sentChannelIds,
  };
}
