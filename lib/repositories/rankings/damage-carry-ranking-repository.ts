import { and, asc, desc, eq, gte, isNotNull, lt, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  clanMembers,
  matchParticipants,
  matches,
  players,
} from "@/lib/db/schema";
import type {
  RankingMetricRow,
  RankingRepositoryInput,
} from "@/lib/repositories/rankings/common-ranking-repository";

type DatabaseClient = typeof db;

export async function findDamageCarryRankings(
  input: RankingRepositoryInput,
  database: DatabaseClient = db,
): Promise<RankingMetricRow[]> {
  const rosterDamage = database
    .select({
      matchId: matchParticipants.matchId,
      pubgRosterId: matchParticipants.pubgRosterId,
      totalDamage: sql<number>`
        coalesce(sum(${matchParticipants.damageDealt}), 0)
      `.as("total_damage"),
    })
    .from(matchParticipants)
    .innerJoin(matches, eq(matches.id, matchParticipants.matchId))
    .leftJoin(
      clanMembers,
      and(
        eq(clanMembers.playerId, matchParticipants.playerId),
        eq(clanMembers.status, "active"),
      ),
    )
    .where(
      and(
        eq(matches.matchType, "official"),
        gte(matches.playedAt, input.startAt),
        lt(matches.playedAt, input.endAt),
        isNotNull(matchParticipants.pubgRosterId),
      ),
    )
    .groupBy(matchParticipants.matchId, matchParticipants.pubgRosterId)
    .having(sql`count(${clanMembers.playerId}) >= 2`)
    .as("roster_damage");

  const matchCount = sql<number>`cast(count(*) as integer)`;
  const carryMatchCount = sql<number>`
    cast(
      coalesce(
        sum(
          case
            when ${rosterDamage.totalDamage} > 0
              and ${matchParticipants.damageDealt} >= ${rosterDamage.totalDamage} * 0.5
            then 1
            else 0
          end
        ),
        0
      )
      as double precision
    )
  `;

  return database
    .select({
      playerId: players.id,
      playerName: players.name,
      value: carryMatchCount,
      matchCount,
    })
    .from(matchParticipants)
    .innerJoin(
      rosterDamage,
      and(
        eq(rosterDamage.matchId, matchParticipants.matchId),
        eq(rosterDamage.pubgRosterId, matchParticipants.pubgRosterId),
      ),
    )
    .innerJoin(players, eq(players.id, matchParticipants.playerId))
    .innerJoin(
      clanMembers,
      and(
        eq(clanMembers.playerId, matchParticipants.playerId),
        eq(clanMembers.status, "active"),
      ),
    )
    .groupBy(players.id, players.name)
    .orderBy(desc(carryMatchCount), desc(matchCount), asc(players.id))
    .limit(input.limit);
}
