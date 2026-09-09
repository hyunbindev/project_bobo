import "server-only";

import { MessageFlags, SlashCommandBuilder } from "discord.js";

import type { DiscordCommand } from "@/lib/discord/discord-command";
import { sendDiscordMessage } from "@/lib/discord/messages/send-discord-message";
import { discordLogger } from "@/lib/logger";

const DISCORD_CHANNEL_IDS = [
  ...new Set(
    (process.env.DISCORD_CHANNEL_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  ),
];

export const broadcastMessageCommand: DiscordCommand = {
  definition: new SlashCommandBuilder()
    .setName("broadcast")
    .setNameLocalizations({ ko: "전체메세지" })
    .setDescription("Send a message to every configured Discord channel")
    .setDescriptionLocalizations({
      ko: "설정된 모든 Discord 채널에 메시지를 보냅니다",
    })
    .addStringOption((option) =>
      option
        .setName("message")
        .setNameLocalizations({ ko: "내용" })
        .setDescription("Message to send")
        .setDescriptionLocalizations({ ko: "전송할 메시지" })
        .setMaxLength(2_000)
        .setRequired(true),
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (DISCORD_CHANNEL_IDS.length === 0) {
      throw new Error("DISCORD_CHANNEL_IDS is not configured.");
    }

    const message = interaction.options.getString("message", true);
    const results = await Promise.allSettled(
      DISCORD_CHANNEL_IDS.map(async (channelId) => {
        try {
          await sendDiscordMessage(channelId, { content: message });
          return channelId;
        } catch (error) {
          discordLogger.error(
            {
              err: error,
              event: "discord.broadcast_message_failed",
              channelId,
              discordUserId: interaction.user.id,
            },
            "Failed to send Discord broadcast message",
          );
          throw error;
        }
      }),
    );

    const sentCount = results.filter(
      (result) => result.status === "fulfilled",
    ).length;
    const failedCount = results.length - sentCount;

    discordLogger.info(
      {
        event: "discord.broadcast_message_completed",
        discordUserId: interaction.user.id,
        channelCount: results.length,
        sentCount,
        failedCount,
      },
      "Discord broadcast message completed",
    );

    await interaction.editReply(
      `전체 메시지 전송 완료: 성공 ${sentCount}개, 실패 ${failedCount}개`,
    );
  },
};
