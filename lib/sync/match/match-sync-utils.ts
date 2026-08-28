import type { Logger } from "pino";

import { PubgApiError } from "@/lib/pubg/client";
import type { PubgMatch } from "@/lib/pubg/match-types";
import { getPlayersByAccountIds } from "@/lib/pubg/players";
import type { PubgPlatform } from "@/lib/pubg/types";
import {
  MAX_RATE_LIMIT_RETRIES,
  PLAYER_REQUEST_INTERVAL_MS,
} from "@/lib/sync/match/match-sync-config";
import type { PlayerApiMetrics } from "@/lib/sync/match/match-sync-types";

export function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Players API는 호출 제한 대상이므로 429 응답의 Retry-After를 우선 적용한다.
 * 재시도 횟수를 넘기거나 다른 오류가 발생하면 task가 개별 실패로 기록하게 넘긴다.
 */
export async function getPlayersWithRateLimitRetry(
  accountIds: string[],
  platform: PubgPlatform,
  log: Logger,
  metrics: PlayerApiMetrics,
) {
  if (accountIds.length === 0) {
    return [];
  }

  let rateLimitRetryCount = 0;

  while (true) {
    metrics.requestCount += 1;

    try {
      return await getPlayersByAccountIds(accountIds, platform);
    } catch (error) {
      if (
        !(error instanceof PubgApiError) ||
        error.status !== 429 ||
        rateLimitRetryCount >= MAX_RATE_LIMIT_RETRIES
      ) {
        throw error;
      }

      rateLimitRetryCount += 1;
      metrics.rateLimitCount += 1;
      const retryDelay = getRetryDelay(error.retryAfter);

      log.warn(
        {
          event: "match_sync.player_api_rate_limited",
          retryCount: rateLimitRetryCount,
          retryDelayMs: retryDelay,
          batchSize: accountIds.length,
        },
        "PUBG player API rate limited",
      );
      await delay(retryDelay);
    }
  }
}

/** 클랜원이 포함된 로스터를 찾고 해당 로스터의 모든 참가자를 반환한다. */
export function findClanRosterParticipants(
  history: PubgMatch,
  clanPubgAccountIds: Set<string>,
) {
  const clanRosterIds = new Set(
    history.participants
      .filter((participant) =>
        clanPubgAccountIds.has(participant.stats.playerId),
      )
      .flatMap((participant) =>
        participant.rosterId ? [participant.rosterId] : [],
      ),
  );

  return history.participants.filter(
    (participant) =>
      participant.rosterId !== null &&
      clanRosterIds.has(participant.rosterId),
  );
}

/** 여러 매치에서 클랜원과 같은 로스터였던 미확인 플레이어를 중복 없이 모은다. */
export function collectClanMemberCandidateIds(
  histories: PubgMatch[],
  clanPubgAccountIds: Set<string>,
) {
  const candidatePlayerIds = new Set<string>();

  for (const history of histories) {
    const rosterParticipants = findClanRosterParticipants(
      history,
      clanPubgAccountIds,
    );

    for (const participant of rosterParticipants) {
      if (!clanPubgAccountIds.has(participant.stats.playerId)) {
        candidatePlayerIds.add(participant.stats.playerId);
      }
    }
  }

  return [...candidatePlayerIds];
}

function getRetryDelay(retryAfter: string | null) {
  if (!retryAfter) {
    return 60_000;
  }

  const retryAfterSeconds = Number(retryAfter);

  if (Number.isFinite(retryAfterSeconds)) {
    return Math.max(retryAfterSeconds * 1_000, PLAYER_REQUEST_INTERVAL_MS);
  }

  const retryAt = Date.parse(retryAfter);

  if (Number.isNaN(retryAt)) {
    return 60_000;
  }

  return Math.max(retryAt - Date.now(), PLAYER_REQUEST_INTERVAL_MS);
}
