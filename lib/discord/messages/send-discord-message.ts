import "server-only";

import type { MessageCreateOptions } from "discord.js";

import { getReadyDiscordClient } from "@/lib/discord/runtime/discord-client";

/** 슬래시 명령과 무관하게 지정된 채널로 서버 주도 메시지를 전송한다. */
export async function sendDiscordMessage(
  channelId: string,
  message: string | MessageCreateOptions,
) {
  const client = await getReadyDiscordClient();
  const channel = await client.channels.fetch(channelId);

  if (!channel?.isSendable()) {
    throw new Error(`Discord channel is not sendable: ${channelId}`);
  }

  return channel.send(message);
}
