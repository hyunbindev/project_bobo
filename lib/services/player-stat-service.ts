import { cache } from "react";

import { BadRequestError } from "@/lib/api/errors";
import {
  countPlayerMatchRosterHistories,
  findMatchRosterHistories,
  type MatchRosterListItem,
} from "@/lib/repositories/match-repository";
import {
  findPlayerHighRecord,
  type HighRecord,
} from "@/lib/repositories/player-stat-repository";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// 같은 서버 렌더링 안에서 동일 플레이어 집계를 여러 번 요청해도 쿼리는 한 번만 실행한다.
export const getPlayerHighRecord = cache(
  async (playerId: string): Promise<HighRecord | null> => {
    if (!UUID_PATTERN.test(playerId)) {
      throw new BadRequestError("playerId must be a valid UUID.");
    }

    return findPlayerHighRecord(playerId);
  },
);

export type PlayerMatchHistoryPage = {
  items: MatchRosterListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export async function getPlayerMatchHistoryPage(
  playerId: string,
  clanId: string,
  requestedPage = 1,
  pageSize = 10,
): Promise<PlayerMatchHistoryPage> {
  if (!UUID_PATTERN.test(playerId)) {
    throw new BadRequestError("playerId must be a valid UUID.");
  }

  const normalizedPageSize = Math.min(Math.max(Math.trunc(pageSize), 1), 100);
  const totalCount = await countPlayerMatchRosterHistories(playerId, clanId);
  const totalPages = Math.max(Math.ceil(totalCount / normalizedPageSize), 1);
  const page = Math.min(
    Math.max(Math.trunc(requestedPage) || 1, 1),
    totalPages,
  );
  const items =
    totalCount === 0
      ? []
      : await findMatchRosterHistories({
          playerId,
          clanId,
          isWon: false,
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

export type { HighRecord } from "@/lib/repositories/player-stat-repository";
