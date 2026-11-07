import { and, asc, desc, eq, isNotNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { playerDiscordAccounts } from "@/lib/db/schema";

/** 서버가 지정되면 해당 서버 프로필을 사용하고, 미지정 시 최근 수정된 등록 정보를 사용한다. */
export function playerRegistrationProfiles(database: Omit<typeof db, "$client"> = db) {
  const guildId = process.env.DISCORD_GUILD_ID?.trim();
  return database.selectDistinctOn([playerDiscordAccounts.playerId], {
    playerId: playerDiscordAccounts.playerId,
    name: playerDiscordAccounts.name,
    birthYear: playerDiscordAccounts.birthYear,
  }).from(playerDiscordAccounts)
    .where(and(
      guildId ? eq(playerDiscordAccounts.discordGuildId, guildId) : undefined,
      isNotNull(playerDiscordAccounts.playerId),
      isNotNull(playerDiscordAccounts.name),
      isNotNull(playerDiscordAccounts.birthYear),
    ))
    .orderBy(playerDiscordAccounts.playerId, desc(playerDiscordAccounts.updatedAt), asc(playerDiscordAccounts.id))
    .as("registration_profiles");
}
