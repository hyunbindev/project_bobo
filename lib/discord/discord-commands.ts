import "server-only";

import { boboKingCommand } from "@/lib/discord/commands/bobo-king-command";
import { pingCommand } from "@/lib/discord/commands/ping-command";
import { recentWinCommand } from "@/lib/discord/commands/recent-win-command";
import { registerPlayerCommand } from "@/lib/discord/commands/register-player-command";
import { teamSplitCommand } from "@/lib/discord/commands/team-split-command";
import type { DiscordCommand } from "@/lib/discord/discord-command";

/** 등록과 런타임 라우팅이 함께 사용하는 단일 명령 목록이다. */
export const discordCommands: readonly DiscordCommand[] = [
  pingCommand,
  boboKingCommand,
  teamSplitCommand,
  recentWinCommand,
  registerPlayerCommand,
];
