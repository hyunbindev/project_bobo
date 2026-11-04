import "server-only";

import { getDiscordRegistrationParams } from "@/lib/discord-accounts/registration-params";
import { createDiscordAppUrl } from "@/lib/discord/discord-app-url";
import { createRegistrationToken } from "@/lib/discord-accounts/registration-token";

/** 봇이 확인한 사용자·서버 ID를 등록 페이지로 전달할 링크를 만든다. */
export function createDiscordRegistrationUrl(discordUserId: string, discordGuildId: string): string | null {
  const params = getDiscordRegistrationParams({ discordUserId, discordGuildId });
  const appUrl = createDiscordAppUrl("/join/discord");
  if (!params || !appUrl) return null;
  const url = new URL(appUrl);
  url.searchParams.set("token", createRegistrationToken(params));
  return url.toString();
}
