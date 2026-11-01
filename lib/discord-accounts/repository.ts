import { and, eq, inArray } from "drizzle-orm";

import { ConflictError } from "@/lib/api/errors";
import { db } from "@/lib/db";
import { playerDiscordAccounts, players } from "@/lib/db/schema";
import type { LinkDiscordAccountInput } from "@/lib/discord-accounts/types";
import type { PubgPlatform } from "@/lib/pubg/types";

type DatabaseClient = Omit<typeof db, "$client">;

/** Discord API가 반환한 실제 표시 이름과 사용자명을 반영한다. */
export async function updateDiscordAccountNames(
  accountId: string,
  names: { discordDisplayName: string; discordUsername: string },
) {
  const [account] = await db.update(playerDiscordAccounts)
    .set({ ...names, updatedAt: new Date() })
    .where(eq(playerDiscordAccounts.id, accountId))
    .returning();
  if (!account) throw new Error("Registered Discord account no longer exists.");
  return account;
}

/** 클랜 소속과 관계없이 플레이어·서버 기준으로 연동 계정을 찾는다. */
export async function findDiscordAccountsForPlayers(
  accountIds: string[], platform: PubgPlatform, guildId: string, database: DatabaseClient = db,
) {
  if (accountIds.length === 0) return [];
  return database.select({
    pubgAccountId: players.pubgAccountId,
    discordUserId: playerDiscordAccounts.discordUserId,
    discordDisplayName: playerDiscordAccounts.discordDisplayName,
  }).from(playerDiscordAccounts)
    .innerJoin(players, eq(players.id, playerDiscordAccounts.playerId))
    .where(and(
      inArray(players.pubgAccountId, accountIds), eq(players.platform, platform),
      eq(playerDiscordAccounts.discordGuildId, guildId),
    ));
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if ("code" in error && error.code === "23505") return true;
  return "cause" in error && error.cause !== error && isUniqueViolation(error.cause);
}

/** 플레이어와 등록 정보를 함께 저장하며, 클랜 가입 행은 만들거나 갱신하지 않는다. */
export async function linkDiscordAccount(input: LinkDiscordAccountInput, database: DatabaseClient = db) {
  try {
    return await database.transaction(async (tx) => {
      const now = new Date();
      const [player] = await tx.insert(players).values({
        pubgAccountId: input.player.accountId,
        name: input.player.name,
        platform: input.player.platform,
        pubgClanId: input.player.clanId,
      }).onConflictDoUpdate({
        target: [players.platform, players.pubgAccountId],
        set: { name: input.player.name, pubgClanId: input.player.clanId, lastSyncedAt: now },
      }).returning();

      const [discordLink] = await tx.select({ playerId: playerDiscordAccounts.playerId })
        .from(playerDiscordAccounts).where(and(
          eq(playerDiscordAccounts.discordGuildId, input.discordGuildId),
          eq(playerDiscordAccounts.discordUserId, input.discordUserId),
        )).limit(1);
      if (discordLink && discordLink.playerId !== player.id) {
        throw new ConflictError("이 Discord 계정은 이미 등록되어있습니다.");
      }

      const [playerLink] = await tx.select({ discordUserId: playerDiscordAccounts.discordUserId })
        .from(playerDiscordAccounts).where(and(
          eq(playerDiscordAccounts.playerId, player.id),
          eq(playerDiscordAccounts.discordGuildId, input.discordGuildId),
        )).limit(1);
      if (playerLink && playerLink.discordUserId !== input.discordUserId) {
        throw new ConflictError("이 Discord 계정은 이미 등록되어있습니다.");
      }

      const [account] = await tx.insert(playerDiscordAccounts).values({
        playerId: player.id,
        discordGuildId: input.discordGuildId,
        discordUserId: input.discordUserId,
        discordDisplayName: input.discordDisplayName,
        discordUsername: input.discordUsername,
        name: input.name,
        birthYear: input.birthYear,
      }).onConflictDoUpdate({
        target: [playerDiscordAccounts.discordGuildId, playerDiscordAccounts.discordUserId],
        set: {
          ...(input.discordDisplayName ? { discordDisplayName: input.discordDisplayName } : {}),
          ...(input.discordUsername ? { discordUsername: input.discordUsername } : {}),
          name: input.name,
          birthYear: input.birthYear,
          updatedAt: now,
        },
        // 동시 요청에서도 기존 계정 연결을 다른 플레이어로 바꾸지 않는다.
        setWhere: eq(playerDiscordAccounts.playerId, player.id),
      }).returning();
      if (!account) throw new ConflictError("Discord 계정의 연결 정보를 다시 확인해 주세요.");
      return { account, player };
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new ConflictError("이미 다른 계정과 연결되어 있습니다.");
    throw error;
  }
}
