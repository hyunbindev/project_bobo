import "server-only";

import { getDiscordRegistrationParams } from "@/lib/discord-accounts/registration-params";
import { createDiscordAppUrl } from "@/lib/discord/discord-app-url";

/** 봇이 확인한 사용자·서버 ID를 등록 페이지로 전달할 링크를 만든다. */
export function createDiscordRegistrationUrl(discordUserId: string, discordGuildId: string): string | null {
  const params = getDiscordRegistrationParams({ discordUserId, discordGuildId });
  const appUrl = createDiscordAppUrl("/join/discord");
  if (!params || !appUrl) return null;
  const url = new URL(appUrl);
  url.searchParams.set("discordUserId", params.discordUserId);
  url.searchParams.set("discordGuildId", params.discordGuildId);
  return url.toString();
}
