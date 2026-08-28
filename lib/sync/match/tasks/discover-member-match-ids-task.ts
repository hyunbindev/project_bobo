import type { Logger } from "pino";

import { markPlayersSynced } from "@/lib/repositories/clan-member-repository";
import { MATCH_SYNC_PLATFORM } from "@/lib/sync/match/match-sync-config";
import type {
  MatchSyncContext,
  PlayerApiMetrics,
} from "@/lib/sync/match/match-sync-types";
import { getPlayersWithRateLimitRetry } from "@/lib/sync/match/match-sync-utils";

/**
 * 이번 순번의 클랜원들을 Players API로 조회해 최근 매치 ID를 수집한다.
 * 조회 완료 시각을 갱신해야 다음 실행에서 다른 멤버가 선택된다.
 */
export async function discoverMemberMatchIdsTask(
  context: MatchSyncContext,
  log: Logger,
  metrics: PlayerApiMetrics,
) {
  const players = await getPlayersWithRateLimitRetry(
    context.memberAccountIds,
    MATCH_SYNC_PLATFORM,
    log,
    metrics,
  );

  await markPlayersSynced(
    players.map((player) => player.accountId),
    MATCH_SYNC_PLATFORM,
  );

  const matchIds = new Set<string>();

  for (const player of players) {
    // 탈퇴한 플레이어의 과거 매치가 새 탐색 범위로 들어오는 것을 막는다.
    if (player.clanId !== context.targetClanId) continue;

    for (const matchId of player.matchIds) {
      matchIds.add(matchId);
    }
  }

  return [...matchIds];
}
