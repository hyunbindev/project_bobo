import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

export type DiscordCommandHandler = (
  interaction: ChatInputCommandInteraction,
) => Promise<void>;

/** Discord 등록 명세와 런타임 처리기를 하나의 명령 단위로 묶는다. */
export type DiscordCommand = {
  // 옵션 추가 후 반환되는 builder도 받을 수 있도록 등록에 필요한 표면만 요구한다.
  definition: Pick<SlashCommandBuilder, "name" | "toJSON">;
  execute: DiscordCommandHandler;
};
