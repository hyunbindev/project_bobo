import "server-only";

import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";

/** Gateway와 명령 처리기가 정상인지 확인하는 최소 명령이다. */
export async function executePingCommand(
  interaction: ChatInputCommandInteraction,
) {
  await interaction.reply({
    content: `BOBO 봇 연결 상태: 정상 · Gateway 지연 시간: ${interaction.client.ws.ping}ms`,
    flags: MessageFlags.Ephemeral,
  });
}
