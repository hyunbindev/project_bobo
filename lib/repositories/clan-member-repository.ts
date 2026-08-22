import { db } from "@/lib/db";
import { clanMembers, clans, players } from "@/lib/db/schema";
import type { PubgClan } from "@/lib/pubg/clan-types";
import type { PubgPlayer } from "@/lib/pubg/types";

type DatabaseClient = typeof db;

export type SaveClanMemberRegistrationInput = {
  clan: PubgClan;
  player: PubgPlayer;
  member: {
    displayName: string;
    age: number;
  };
};

export async function saveClanMemberRegistration(
  input: SaveClanMemberRegistrationInput,
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

    const [savedMember] = await tx
      .insert(clanMembers)
      .values({
        clanId: savedClan.id,
        playerId: savedPlayer.id,
        displayName: input.member.displayName,
        age: input.member.age,
      })
      .onConflictDoNothing({
        target: [clanMembers.clanId, clanMembers.playerId],
      })
      .returning();

    if (!savedMember) {
      return null;
    }

    return {
      clan: savedClan,
      player: savedPlayer,
      member: savedMember,
    };
  });
}
