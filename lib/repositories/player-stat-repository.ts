import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { matchParticipants, matches } from "@/lib/db/schema";

type DatabaseClient = typeof db;

export type HighRecordDetail = {
  value: number;
  mapName: string;
  gameMode: string;
};

export type HighRecord = {
  maxDamage: HighRecordDetail;
  maxKills: HighRecordDetail;
  longestKillRange: HighRecordDetail;
  maxRevives: HighRecordDetail;
};

export type PlayerTrendMatch = {
  matchId: string;
  playedAt: Date;
  mapName: string;
  gameMode: string;
  damage: number;
  kills: number;
  rank: number;
};

export async function findPlayerTrendMatches(
  playerId: string,
  clanId: string,
  since: Date,
  limit = 20,
  database: DatabaseClient = db,
): Promise<PlayerTrendMatch[]> {
  return database
    .select({
      matchId: matches.id,
      playedAt: matches.playedAt,
      mapName: matches.mapName,
      gameMode: matches.gameMode,
      damage: matchParticipants.damageDealt,
      kills: matchParticipants.kills,
      rank: sql<number>`coalesce(${matchParticipants.teamRank}, ${matchParticipants.winPlace})`,
    })
    .from(matchParticipants)
    .innerJoin(matches, eq(matches.id, matchParticipants.matchId))
    .where(
      and(
        eq(matchParticipants.playerId, playerId),
        gte(matches.playedAt, since),
        isNotNull(matchParticipants.pubgRosterId),
        sql`(
          select count(distinct teammate.player_id)
          from match_participants teammate
          inner join clan_members member
            on member.player_id = teammate.player_id
          where teammate.match_id = ${matchParticipants.matchId}
            and teammate.pubg_roster_id = ${matchParticipants.pubgRosterId}
            and member.clan_id = ${clanId}
            and member.status = 'active'
        ) >= 2`,
      ),
    )
    .orderBy(desc(matches.playedAt), desc(matches.id))
    .limit(limit);
}

export async function findPlayerHighRecord(
  playerId: string,
  database: DatabaseClient = db,
): Promise<HighRecord | null> {
  const [record] = await database
    .select({
      matchCount: sql<number>`cast(count(*) as integer)`,

      maxDamage: sql<number>`
        cast(coalesce(max(${matchParticipants.damageDealt}), 0) as double precision)
      `,
      maxDamageMapName: sql<string | null>`
        (array_agg(
          ${matches.mapName}
          order by ${matchParticipants.damageDealt} desc, ${matches.playedAt} desc
        ))[1]
      `,
      maxDamageGameMode: sql<string | null>`
        (array_agg(
          ${matches.gameMode}
          order by ${matchParticipants.damageDealt} desc, ${matches.playedAt} desc
        ))[1]
      `,

      maxKills: sql<number>`
        cast(coalesce(max(${matchParticipants.kills}), 0) as integer)
      `,
      maxKillsMapName: sql<string | null>`
        (array_agg(
          ${matches.mapName}
          order by ${matchParticipants.kills} desc, ${matches.playedAt} desc
        ))[1]
      `,
      maxKillsGameMode: sql<string | null>`
        (array_agg(
          ${matches.gameMode}
          order by ${matchParticipants.kills} desc, ${matches.playedAt} desc
        ))[1]
      `,

      longestKillRange: sql<number>`
        cast(coalesce(max(${matchParticipants.longestKill}), 0) as double precision)
      `,
      longestKillMapName: sql<string | null>`
        (array_agg(
          ${matches.mapName}
          order by ${matchParticipants.longestKill} desc, ${matches.playedAt} desc
        ))[1]
      `,
      longestKillGameMode: sql<string | null>`
        (array_agg(
          ${matches.gameMode}
          order by ${matchParticipants.longestKill} desc, ${matches.playedAt} desc
        ))[1]
      `,

      maxRevives: sql<number>`
        cast(coalesce(max(${matchParticipants.revives}), 0) as integer)
      `,
      maxRevivesMapName: sql<string | null>`
        (array_agg(
          ${matches.mapName}
          order by ${matchParticipants.revives} desc, ${matches.playedAt} desc
        ))[1]
      `,
      maxRevivesGameMode: sql<string | null>`
        (array_agg(
          ${matches.gameMode}
          order by ${matchParticipants.revives} desc, ${matches.playedAt} desc
        ))[1]
      `,
    })
    .from(matchParticipants)
    .innerJoin(
      matches,
      and(
        eq(matchParticipants.matchId, matches.id),
        eq(matches.matchType, "official"),
      ),
    )
    .where(eq(matchParticipants.playerId, playerId));

  if (!record || record.matchCount === 0) {
    return null;
  }

  // matchCount가 1 이상이므로 각 array_agg 결과에는 반드시 맵과 모드가 있다.
  return {
    maxDamage: {
      value: record.maxDamage,
      mapName: record.maxDamageMapName!,
      gameMode: record.maxDamageGameMode!,
    },
    maxKills: {
      value: record.maxKills,
      mapName: record.maxKillsMapName!,
      gameMode: record.maxKillsGameMode!,
    },
    longestKillRange: {
      value: record.longestKillRange,
      mapName: record.longestKillMapName!,
      gameMode: record.longestKillGameMode!,
    },
    maxRevives: {
      value: record.maxRevives,
      mapName: record.maxRevivesMapName!,
      gameMode: record.maxRevivesGameMode!,
    },
  };
}
