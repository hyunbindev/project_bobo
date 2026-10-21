import "server-only";

import { getDiscordTextChannels } from "@/lib/discord/messages/chat-list";
import { startDiscordBot } from "@/lib/discord/runtime/discord-client";
import { registerDiscordCommands } from "@/lib/discord/runtime/register-discord-commands";
import { discordLogger } from "@/lib/logger";

/** 명령 명세 등록 후 Gateway에 연결하고, 초기화 실패를 기록한다. */
export async function bootstrapDiscord() {
  try {
    await registerDiscordCommands();
    await startDiscordBot();

    const channels = await getDiscordTextChannels();
    discordLogger.info(
      {
        event: "discord.text_channels_loaded",
        channelCount: channels.length,
        channels,
      },
      "Discord text channels loaded",
    );
  } catch (error: unknown) {
    discordLogger.error(
      {
        err: error,
        event: "discord.initialization_failed",
      },
      "Failed to initialize Discord",
    );
  }
}
