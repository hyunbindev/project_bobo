import "server-only";

import {
  ContainerBuilder,
  escapeMarkdown,
  MessageFlags,
  PermissionFlagsBits,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
} from "discord.js";

import { sendDiscordMessage } from "@/lib/discord/messages/send-discord-message";
import { getReadyDiscordClient } from "@/lib/discord/runtime/discord-client";
import { discordLogger } from "@/lib/logger";

type DiscordStartupMessageState = {
  sent?: boolean;
  promise?: Promise<void>;
};

// 개발 모드의 모듈 재로딩에서도 시작 메시지는 프로세스당 한 번만 전송한다.
const globalForStartupMessage = globalThis as typeof globalThis & {
  discordStartupMessage?: DiscordStartupMessageState;
};

const startupMessageState = (globalForStartupMessage.discordStartupMessage ??=
  {});

export function sendDiscordStartupMessage() {
  if (startupMessageState.sent) {
    return Promise.resolve();
  }

  if (startupMessageState.promise) {
    return startupMessageState.promise;
  }

  startupMessageState.promise = performSend()
    .catch((error: unknown) => {
      discordLogger.error(
        { err: error, event: "discord.startup_message_failed" },
        "Failed to send Discord startup message",
      );
      throw error;
    })
    .finally(() => {
      startupMessageState.promise = undefined;
    });

  return startupMessageState.promise;
}

async function performSend() {
  const client = await getReadyDiscordClient();
  const guilds = [...client.guilds.cache.values()];
  const startedAt = Math.floor(Date.now() / 1_000);

  discordLogger.info(
    {
      event: "discord.guilds_loaded",
      guildCount: guilds.length,
      guilds: guilds.map((guild) => ({ id: guild.id, name: guild.name })),
    },
    "Discord guilds loaded",
  );

  let sentCount = 0;

  for (const guild of guilds) {
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
          event: "discord.startup_message_skipped",
          guildId: guild.id,
          guildName: guild.name,
          systemChannelId: channel?.id,
        },
        "Discord guild has no sendable system channel",
      );
      continue;
    }

    try {
      const startupContainer = new ContainerBuilder()
        .setAccentColor(0x57f287)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            "# 🟢 BOBO SYSTEM ONLINE\n-# APPLICATION STARTUP SIGNAL",
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setDivider(true)
            .setSpacing(SeparatorSpacingSize.Small),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            [
              "### 연결 상태",
              "`WEB` **ONLINE**",
              `\`DISCORD\` **CONNECTED** · ${client.ws.ping}ms`,
              `\`BOT\` **${escapeMarkdown(client.user.tag)}**`,
              `\`SERVER\` **${escapeMarkdown(guild.name)}**`,
            ].join("\n"),
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setDivider(false)
            .setSpacing(SeparatorSpacingSize.Small),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# <t:${startedAt}:F> · 가입 서버 ${guilds.length}개 · 자동 시작 알림`,
          ),
        );

      await sendDiscordMessage(channel.id, {
        components: [startupContainer],
        flags: MessageFlags.IsComponentsV2,
      });
      sentCount += 1;
    } catch (error) {
      discordLogger.error(
        {
          err: error,
          event: "discord.startup_message_guild_failed",
          guildId: guild.id,
          guildName: guild.name,
          channelId: channel.id,
        },
        "Failed to send Discord startup message to guild",
      );
    }
  }

  startupMessageState.sent = true;

  discordLogger.info(
    {
      event: "discord.startup_messages_completed",
      guildCount: guilds.length,
      sentCount,
      skippedCount: guilds.length - sentCount,
    },
    "Discord startup messages completed",
  );
}
