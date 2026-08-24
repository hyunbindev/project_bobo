import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { matchParticipants, matches, players } from "@/lib/db/schema";
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
          damageDealt: participant.stats.damageDealt,
          timeSurvived: participant.stats.timeSurvived,
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
