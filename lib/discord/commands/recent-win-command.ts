import "server-only";

import { SlashCommandBuilder } from "discord.js";

import type { DiscordCommand } from "@/lib/discord/discord-command";
import { createWinMatchMessage } from "@/lib/discord/messages/create-win-match-message";
import { getRecentWonMatches } from "@/lib/services/match-service";

export const recentWinCommand: DiscordCommand = {
  definition: new SlashCommandBuilder()
    .setName("recent-win")
    .setNameLocalizations({ ko: "최근치킨" })
    .setDescription("Display the clan's most recent winning match")
    .setDescriptionLocalizations({
      ko: "클랜의 가장 최근 치킨 경기 기록을 표시합니다",
    }),

  async execute(interaction) {
    await interaction.deferReply();

    const [match] = await getRecentWonMatches(1);

    if (!match) {
      await interaction.editReply("저장된 치킨 경기 기록이 없습니다.");
      return;
    }

    await interaction.editReply(
      createWinMatchMessage(match, `${interaction.user.username} 요청`),
    );
  },
};
