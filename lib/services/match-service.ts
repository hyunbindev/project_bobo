import { cache } from "react";

import {
  countMatchRosterHistories,
  findMatchRosterDetail,
  findMatchRosterHistories,
  type MatchRosterListItem,
} from "@/lib/repositories/match-repository";
import { getMainClanSummary } from "@/lib/services/clan-service";



const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type MatchRosterHistoryPage = {
  items: MatchRosterListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type RecentWonMatch = {
  id: string;
  matchId: string;
  rosterId: string;
  mapName: string;
  gameMode: string;
  matchType: string;
  playedAt: Date;
  rank: number;
  kills: number;
  damage: number;
  members: Array<{
    id: string;
    name: string;
    kills: number;
    damage: number;
  }>;
};

export async function getMatchRosterHistoryPage(
  requestedPage = 1,
  pageSize = 20,
  isWon = false,
): Promise<MatchRosterHistoryPage> {
  const normalizedPageSize = Math.min(Math.max(Math.trunc(pageSize), 1), 100);
  const totalCount = await countMatchRosterHistories();
  const totalPages = Math.max(Math.ceil(totalCount / normalizedPageSize), 1);
  const page = Math.min(
    Math.max(Math.trunc(requestedPage) || 1, 1),
    totalPages,
  );

  const items =
    totalCount === 0
      ? []
      : await findMatchRosterHistories({
          isWon: isWon,
          limit: normalizedPageSize,
          offset: (page - 1) * normalizedPageSize,
        });

  return {
    items,
    page,
    pageSize: normalizedPageSize,
    totalCount,
    totalPages,
  };
}



export const getMatchRosterDetail = cache(
  async (matchId: string, rosterId: string) => {
    if (!UUID_PATTERN.test(matchId) || !rosterId.trim()) {
      return null;
    }

    const [detail, mainClan] = await Promise.all([
      findMatchRosterDetail(matchId, rosterId),
      getMainClanSummary(),
    ]);

    if (!detail) {
      return null;
    }

    const targetClanId = process.env.PUBG_CLAN_ID ?? mainClan?.pubgClanId ?? null;
    const participants = detail.participants.map((participant) => ({
      ...participant,
      clanMember:
        targetClanId !== null && participant.pubgClanId === targetClanId,
    }));
    const totals = participants.reduce(
      (result, participant) => ({
        kills: result.kills + participant.kills,
        damage: result.damage + participant.damageDealt,
        dbnos: result.dbnos + participant.dbnos,
        revives: result.revives + participant.revives,
      }),
      { kills: 0, damage: 0, dbnos: 0, revives: 0 },
    );

    return {
      ...detail,
      participants,
      clanMemberCount: participants.filter((participant) => participant.clanMember)
        .length,
      totals,
    };
  },
);

export async function getRecentWonMatches(
  limit = 3,
): Promise<RecentWonMatch[]> {
  const normalizedLimit = Math.min(Math.max(Math.trunc(limit), 1), 10);
  const matches = await findMatchRosterHistories({
    isWon: true,
    limit: normalizedLimit,
    offset: 0,
  });

  const results = await Promise.all(
    matches.map(async (match): Promise<RecentWonMatch | null> => {
      const detail = await getMatchRosterDetail(
        match.matchId,
        match.rosterId,
      );

      if (!detail) {
        return null;
      }

      return {
        id: `${match.matchId}:${match.rosterId}`,
        matchId: match.matchId,
        rosterId: match.rosterId,
        mapName: match.mapName,
        gameMode: match.gameMode,
        matchType: match.matchType,
        playedAt: match.playedAt,
        rank: match.rank,
        kills: match.kills,
        damage: match.damage,
        members: detail.participants
          .filter((participant) => participant.clanMember)
          .map((participant) => ({
            id: participant.id,
            name: participant.name,
            kills: participant.kills,
            damage: participant.damageDealt,
          })),
      };
    }),
  );

  return results.filter((match): match is RecentWonMatch => match !== null);
}
