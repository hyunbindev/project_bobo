import "server-only";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  escapeMarkdown,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

import type { DiscordCommand } from "@/lib/discord/discord-command";
import { createDiscordAppUrl } from "@/lib/discord/discord-app-url";
import { createTeamSplit } from "@/lib/services/team-split-service";

const MAX_MEMBERS_PER_TEAM = 99;

export const teamSplitCommand: DiscordCommand = {
  definition: new SlashCommandBuilder()
    .setName("team-split")
    .setNameLocalizations({ ko: "팀분배" })
    .setDescription("Randomly split members in your voice channel into teams")
    .setDescriptionLocalizations({
      ko: "현재 음성 채널의 인원을 무작위로 팀 분배합니다",
    })
    .addIntegerOption((option) =>
      option
        .setName("members-per-team")
        .setNameLocalizations({ ko: "인원" })
        .setDescription("Maximum number of members per team")
        .setDescriptionLocalizations({ ko: "팀당 배정할 최대 인원입니다" })
        .setMinValue(1)
        .setMaxValue(MAX_MEMBERS_PER_TEAM)
        .setRequired(true),
    ),

  /** 음성 채널 인원을 확인하고 웹 팀 배분 결과 페이지로 안내한다. */
  async execute(interaction) {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({
        content: "Discord 서버 안에서만 사용할 수 있는 명령어입니다.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const voiceChannel = guild.voiceStates.cache.get(
      interaction.user.id,
    )?.channel;

    if (!voiceChannel) {
      await interaction.reply({
        content: "음성 채널에 접속한 상태에서 실행해 주세요.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const members = [...voiceChannel.members.values()]
      .filter((member) => !member.user.bot)
      .map((member) => ({
        discordUserId: member.id,
        discordDisplayName: member.displayName,
      }));
    const membersPerTeam = interaction.options.getInteger(
      "members-per-team",
      true,
    );

    if (members.length === 0) {
      await interaction.reply({
        content: "팀을 배정할 사용자가 없습니다.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();

    const requestedByDisplayName =
      voiceChannel.members.get(interaction.user.id)?.displayName ??
      interaction.user.globalName ??
      interaction.user.username;
    const savedResult = await createTeamSplit({
      discordGuildId: guild.id,
      discordVoiceChannelId: voiceChannel.id,
      discordVoiceChannelName: voiceChannel.name,
      requestedByDiscordUserId: interaction.user.id,
      requestedByDisplayName,
      membersPerTeam,
      members,
    });
    const resultUrl = createDiscordAppUrl(
      `/team-splits/${encodeURIComponent(savedResult.shareToken)}`,
    );

    if (!resultUrl) {
      throw new Error("APP_BASE_URL is not configured with a valid URL.");
    }

    const linkRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("팀 배분 결과 확인")
        .setStyle(ButtonStyle.Link)
        .setURL(resultUrl),
    );

    await interaction.editReply({
      content: [
        "**팀 배분이 완료되었습니다.**",
        `${escapeMarkdown(voiceChannel.name)} · 참여 ${savedResult.memberCount}명 · ${savedResult.teamCount}팀`,
        `${escapeMarkdown(interaction.user.username)} 요청`,
        "결과는 15분 동안 조회할 수 있습니다.",
      ].join("\n"),
      components: [linkRow],
    });
  },
};
