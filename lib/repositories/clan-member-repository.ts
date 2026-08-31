import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { clanMembers, clans, players } from "@/lib/db/schema";
import type { PubgClan } from "@/lib/pubg/clan-types";
import type { PubgPlatform, PubgPlayer } from "@/lib/pubg/types";

type DatabaseClient = typeof db;

export type SaveClanMemberInput = {
  clan: PubgClan;
  player: PubgPlayer;
  member: {
    displayName: string | null;
    birthYear: number | null;
    profileRegistered: boolean;
  };
};

export async function findActiveClanMembersByClanId(
  pubgClanId: string,
  database: DatabaseClient = db,
) {
  return database
    .select({
      memberId: clanMembers.id,
      playerId: players.id,
      pubgAccountId: players.pubgAccountId,
      nickname: players.name,
      platform: players.platform,
      displayName: clanMembers.displayName,
      birthYear: clanMembers.birthYear,
      profileRegistered: clanMembers.profileRegistered,
      status: clanMembers.status,
      joinedAt: clanMembers.joinedAt,
      lastSyncedAt: players.lastSyncedAt,
    })
    .from(clanMembers)
    .innerJoin(clans, eq(clanMembers.clanId, clans.id))
    .innerJoin(players, eq(clanMembers.playerId, players.id))
    .where(
      and(eq(clans.pubgClanId, pubgClanId), eq(clanMembers.status, "active")),
    )
    .orderBy(asc(players.name));
}

export async function findClanMemberDetailByPlayerId(
  playerId: string,
  database: DatabaseClient = db,
) {
  const [member] = await database
    .select({
      playerId: players.id,
      pubgAccountId: players.pubgAccountId,
      nickname: players.name,
      platform: players.platform,
      pubgClanId: players.pubgClanId,
      lastSyncedAt: players.lastSyncedAt,

      memberId: clanMembers.id,
      displayName: clanMembers.displayName,
      birthYear: clanMembers.birthYear,
      status: clanMembers.status,
      profileRegistered: clanMembers.profileRegistered,
      joinedAt: clanMembers.joinedAt,
      lastUpdateAt: clanMembers.updatedAt,

      clanId: clans.id,
      clanPubgId: clans.pubgClanId,
      clanName: clans.name,
      clanTag: clans.tag,
      clanLevel: clans.level,
    })
    .from(players)
    .innerJoin(clanMembers, eq(clanMembers.playerId, players.id))
    .innerJoin(clans, eq(clanMembers.clanId, clans.id))
    .where(and(eq(players.id, playerId), eq(clanMembers.status, "active")))
    .orderBy(desc(clanMembers.joinedAt))
    .limit(1);

  return member ?? null;
}

export async function findStoredPlayerByName(
  nickname: string,
  platform: PubgPlatform,
  database: DatabaseClient = db,
) {
  const [player] = await database
    .select()
    .from(players)
    .where(and(eq(players.name, nickname), eq(players.platform, platform)))
    .limit(1);

  return player ?? null;
}

export async function findStoredPlayerById(
  playerId: string,
  database: DatabaseClient = db,
) {
  const [player] = await database
    .select({
      id: players.id,
      nickname: players.name,
      platform: players.platform,
      pubgClanId: players.pubgClanId,
    })
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);

  return player ?? null;
}

export async function findStoredClanByPubgId(
  pubgClanId: string,
  platform: PubgPlatform,
  database: DatabaseClient = db,
) {
  const [clan] = await database
    .select()
    .from(clans)
    .where(and(eq(clans.pubgClanId, pubgClanId), eq(clans.platform, platform)))
    .limit(1);

  return clan ?? null;
}

export async function findStoredClanMember(
  limit?: number,
  database: DatabaseClient = db,
) {
  const query = database
    .select()
    .from(clanMembers)
    .innerJoin(players, eq(clanMembers.playerId, players.id))
    .where(eq(clanMembers.status, "active"))
    .orderBy(asc(players.lastSyncedAt), asc(players.id));

  return limit === undefined ? query : query.limit(limit);
}

export async function syncPlayersFromPubg(
  pubgPlayers: PubgPlayer[],
  database: DatabaseClient = db,
) {
  const uniquePlayers = [
    ...new Map(
      pubgPlayers.map((player) => [
        `${player.platform}:${player.accountId}`,
        player,
      ]),
    ).values(),
  ];

  if (uniquePlayers.length === 0) {
    return [];
  }

  return database
    .insert(players)
    .values(
      uniquePlayers.map((player) => ({
        pubgAccountId: player.accountId,
        name: player.name,
        platform: player.platform,
        pubgClanId: player.clanId,
        lastSyncedAt: new Date(),
      })),
    )
    .onConflictDoUpdate({
      target: [players.platform, players.pubgAccountId],
      set: {
        name: sql`excluded.name`,
        pubgClanId: sql`excluded.pubg_clan_id`,
        lastSyncedAt: sql`excluded.last_synced_at`,
      },
    })
    .returning({ pubgAccountId: players.pubgAccountId });
}

export async function saveClanMember(
  input: SaveClanMemberInput,
  database: DatabaseClient = db,
) {
  const now = new Date();

  return database.transaction(async (tx) => {
    const [savedClan] = await tx
      .insert(clans)
      .values({
        pubgClanId: input.clan.id,
        platform: input.clan.platform,
        name: input.clan.name,
        tag: input.clan.tag,
        level: input.clan.level,
        memberCount: input.clan.memberCount,
      })
      .onConflictDoUpdate({
        target: [clans.platform, clans.pubgClanId],
        set: {
          name: input.clan.name,
          tag: input.clan.tag,
          level: input.clan.level,
          memberCount: input.clan.memberCount,
          lastSyncedAt: now,
          updatedAt: now,
        },
      })
      .returning();

    const [savedPlayer] = await tx
      .insert(players)
      .values({
        pubgAccountId: input.player.accountId,
        name: input.player.name,
        platform: input.player.platform,
        pubgClanId: input.player.clanId,
      })
      .onConflictDoUpdate({
        target: [players.platform, players.pubgAccountId],
        set: {
          name: input.player.name,
          pubgClanId: input.player.clanId,
          lastSyncedAt: now,
        },
      })
      .returning();

    const memberUpdate = input.member.profileRegistered
      ? {
          displayName: input.member.displayName,
          birthYear: input.member.birthYear,
          profileRegistered: true,
          status: "active" as const,
          leftAt: null,
          updatedAt: now,
        }
      : {
          status: "active" as const,
          leftAt: null,
          updatedAt: now,
        };

    const [savedMember] = await tx
      .insert(clanMembers)
      .values({
        clanId: savedClan.id,
        playerId: savedPlayer.id,
        displayName: input.member.displayName,
        birthYear: input.member.birthYear,
        profileRegistered: input.member.profileRegistered,
      })
      .onConflictDoUpdate({
        target: [clanMembers.clanId, clanMembers.playerId],
        set: memberUpdate,
      })
      .returning();

    return {
      clan: savedClan,
      player: savedPlayer,
      member: savedMember,
    };
  });
}
