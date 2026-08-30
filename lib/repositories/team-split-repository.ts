import { and, eq, gt, inArray, lte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  clanMemberDiscordAccounts,
  clanMembers,
  matchParticipants,
  players,
  teamSplitResults,
} from "@/lib/db/schema";
import type { TeamSplitSnapshot } from "@/lib/team-split/types";

type DatabaseClient = typeof db;

export type SaveTeamSplitResultInput = {
  shareToken: string;
  discordGuildId: string;
  discordVoiceChannelId: string;
  discordVoiceChannelName: string;
  requestedByDiscordUserId: string;
  requestedByDisplayName: string;
  membersPerTeam: number;
  teamCount: number;
  memberCount: number;
  result: TeamSplitSnapshot;
  expiresAt: Date;
};

export async function findPlayerStatsByDiscordUserIds(
  discordGuildId: string,
  discordUserIds: string[],
  database: DatabaseClient = db,
) {
  const uniqueUserIds = [...new Set(discordUserIds)];

  if (uniqueUserIds.length === 0) {
    return [];
  }

  return database
    .select({
      discordUserId: clanMemberDiscordAccounts.discordUserId,
      playerId: players.id,
      pubgName: players.name,
      averageDamage: sql<number | null>`
        cast(avg(${matchParticipants.damageDealt}) as double precision)
      `,
      averageRank: sql<number | null>`
        cast(avg(${matchParticipants.teamRank}) as double precision)
      `,
    })
    .from(clanMemberDiscordAccounts)
    .innerJoin(
      clanMembers,
      eq(clanMemberDiscordAccounts.clanMemberId, clanMembers.id),
    )
    .innerJoin(players, eq(clanMembers.playerId, players.id))
    .leftJoin(
      matchParticipants,
      eq(matchParticipants.playerId, players.id),
    )
    .where(
      and(
        eq(clanMemberDiscordAccounts.discordGuildId, discordGuildId),
        inArray(clanMemberDiscordAccounts.discordUserId, uniqueUserIds),
        eq(clanMembers.status, "active"),
      ),
    )
    .groupBy(
      clanMemberDiscordAccounts.discordUserId,
      players.id,
      players.name,
    );
}

export async function saveTeamSplitResult(
  input: SaveTeamSplitResultInput,
  database: DatabaseClient = db,
) {
  const [result] = await database
    .insert(teamSplitResults)
    .values(input)
    .returning();

  return result;
}

export async function findActiveTeamSplitResultByToken(
  shareToken: string,
  database: DatabaseClient = db,
) {
  const [result] = await database
    .select()
    .from(teamSplitResults)
    .where(
      and(
        eq(teamSplitResults.shareToken, shareToken),
        gt(teamSplitResults.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return result ?? null;
}

export async function deleteExpiredTeamSplitResults(
  database: DatabaseClient = db,
) {
  return database
    .delete(teamSplitResults)
    .where(lte(teamSplitResults.expiresAt, new Date()))
    .returning({ id: teamSplitResults.id });
}

