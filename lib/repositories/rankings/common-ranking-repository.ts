import { and, asc, desc, eq, gte, lt, sql, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  clanMembers,
  matchParticipants,
  matches,
  players,
} from "@/lib/db/schema";

type DatabaseClient = typeof db;

export type RankingRepositoryInput = {
  clanId: string;
  startAt: Date;
  endAt: Date;
  limit: number;
};

export type RankingMetricRow = {
  playerId: string;
  playerName: string;
  value: number;
  matchCount: number;
};

type FindMetricRankingsInput = RankingRepositoryInput & {
  metric: SQL<number>;
};

/**
 * 랭킹 repository들이 공유하는 참가 조건과 정렬을 적용한다.
 * 구체적인 통계 컬럼과 집계식은 각 repository가 metric으로 전달한다.
 */
export async function findMetricRankings(
  input: FindMetricRankingsInput,
  database: DatabaseClient = db,
): Promise<RankingMetricRow[]> {
  const matchCount = sql<number>`cast(count(*) as integer)`;

  return database
    .select({
      playerId: players.id,
      playerName: players.name,
      value: input.metric,
      matchCount,
    })
    .from(matchParticipants)
    .innerJoin(matches, eq(matches.id, matchParticipants.matchId))
    .innerJoin(players, eq(players.id, matchParticipants.playerId))
    .innerJoin(
      clanMembers,
      and(
        eq(clanMembers.playerId, matchParticipants.playerId),
        eq(clanMembers.clanId, input.clanId),
        eq(clanMembers.status, "active"),
      ),
    )
    .where(
      and(
        eq(matches.matchType, "official"),
        gte(matches.playedAt, input.startAt),
        lt(matches.playedAt, input.endAt),
        sql`(
          select count(distinct teammate.player_id)
          from match_participants teammate
          inner join clan_members teammate_member
            on teammate_member.player_id = teammate.player_id
          where teammate.match_id = ${matchParticipants.matchId}
            and teammate.pubg_roster_id = ${matchParticipants.pubgRosterId}
            and teammate_member.clan_id = ${input.clanId}
            and teammate_member.status = 'active'
        ) >= 2`,
      ),
    )
    .groupBy(players.id, players.name)
    .orderBy(desc(input.metric), desc(matchCount), asc(players.id))
    .limit(input.limit);
}
