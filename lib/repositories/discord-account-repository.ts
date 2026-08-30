import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  clanMemberDiscordAccounts,
  clanMembers,
  clans,
  players,
} from "@/lib/db/schema";
import type { PubgPlatform } from "@/lib/pubg/types";

type DatabaseClient = typeof db;

export type LinkDiscordAccountInput = {
  clanMemberId: string;
  discordGuildId: string;
  discordUserId: string;
  discordDisplayName: string;
  discordUsername: string;
  birthYear: number;
};

export async function findClanMemberForDiscordRegistration(
  nickname: string,
  platform: PubgPlatform,
  pubgClanId: string | undefined,
  database: DatabaseClient = db,
) {
  const [member] = await database
    .select({
      clanMemberId: clanMembers.id,
      playerId: players.id,
      pubgName: players.name,
    })
    .from(clanMembers)
    .innerJoin(players, eq(clanMembers.playerId, players.id))
    .innerJoin(clans, eq(clanMembers.clanId, clans.id))
    .where(
      and(
        eq(players.name, nickname),
        eq(players.platform, platform),
        eq(clanMembers.status, "active"),
        pubgClanId ? eq(clans.pubgClanId, pubgClanId) : undefined,
      ),
    )
    .limit(1);

  return member ?? null;
}

export async function linkDiscordAccount(
  input: LinkDiscordAccountInput,
  database: DatabaseClient = db,
) {
  return database.transaction(async (tx) => {
    const [discordLink] = await tx
      .select({ clanMemberId: clanMemberDiscordAccounts.clanMemberId })
      .from(clanMemberDiscordAccounts)
      .where(
        and(
          eq(
            clanMemberDiscordAccounts.discordGuildId,
            input.discordGuildId,
          ),
          eq(clanMemberDiscordAccounts.discordUserId, input.discordUserId),
        ),
      )
      .limit(1);

    if (discordLink && discordLink.clanMemberId !== input.clanMemberId) {
      return { status: "discord_account_conflict" as const };
    }

    const [memberLink] = await tx
      .select({ discordUserId: clanMemberDiscordAccounts.discordUserId })
      .from(clanMemberDiscordAccounts)
      .where(
        and(
          eq(clanMemberDiscordAccounts.clanMemberId, input.clanMemberId),
          eq(
            clanMemberDiscordAccounts.discordGuildId,
            input.discordGuildId,
          ),
        ),
      )
      .limit(1);

    if (memberLink && memberLink.discordUserId !== input.discordUserId) {
      return { status: "clan_member_conflict" as const };
    }

    const now = new Date();

    await tx
      .update(clanMembers)
      .set({
        displayName: input.discordDisplayName,
        birthYear: input.birthYear,
        profileRegistered: true,
        updatedAt: now,
      })
      .where(eq(clanMembers.id, input.clanMemberId));

    const [account] = await tx
      .insert(clanMemberDiscordAccounts)
      .values({
        clanMemberId: input.clanMemberId,
        discordGuildId: input.discordGuildId,
        discordUserId: input.discordUserId,
        discordDisplayName: input.discordDisplayName,
        discordUsername: input.discordUsername,
      })
      .onConflictDoUpdate({
        target: [
          clanMemberDiscordAccounts.discordGuildId,
          clanMemberDiscordAccounts.discordUserId,
        ],
        set: {
          discordDisplayName: input.discordDisplayName,
          discordUsername: input.discordUsername,
          updatedAt: now,
        },
      })
      .returning();

    return { status: "linked" as const, account };
  });
}

