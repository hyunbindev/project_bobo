import "server-only";

import {
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

import type { DiscordCommand } from "@/lib/discord/discord-command";

export const pingCommand: DiscordCommand = {
  definition: new SlashCommandBuilder()
    .setName("ping")
    .setNameLocalizations({ ko: "핑" })
    .setDescription("Check whether BOBO bot is online")
    .setDescriptionLocalizations({ ko: "BOBO 봇의 연결 상태를 확인합니다" }),
  /** Gateway와 명령 처리기가 정상인지 확인하는 최소 명령이다. */
  async execute(interaction) {
    await interaction.reply({
      content: `BOBO 봇 연결 상태: 정상 · Gateway 지연 시간: ${interaction.client.ws.ping}ms`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
