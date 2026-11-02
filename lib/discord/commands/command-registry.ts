import "server-only";

import {
  MessageFlags,
  type ChatInputCommandInteraction,
  type Interaction,
} from "discord.js";

import type { DiscordCommandHandler } from "@/lib/discord/discord-command";
import { discordCommands } from "@/lib/discord/discord-commands";
import { discordLogger } from "@/lib/logger";

const commandHandlers = new Map<string, DiscordCommandHandler>(
  discordCommands.map((command) => [
    command.definition.name,
    command.execute,
  ]),
);

// 개발 모드의 모듈 재로딩 이후에도 동일 interaction의 중복 실행을 막는다.
const globalForInteractions = globalThis as typeof globalThis & {
  discordHandledInteractions?: Map<string, number>;
};
const handledInteractions = (globalForInteractions.discordHandledInteractions ??= new Map<string, number>());
const INTERACTION_RETENTION_MS = 15 * 60 * 1_000;

/** Discord 이벤트를 명령별 handler로 전달하는 transport 계층이다. */
export async function handleDiscordInteraction(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const now = Date.now();
  for (const [id, handledAt] of handledInteractions) {
    if (now - handledAt >= INTERACTION_RETENTION_MS) handledInteractions.delete(id);
  }
  if (handledInteractions.has(interaction.id)) {
    return;
  }
  // 첫 await 전에 기록하여 동시에 수신한 중복 이벤트도 차단한다.
  handledInteractions.set(interaction.id, now);

  try {
    const handler = commandHandlers.get(interaction.commandName);
    if (!handler) {
      await interaction.reply({
        content: "지원하지 않는 명령어입니다.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await handler(interaction);
  } catch (error) {
    // 다른 봇 프로세스가 이미 응답했거나 만료된 경우 최초 응답을 재시도하지 않는다.
    if (logUnavailableInteraction(error, interaction)) return;

    discordLogger.error(
      {
        err: error,
        event: "discord.command_failed",
        commandName: interaction.commandName,
        discordUserId: interaction.user.id,
        guildId: interaction.guildId,
      },
      "Discord command failed",
    );

    try {
      await replyWithCommandError(interaction);
    } catch (replyError) {
      // 응답 상태 플래그와 Discord 서버의 상태가 다를 때도 중복 응답을 멈춘다.
      if (!logUnavailableInteraction(replyError, interaction)) throw replyError;
    }
  }
}

function logUnavailableInteraction(error: unknown, interaction: ChatInputCommandInteraction) {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  if (code !== 40060 && code !== 10062) return false;
  discordLogger.warn({
    event: "discord.interaction_response_unavailable",
    code,
    interactionId: interaction.id,
    commandName: interaction.commandName,
    guildId: interaction.guildId,
  }, "Interaction already acknowledged or unavailable; no response retry");
  return true;
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
