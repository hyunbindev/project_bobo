import "server-only";

import {
  MessageFlags,
  type ChatInputCommandInteraction,
  type Interaction,
} from "discord.js";

import { executeBoboKingCommand } from "@/lib/discord/commands/bobo-king-command";
import { executePingCommand } from "@/lib/discord/commands/ping-command";
import { logger } from "@/lib/logger";

type DiscordCommandHandler = (
  interaction: ChatInputCommandInteraction,
) => Promise<void>;

// 명령 이름과 구현을 한곳에서 연결한다. 새 명령은 handler를 만든 뒤 여기에 추가한다.
const commandHandlers = new Map<string, DiscordCommandHandler>([
  ["ping", executePingCommand],
  ["boboking", executeBoboKingCommand],
]);

/** Discord 이벤트를 명령별 handler로 전달하는 transport 계층이다. */
export async function handleDiscordInteraction(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const handler = commandHandlers.get(interaction.commandName);

  if (!handler) {
    await interaction.reply({
      content: "지원하지 않는 명령어입니다.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await handler(interaction);
  } catch (error) {
    logger.error(
      {
        err: error,
        event: "discord.command_failed",
        commandName: interaction.commandName,
        discordUserId: interaction.user.id,
        guildId: interaction.guildId,
      },
      "Discord command failed",
    );

    await replyWithCommandError(interaction);
  }
}

async function replyWithCommandError(interaction: ChatInputCommandInteraction) {
  const content = "명령 처리 중 오류가 발생했습니다. 잠시 후 다시 시도하십시오.";

  if (interaction.deferred) {
    await interaction.editReply({ content });
    return;
  }

  if (interaction.replied) {
    await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.reply({ content, flags: MessageFlags.Ephemeral });
}
