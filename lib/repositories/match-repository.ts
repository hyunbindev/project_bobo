import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { clanMembers, matchParticipants, matches, players } from "@/lib/db/schema";
import type { PubgMatch } from "@/lib/pubg/match-types";

type DatabaseClient = typeof db;

export type SaveMatchHistoryInput = {
  history: PubgMatch;
  participantAccountIds: Iterable<string>;
};

export type StoredMatchHistory = {
  history: PubgMatch;
  participantAccountIds: string[];
};

export type MatchRosterListItem = {
  matchId: string;
  pubgMatchId: string;
  rosterId: string;
  mapName: string;
  gameMode: string;
  matchType: string;
  playedAt: Date;
  rank: number;
  kills: number;
  dbnos: number;
  damage: number;
  participantCount: number;
  memberNames: string[];
};

export type FindMatchRosterHistoriesInput = {
  limit: number;
  offset: number;
  isWon:boolean,
};

export type MatchRosterDetailParticipant = {
  id: string;
  playerId: string;
  name: string;
  pubgClanId: string | null;
  teamId: number | null;
  teamRank: number | null;
  kills: number;
  assists: number;
  dbnos: number;
  headshotKills: number;
  revives: number;
  boosts: number;
  heals: number;
  killPlace: number;
  killStreaks: number;
  roadKills: number;
  teamKills: number;
  vehicleDestroys: number;
  weaponsAcquired: number;
  damageDealt: number;
  timeSurvived: number;
  longestKill: number;
  rideDistance: number;
  swimDistance: number;
  walkDistance: number;
  winPlace: number;
  deathType: string;
};

export type MatchRosterDetail = {
  match: {
    id: string;
    pubgMatchId: string;
    platform: "steam" | "kakao" | "psn" | "xbox";
    mapName: string;
    gameMode: string;
    matchType: string;
    duration: number;
    isCustomMatch: boolean;
    patchVersion: string | null;
    playedAt: Date;
    totalTeams: number;
  };
  roster: {
    id: string;
    teamId: number | null;
    rank: number;
  };
  participants: MatchRosterDetailParticipant[];
};

export async function countMatchRosterHistories(
  database: DatabaseClient = db,
): Promise<number> {
  const eligibleRosters = database
    .select({
      matchId: matchParticipants.matchId,
      rosterId: matchParticipants.pubgRosterId,
    })
    .from(matchParticipants)
    .innerJoin(
      clanMembers,
      and(
        eq(
          clanMembers.playerId,
          matchParticipants.playerId,
        ),
        eq(clanMembers.status, "active"),
      ),
    )
    .where(
      isNotNull(matchParticipants.pubgRosterId),
    )
    .groupBy(
      matchParticipants.matchId,
      matchParticipants.pubgRosterId,
    )
    .having(sql`
      count(distinct ${clanMembers.playerId}) >= 2
    `)
    .as("eligible_rosters");

  const [countResult] = await database
    .select({
      count: sql<number>`
        cast(count(*) as integer)
      `,
    })
    .from(eligibleRosters);

  return countResult?.count ?? 0;
}

export async function findMatchRosterHistories(
  input: FindMatchRosterHistoriesInput,
  database: DatabaseClient = db,
): Promise<MatchRosterListItem[]> {
  const conditions = [
    isNotNull(matchParticipants.pubgRosterId),
  ];

  if (input.isWon === true) {
    conditions.push(
      eq(matchParticipants.teamRank, 1),
    );
  }

  return database
    .select({
      matchId: matches.id,
      pubgMatchId: matches.pubgMatchId,
      rosterId: sql<string>`${matchParticipants.pubgRosterId}`,
      mapName: matches.mapName,
      gameMode: matches.gameMode,
      matchType: matches.matchType,
      playedAt: matches.playedAt,

      rank: sql<number>`
        cast(
          coalesce(max(${matchParticipants.teamRank}), 0)
          as integer
        )
      `,

      kills: sql<number>`
        cast(
          coalesce(sum(${matchParticipants.kills}), 0)
          as integer
        )
      `,

      dbnos: sql<number>`
        cast(
          coalesce(sum(${matchParticipants.dbnos}), 0)
          as integer
        )
      `,

      damage: sql<number>`
        cast(
          coalesce(sum(${matchParticipants.damageDealt}), 0)
          as double precision
        )
      `,

      participantCount: sql<number>`
        cast(count(*) as integer)
      `,

      memberNames: sql<string[]>`
        array_agg(
          ${players.name}
          order by ${matchParticipants.damageDealt} desc
        )
      `,
    })
    .from(matchParticipants)
    .innerJoin(
      matches,
      eq(matchParticipants.matchId, matches.id),
    )
    .innerJoin(
      players,
      eq(matchParticipants.playerId, players.id),
    )
    .leftJoin(
      clanMembers,
      and(
        eq(clanMembers.playerId, players.id),
        eq(clanMembers.status, "active"),
      ),
    )
    .where(and(...conditions))
    .groupBy(
      matches.id,
      matchParticipants.pubgRosterId,
    )
    .having(sql`
      count(distinct ${clanMembers.playerId}) >= 2
    `)
    .orderBy(
      desc(matches.playedAt),
      desc(matches.id),
    )
    .limit(input.limit)
    .offset(input.offset);
}

export async function findMatchRosterDetail(
  matchId: string,
  rosterId: string,
  database: DatabaseClient = db,
): Promise<MatchRosterDetail | null> {
  const rows = await database
    .select({
      matchId: matches.id,
      pubgMatchId: matches.pubgMatchId,
      platform: matches.platform,
      mapName: matches.mapName,
      gameMode: matches.gameMode,
      matchType: matches.matchType,
      duration: matches.duration,
      isCustomMatch: matches.isCustomMatch,
      patchVersion: matches.patchVersion,
      playedAt: matches.playedAt,
      totalTeams: sql<number>`cast(jsonb_array_length(${matches.rawResponse}->'rosters') as integer)`,
      participantId: matchParticipants.pubgParticipantId,
      playerId: players.id,
      playerName: players.name,
      pubgClanId: players.pubgClanId,
      teamId: matchParticipants.teamId,
      teamRank: matchParticipants.teamRank,
      kills: matchParticipants.kills,
      assists: matchParticipants.assists,
      dbnos: matchParticipants.dbnos,
      headshotKills: matchParticipants.headshotKills,
      revives: matchParticipants.revives,
      boosts: matchParticipants.boosts,
      heals: matchParticipants.heals,
      killPlace: matchParticipants.killPlace,
      killStreaks: matchParticipants.killStreaks,
      roadKills: matchParticipants.roadKills,
      teamKills: matchParticipants.teamKills,
      vehicleDestroys: matchParticipants.vehicleDestroys,
      weaponsAcquired: matchParticipants.weaponsAcquired,
      damageDealt: matchParticipants.damageDealt,
      timeSurvived: matchParticipants.timeSurvived,
      longestKill: matchParticipants.longestKill,
      rideDistance: matchParticipants.rideDistance,
      swimDistance: matchParticipants.swimDistance,
      walkDistance: matchParticipants.walkDistance,
      winPlace: matchParticipants.winPlace,
      deathType: matchParticipants.deathType,
    })
    .from(matchParticipants)
    .innerJoin(matches, eq(matchParticipants.matchId, matches.id))
    .innerJoin(players, eq(matchParticipants.playerId, players.id))
    .where(
      and(
        eq(matches.id, matchId),
        eq(matchParticipants.pubgRosterId, rosterId),
      ),
    )
    .orderBy(desc(matchParticipants.damageDealt));

  const firstRow = rows[0];

  if (!firstRow) {
    return null;
  }

  return {
    match: {
      id: firstRow.matchId,
      pubgMatchId: firstRow.pubgMatchId,
      platform: firstRow.platform,
      mapName: firstRow.mapName,
      gameMode: firstRow.gameMode,
      matchType: firstRow.matchType,
      duration: firstRow.duration,
      isCustomMatch: firstRow.isCustomMatch,
      patchVersion: firstRow.patchVersion,
      playedAt: firstRow.playedAt,
      totalTeams: firstRow.totalTeams,
    },
    roster: {
      id: rosterId,
      teamId: firstRow.teamId,
      rank: firstRow.teamRank ?? firstRow.winPlace,
    },
    participants: rows.map((row) => ({
      id: row.participantId,
      playerId: row.playerId,
      name: row.playerName,
      pubgClanId: row.pubgClanId,
      teamId: row.teamId,
      teamRank: row.teamRank,
      kills: row.kills,
      assists: row.assists,
      dbnos: row.dbnos,
      headshotKills: row.headshotKills,
      revives: row.revives,
      boosts: row.boosts,
      heals: row.heals,
      killPlace: row.killPlace,
      killStreaks: row.killStreaks,
      roadKills: row.roadKills,
      teamKills: row.teamKills,
      vehicleDestroys: row.vehicleDestroys,
      weaponsAcquired: row.weaponsAcquired,
      damageDealt: row.damageDealt,
      timeSurvived: row.timeSurvived,
      longestKill: row.longestKill,
      rideDistance: row.rideDistance,
      swimDistance: row.swimDistance,
      walkDistance: row.walkDistance,
      winPlace: row.winPlace,
      deathType: row.deathType,
    })),
  };
}

export async function findStoredMatchIds(
  pubgMatchIds: string[],
  database: DatabaseClient = db,
) {
  const uniqueMatchIds = [...new Set(pubgMatchIds)];

  if (uniqueMatchIds.length === 0) {
    return [];
  }

  const storedMatches = await database
    .select({ pubgMatchId: matches.pubgMatchId })
    .from(matches)
    .where(inArray(matches.pubgMatchId, uniqueMatchIds));

  return storedMatches.map(({ pubgMatchId }) => pubgMatchId);
}

export async function findStoredMatchHistories(
  pubgMatchIds: string[],
  database: DatabaseClient = db,
): Promise<StoredMatchHistory[]> {
  const uniqueMatchIds = [...new Set(pubgMatchIds)];

  if (uniqueMatchIds.length === 0) {
    return [];
  }

  const storedMatches = await database
    .select({
      id: matches.id,
      rawResponse: matches.rawResponse,
    })
    .from(matches)
    .where(inArray(matches.pubgMatchId, uniqueMatchIds));

  if (storedMatches.length === 0) {
    return [];
  }

  const storedParticipants = await database
    .select({
      matchId: matchParticipants.matchId,
      pubgAccountId: players.pubgAccountId,
    })
    .from(matchParticipants)
    .innerJoin(players, eq(matchParticipants.playerId, players.id))
    .where(
      inArray(
        matchParticipants.matchId,
        storedMatches.map((match) => match.id),
      ),
    );

  const accountIdsByMatchId = new Map<string, string[]>();

  for (const participant of storedParticipants) {
    const accountIds = accountIdsByMatchId.get(participant.matchId) ?? [];
    accountIds.push(participant.pubgAccountId);
    accountIdsByMatchId.set(participant.matchId, accountIds);
  }

  return storedMatches.map((match) => ({
    history: match.rawResponse as PubgMatch,
    participantAccountIds: accountIdsByMatchId.get(match.id) ?? [],
  }));
}

export async function saveMatchHistory(
  input: SaveMatchHistoryInput,
  database: DatabaseClient = db,
) {
  const { history } = input;
  const now = new Date();

  return database.transaction(async (tx) => {
    const [savedMatch] = await tx
      .insert(matches)
      .values({
        pubgMatchId: history.id,
        platform: history.platform,
        mapName: history.mapName,
        gameMode: history.gameMode,
        matchType: history.matchType,
        duration: history.duration,
        isCustomMatch: history.isCustomMatch,
        patchVersion: history.patchVersion,
        playedAt: new Date(history.createdAt),
        telemetryUrl: history.telemetryUrl,
        rawResponse: history,
        fetchedAt: now,
      })
      .onConflictDoUpdate({
        target: matches.pubgMatchId,
        set: {
          platform: history.platform,
          mapName: history.mapName,
          gameMode: history.gameMode,
          matchType: history.matchType,
          duration: history.duration,
          isCustomMatch: history.isCustomMatch,
          patchVersion: history.patchVersion,
          playedAt: new Date(history.createdAt),
          telemetryUrl: history.telemetryUrl,
          rawResponse: history,
          fetchedAt: now,
        },
      })
      .returning();

    const participantAccountIds = [...new Set(input.participantAccountIds)];

    if (participantAccountIds.length === 0) {
      return { match: savedMatch, participantCount: 0 };
    }

    const participantAccountIdSet = new Set(participantAccountIds);
    const rosterParticipants = history.participants.filter((participant) =>
      participantAccountIdSet.has(participant.stats.playerId),
    );

    if (rosterParticipants.length === 0) {
      return { match: savedMatch, participantCount: 0 };
    }

    await tx
      .insert(players)
      .values(
        rosterParticipants.map((participant) => ({
          pubgAccountId: participant.stats.playerId,
          name: participant.stats.name,
          platform: history.platform,
        })),
      )
      .onConflictDoNothing();

    const storedPlayers = await tx
      .select({
        id: players.id,
        pubgAccountId: players.pubgAccountId,
      })
      .from(players)
      .where(
        and(
          eq(players.platform, history.platform),
          inArray(players.pubgAccountId, participantAccountIds),
        ),
      );

    const playerIdByAccountId = new Map(
      storedPlayers.map((player) => [player.pubgAccountId, player.id]),
    );

    const participantValues = rosterParticipants.flatMap((participant) => {
      const playerId = playerIdByAccountId.get(participant.stats.playerId);

      if (!playerId) {
        return [];
      }

      return [
        {
          matchId: savedMatch.id,
          playerId,
          pubgParticipantId: participant.id,
          pubgRosterId: participant.rosterId,
          teamId: participant.teamId,
          teamRank: participant.teamRank,
          kills: participant.stats.kills,
          assists: participant.stats.assists,
          dbnos: participant.stats.DBNOs,
          headshotKills: participant.stats.headshotKills,
          revives: participant.stats.revives,
          boosts: participant.stats.boosts,
          heals: participant.stats.heals,
          killPlace: participant.stats.killPlace,
          killStreaks: participant.stats.killStreaks,
          roadKills: participant.stats.roadKills,
          teamKills: participant.stats.teamKills,
          vehicleDestroys: participant.stats.vehicleDestroys,
          weaponsAcquired: participant.stats.weaponsAcquired,
          damageDealt: participant.stats.damageDealt,
          timeSurvived: participant.stats.timeSurvived,
          longestKill: participant.stats.longestKill,
          rideDistance: participant.stats.rideDistance,
          swimDistance: participant.stats.swimDistance,
          walkDistance: participant.stats.walkDistance,
          winPlace: participant.stats.winPlace,
          deathType: participant.stats.deathType,
        },
      ];
    });

    if (participantValues.length > 0) {
      await tx
        .insert(matchParticipants)
        .values(participantValues)
        .onConflictDoNothing();
    }

    return {
      match: savedMatch,
      participantCount: participantValues.length,
    };
  });
}
