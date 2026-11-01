import type { DiscordRegistrationParams } from "@/lib/discord-accounts/types";

function parseDiscordId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  if (!/^[1-9]\d{0,19}$/.test(id)) return null;
  return BigInt(id) <= BigInt("18446744073709551615") ? id : null;
}

/** 형식만 검사한다. URL의 ID가 실제 방문자 본인인지는 증명하지 않는다. */
export function getDiscordRegistrationParams(value: unknown): DiscordRegistrationParams | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const params = value as Record<string, unknown>;
  const discordUserId = parseDiscordId(params.discordUserId);
  const discordGuildId = parseDiscordId(params.discordGuildId);
  return discordUserId && discordGuildId ? { discordUserId, discordGuildId } : null;
}
