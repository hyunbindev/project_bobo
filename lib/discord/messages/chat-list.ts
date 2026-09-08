import { ChannelType } from "discord.js";
import { getReadyDiscordClient } from "@/lib/discord/runtime/discord-client";

export async function getDiscordTextChannels() {
  const client = await getReadyDiscordClient();
  const result = [];

  for (const guild of client.guilds.cache.values()) {
    // Discord API에서 최신 채널 목록 조회
    const channels = await guild.channels.fetch();

    for (const channel of channels.values()) {
      if (
        channel &&
        (channel.type === ChannelType.GuildText ||
          channel.type === ChannelType.GuildAnnouncement)
      ) {
        result.push({
          guildId: guild.id,
          guildName: guild.name,
          channelId: channel.id,
          channelName: channel.name,
        });
      }
    }
  }

  return result;
}