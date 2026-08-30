import "server-only";

import { PermissionFlagsBits } from "discord.js";

import { createWinMatchMessage } from "@/lib/discord/messages/create-win-match-message";
import { sendDiscordMessage } from "@/lib/discord/messages/send-discord-message";
import { getReadyDiscordClient } from "@/lib/discord/runtime/discord-client";
import { discordLogger } from "@/lib/logger";
import type { RecentWonMatch } from "@/lib/services/match-service";

export type MatchWinNotificationResult = {
  sent: boolean;
  guildId: string;
  channelId: string | null;
};

/** 설정된 Discord Guild의 시스템 채널로 치킨 경기 알림을 전송한다. */
export async function sendMatchWinNotification(
  match: RecentWonMatch,
): Promise<MatchWinNotificationResult> {
  const guildId = process.env.DISCORD_GUILD_ID?.trim();

  if (!guildId) {
    throw new Error("DISCORD_GUILD_ID is not configured.");
  }

  const client = await getReadyDiscordClient();
  const guild =
    client.guilds.cache.get(guildId) ?? (await client.guilds.fetch(guildId));
  const channel = guild.systemChannel;
  const botMember = guild.members.me;

  if (
    !channel ||
    !botMember ||
    !channel.permissionsFor(botMember).has([
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
    ])
  ) {
    discordLogger.warn(
      {
        event: "discord.match_win_notification_skipped",
        guildId,
        systemChannelId: channel?.id,
      },
      "Discord guild has no sendable system channel",
    );

    return { sent: false, guildId, channelId: channel?.id ?? null };
  }

  await sendDiscordMessage(
    channel.id,
    createWinMatchMessage(match, "자동 경기 알림"),
  );

  discordLogger.info(
    {
      event: "discord.match_win_notification_sent",
      guildId,
      channelId: channel.id,
      matchId: match.matchId,
      rosterId: match.rosterId,
    },
    "Discord match win notification sent",
  );

  return { sent: true, guildId, channelId: channel.id };
}
