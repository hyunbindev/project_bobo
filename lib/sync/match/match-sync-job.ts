import { schedulerLogger } from "@/lib/logger";
import type { PlayerApiMetrics } from "@/lib/sync/match/match-sync-types";
import { CANDIDATE_DISCOVERY_MODE } from "@/lib/sync/match/strategies/candidate-discovery-strategy";
import { resolveCandidateDiscoveryStrategy } from "@/lib/sync/match/strategies/resolve-candidate-discovery-strategy";
import { discoverMemberMatchIdsTask } from "@/lib/sync/match/tasks/discover-member-match-ids-task";
import { partitionMatchIdsTask } from "@/lib/sync/match/tasks/partition-match-ids-task";
import { prepareMatchSyncTask } from "@/lib/sync/match/tasks/prepare-match-sync-task";
import { syncNewMatchesTask } from "@/lib/sync/match/tasks/sync-new-matches-task";
import { verifyClanMemberCandidatesTask } from "@/lib/sync/match/tasks/verify-clan-member-candidates-task";

// 단일 프로세스에서 이전 실행이 끝나기 전에 같은 스케줄이 중복 실행되는 것을 막는다.
let isRunning = false;

/**
 * 매치 동기화 task를 순서대로 조율한다.
 * 각 task가 구체적인 작업과 부분 실패를 처리하고 job은 실행 잠금과 최종 로그만 담당한다.
 */
export default async function clanMatchSyncJob() {
  if (isRunning) {
    schedulerLogger.debug(
      {
        event: "match_sync.skipped",
        reason: "already_running",
      },
      "Match sync skipped",
    );
    return;
  }

  isRunning = true;
  const runId = crypto.randomUUID();
  const startedAt = Date.now();
  const log = schedulerLogger.child({ component: "match-sync", runId });
  const playerApiMetrics: PlayerApiMetrics = {
    requestCount: 0,
    rateLimitCount: 0,
  };

  log.info({ event: "match_sync.started" }, "Match sync started");

  try {
    // bootstrap 또는 incremental 후보 탐색 정책을 실행 시작 시 한 번 결정한다.
    const candidateDiscoveryStrategy = resolveCandidateDiscoveryStrategy(
      CANDIDATE_DISCOVERY_MODE,
    );
    const context = await prepareMatchSyncTask();
    const discoveredMatchIds = await discoverMemberMatchIdsTask(
      context,
      log,
      playerApiMetrics,
    );
    
    const matchPartition = await partitionMatchIdsTask(discoveredMatchIds);
    const matchSyncResult = await syncNewMatchesTask(
      matchPartition.newMatchIds,
      context,
      log,
    );

    // 전략은 후보 ID 생성까지만 담당하고 검증과 저장은 공통 task가 처리한다.
    const candidatePlayerIds =
      await candidateDiscoveryStrategy.discoverCandidates({
        context,
        discoveredMatchIds,
        syncedMatches: matchSyncResult.syncedMatches,
      });

    const candidateResult = await verifyClanMemberCandidatesTask(
      candidatePlayerIds,
      context,
      log,
      playerApiMetrics,
    );

    log.info(
      {
        event: "match_sync.completed",
        candidateDiscoveryMode:
          candidateDiscoveryStrategy.mode,

        durationMs:
          Date.now() - startedAt,

        memberCount:
          context.memberAccountIds.length,

        discoveredMatchCount:
          discoveredMatchIds.length,

        storedMatchCount:
          matchPartition.storedMatchCount,

        newMatchCount:
          matchPartition.newMatchIds.length,

        syncedMatchCount:
          matchSyncResult.syncedMatchCount,

        failedMatchCount:
          matchSyncResult.failedMatchCount,

        winNotificationCount:
          matchSyncResult.winNotificationCount,

        failedWinNotificationCount:
          matchSyncResult.failedWinNotificationCount,

        candidatePlayerCount:
          candidatePlayerIds.length,

        candidateBatchCount:
          candidateResult.candidateBatchCount,

        playerApiRequestCount: 
          playerApiMetrics.requestCount,

        rateLimitCount: 
          playerApiMetrics.rateLimitCount,

        verifiedClanMemberCount: 
          candidateResult.verifiedClanMemberCount,

        failedCandidateBatchCount:
          candidateResult.failedCandidateBatchCount,
          
        failedClanMemberSaveCount:
          candidateResult.failedClanMemberSaveCount,
      },
      "Match sync completed",
    );
  } catch (error) {
    log.error(
      {
        err: error,
        event: "match_sync.failed",
        durationMs: Date.now() - startedAt,
        playerApiRequestCount: playerApiMetrics.requestCount,
        rateLimitCount: playerApiMetrics.rateLimitCount,
      },
      "Match sync failed",
    );
  } finally {
    isRunning = false;
  }
}
