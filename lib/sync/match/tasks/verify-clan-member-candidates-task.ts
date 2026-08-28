import type { Logger } from "pino";

import { saveClanMember } from "@/lib/repositories/clan-member-repository";
import {
  MATCH_SYNC_PLATFORM,
  PLAYER_BATCH_SIZE,
  PLAYER_REQUEST_INTERVAL_MS,
} from "@/lib/sync/match/match-sync-config";
import type {
  CandidateVerificationResult,
  MatchSyncContext,
  PlayerApiMetrics,
} from "@/lib/sync/match/match-sync-types";
import {
  delay,
  getPlayersWithRateLimitRetry,
} from "@/lib/sync/match/match-sync-utils";

/**
 * 신규 매치에서 발견한 팀원 후보를 Players API로 검증하고 실제 클랜원만 저장한다.
 * API 제한을 피하기 위해 후보 배치를 순차 처리하며 각 요청 사이에 간격을 둔다.
 */
export async function verifyClanMemberCandidatesTask(
  candidatePlayerIds: string[],
  context: MatchSyncContext,
  log: Logger,
  metrics: PlayerApiMetrics,
): Promise<CandidateVerificationResult> {
  let candidateBatchCount = 0;
  let verifiedClanMemberCount = 0;
  let failedCandidateBatchCount = 0;
  let failedClanMemberSaveCount = 0;

  for (
    let index = 0;
    index < candidatePlayerIds.length;
    index += PLAYER_BATCH_SIZE
  ) {
    const candidateBatch = candidatePlayerIds.slice(
      index,
      index + PLAYER_BATCH_SIZE,
    );

    await delay(PLAYER_REQUEST_INTERVAL_MS);
    candidateBatchCount += 1;

    let players;

    try {
      players = await getPlayersWithRateLimitRetry(
        candidateBatch,
        MATCH_SYNC_PLATFORM,
        log,
        metrics,
      );
    } catch (error) {
      failedCandidateBatchCount += 1;
      log.error(
        {
          err: error,
          event: "match_sync.candidate_batch_failed",
          batchSize: candidateBatch.length,
        },
        "Failed to verify clan member candidates",
      );
      continue;
    }

    for (const player of players) {
      if (player.clanId !== context.targetClanId) continue;

      try {
        await saveClanMember({
          clan: context.targetClan,
          player,
          member: {
            displayName: null,
            age: null,
            profileRegistered: false,
          },
        });
      } catch (error) {
        failedClanMemberSaveCount += 1;
        log.error(
          {
            err: error,
            event: "match_sync.clan_member_save_failed",
            pubgAccountId: player.accountId,
          },
          "Failed to save discovered clan member",
        );
        continue;
      }

      // 같은 실행의 이후 처리에서 이미 검증한 계정을 다시 후보로 취급하지 않는다.
      context.clanPubgAccountIds.add(player.accountId);
      verifiedClanMemberCount += 1;
    }
  }

  return {
    candidateBatchCount,
    verifiedClanMemberCount,
    failedCandidateBatchCount,
    failedClanMemberSaveCount,
  };
}
