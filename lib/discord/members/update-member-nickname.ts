import "server-only";

import { REST, Routes, type RESTPatchAPIGuildMemberResult } from "discord.js";

let rest: REST | undefined;
let configuredToken: string | undefined;

/** Gateway 연결과 무관하게 봇 토큰으로 서버 닉네임을 변경한다. */
export async function updateDiscordMemberNickname(
  guildId: string,
  userId: string,
  nickname: string,
) {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  if (!token) throw new Error("DISCORD_BOT_TOKEN is not configured.");
  if (!rest || configuredToken !== token) {
    rest = new REST({ version: "10", timeout: 10_000, retries: 0 }).setToken(token);
    configuredToken = token;
  }

  const member = await rest.patch(Routes.guildMember(guildId, userId), {
    body: { nick: nickname },
    reason: "BOBO account registration",
  }) as RESTPatchAPIGuildMemberResult;

  return {
    discordDisplayName: member.nick ?? member.user.global_name ?? member.user.username,
    discordUsername: member.user.username,
  };
}
