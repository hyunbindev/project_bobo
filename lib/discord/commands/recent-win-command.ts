import "server-only";

import { SlashCommandBuilder } from "discord.js";

import type { DiscordCommand } from "@/lib/discord/discord-command";
import { createWinMatchMessage } from "@/lib/discord/messages/create-win-match-message";
import { loadWinMatchProfiles, loadWinMatchSummary } from "@/lib/discord/messages/win-match-context";
import { getRecentWonMatches } from "@/lib/matches/service";

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

    const [summary, profiles] = await Promise.all([
      loadWinMatchSummary(match),
      loadWinMatchProfiles(match, interaction.guild),
    ]);
    await interaction.editReply(createWinMatchMessage(match, { summary, profiles }));
  },
};
