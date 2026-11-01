import type { SaveTeamSplitResultInput } from "@/lib/team-split/types";
import { and, eq, gt, inArray, lte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  playerDiscordAccounts,
  matchParticipants,
  players,
  teamSplitResults,
} from "@/lib/db/schema";

type DatabaseClient = typeof db;

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
      discordUserId: playerDiscordAccounts.discordUserId,
      playerId: players.id,
      pubgName: players.name,
      averageDamage: sql<number | null>`
        cast(avg(${matchParticipants.damageDealt}) as double precision)
      `,
      averageRank: sql<number | null>`
        cast(avg(${matchParticipants.teamRank}) as double precision)
      `,
    })
    .from(playerDiscordAccounts)
    .innerJoin(players, eq(playerDiscordAccounts.playerId, players.id))
    .leftJoin(
      matchParticipants,
      eq(matchParticipants.playerId, players.id),
    )
    .where(
      and(
        eq(playerDiscordAccounts.discordGuildId, discordGuildId),
        inArray(playerDiscordAccounts.discordUserId, uniqueUserIds),
      ),
    )
    .groupBy(
      playerDiscordAccounts.discordUserId,
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

