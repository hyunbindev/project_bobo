import "server-only";

import { MessageFlags, SlashCommandBuilder } from "discord.js";

import { ApiError } from "@/lib/api/errors";
import type { DiscordCommand } from "@/lib/discord/discord-command";
import { registerDiscordAccount } from "@/lib/services/discord-account-service";

export const registerPlayerCommand: DiscordCommand = {
  definition: new SlashCommandBuilder()
    .setName("register-player")
    .setNameLocalizations({ ko: "아이디등록" })
    .setDescription("Connect your Discord account to a PUBG player")
    .setDescriptionLocalizations({
      ko: "Discord 계정에 PUBG 아이디를 연결합니다",
    })
    .addStringOption((option) =>
      option
        .setName("pubg-id")
        .setNameLocalizations({ ko: "배그아이디" })
        .setDescription("PUBG nickname")
        .setDescriptionLocalizations({ ko: "PUBG에서 사용하는 닉네임" })
        .setMaxLength(64)
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("birth-year")
        .setNameLocalizations({ ko: "출생연도" })
        .setDescription("Four-digit birth year")
        .setDescriptionLocalizations({ ko: "4자리 출생연도" })
        .setMinValue(1900)
        .setMaxValue(new Date().getFullYear())
        .setRequired(true),
    ),

  async execute(interaction) {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({
        content: "Discord 서버 안에서만 사용할 수 있는 명령어입니다.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const member = await guild.members.fetch(interaction.user.id);
    const nickname = interaction.options.getString("pubg-id", true);
    const birthYear = interaction.options.getInteger("birth-year", true);

    try {
      const result = await registerDiscordAccount({
        nickname,
        birthYear,
        platform: "kakao",
        discordGuildId: guild.id,
        discordUserId: interaction.user.id,
        discordDisplayName: member.displayName,
        discordUsername: interaction.user.username,
      });

      await interaction.editReply({
        content: [
          `PUBG 아이디 **${result.pubgName}** 연결이 완료되었습니다.`,
          result.usedStoredClanMember
            ? "기존 클랜원 정보를 사용하여 API 조회 없이 등록했습니다."
            : "PUBG 계정과 클랜 소속을 확인하여 등록했습니다.",
        ].join("\n"),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        await interaction.editReply({ content: error.message });
        return;
      }

      throw error;
    }
  },
};

