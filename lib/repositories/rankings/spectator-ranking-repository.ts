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

export async function findSpectatorRankings(
  input: RankingRepositoryInput,
  database: DatabaseClient = db,
): Promise<RankingMetricRow[]> {
  const clanRosterSurvival = database
    .select({
      matchId: matchParticipants.matchId,
      pubgRosterId: matchParticipants.pubgRosterId,
      maxSurvival: sql<number>`
        max(${matchParticipants.timeSurvived})
      `.as("max_survival"),
    })
    .from(matchParticipants)
    .innerJoin(matches, eq(matches.id, matchParticipants.matchId))
    .innerJoin(
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
    .having(sql`count(*) >= 2`)
    .as("clan_roster_survival");

  const matchCount = sql<number>`cast(count(*) as integer)`;
  const averageSpectatorMinutes = sql<number>`
    cast(
      coalesce(
        avg(
          greatest(
            ${clanRosterSurvival.maxSurvival} - ${matchParticipants.timeSurvived},
            0
          )
        ) / 60.0,
        0
      )
      as double precision
    )
  `;

  return database
    .select({
      playerId: players.id,
      playerName: players.name,
      value: averageSpectatorMinutes,
      matchCount,
    })
    .from(matchParticipants)
    .innerJoin(
      clanRosterSurvival,
      and(
        eq(clanRosterSurvival.matchId, matchParticipants.matchId),
        eq(clanRosterSurvival.pubgRosterId, matchParticipants.pubgRosterId),
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
    .having(sql`count(*) >= ${input.minMatchCount}`)
    .orderBy(
      desc(averageSpectatorMinutes),
      desc(matchCount),
      asc(players.id),
    )
    .limit(input.limit);
}
