import "server-only";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

import type { DiscordCommand } from "@/lib/discord/discord-command";
import { createDiscordRegistrationUrl } from "@/lib/discord/discord-registration-url";

export const registrationLinkCommand: DiscordCommand = {
  definition: new SlashCommandBuilder()
    .setName("start")
    .setNameLocalizations({ ko: "시작하기" })
    .setDescription("Open your PUBG account registration page")
    .setDescriptionLocalizations({ ko: "홈페이지에서 PUBG 계정을 등록합니다" })
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: "Discord 서버 안에서 사용해 주세요.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const url = createDiscordRegistrationUrl(interaction.user.id, interaction.guildId);
    if (!url) {
      await interaction.reply({
        content: "등록 페이지를 열 수 없습니다. 관리자에게 문의해 주세요.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const button = new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel("내 닉네임 등록하기")
      .setURL(url);

    await interaction.reply({
      content: "**BOBO에 오신 걸 환영해요 👋**\n\n함께 게임할 때 서로 알아볼 수 있도록\n배그 닉네임과 이름을 알려주세요.",
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
