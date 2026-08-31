import type { Logger } from "pino";

import { sendMatchWinNotification } from "@/lib/discord/messages/send-match-win-notification";
import { getMatchById } from "@/lib/pubg/matches";
import type { PubgMatch } from "@/lib/pubg/match-types";
import { saveMatchHistory } from "@/lib/repositories/match-repository";
import { createRecentWonMatchesFromHistory } from "@/lib/services/match-service";
import {
  MATCH_FETCH_BATCH_SIZE,
  MATCH_SYNC_PLATFORM,
} from "@/lib/sync/match/match-sync-config";
import type {
  MatchSyncContext,
  NewMatchSyncResult,
} from "@/lib/sync/match/match-sync-types";
import { findClanRosterParticipants } from "@/lib/sync/match/match-sync-utils";

/**
 * 신규 매치만 제한된 크기로 병렬 조회하고 클랜원이 속한 로스터 전체를 저장한다.
 * 저장에 성공한 응답은 이후 후보 탐색 전략이 사용할 수 있도록 반환한다.
 */
export async function syncNewMatchesTask(
  newMatchIds: string[],
  context: MatchSyncContext,
  log: Logger,
): Promise<NewMatchSyncResult> {
  const syncedMatches: PubgMatch[] = [];
  let syncedMatchCount = 0;
  let failedMatchCount = 0;
  let winNotificationCount = 0;
  let failedWinNotificationCount = 0;

  for (
    let index = 0;
    index < newMatchIds.length;
    index += MATCH_FETCH_BATCH_SIZE
  ) {
    const matchIdBatch = newMatchIds.slice(
      index,
      index + MATCH_FETCH_BATCH_SIZE,
    );
    const matchResults = await Promise.allSettled(
      matchIdBatch.map((matchId) =>
        getMatchById(matchId, MATCH_SYNC_PLATFORM),
      ),
    );

    for (const [resultIndex, result] of matchResults.entries()) {
      if (result.status === "rejected") {
        failedMatchCount += 1;
        log.error(
          {
            err: result.reason,
            event: "match_sync.match_fetch_failed",
            pubgMatchId: matchIdBatch[resultIndex],
          },
          "Failed to fetch PUBG match",
        );
        continue;
      }

      const history = result.value;
      const clanRosterParticipants = findClanRosterParticipants(
        history,
        context.clanPubgAccountIds,
      );

      let storedMatchId: string;

      try {
        const saveResult = await saveMatchHistory({
          history,
          participantAccountIds: clanRosterParticipants.map(
            (participant) => participant.stats.playerId,
          ),
        });
        storedMatchId = saveResult.match.id;
        syncedMatchCount += 1;
        syncedMatches.push(history);
      } catch (error) {
        failedMatchCount += 1;
        log.error(
          {
            err: error,
            event: "match_sync.match_save_failed",
            pubgMatchId: history.id,
          },
          "Failed to save PUBG match",
        );
        continue;
      }

      const wonMatches = createRecentWonMatchesFromHistory({
        history,
        storedMatchId,
        clanAccountIds: context.clanPubgAccountIds,
      });

      for (const wonMatch of wonMatches) {
        try {
          const notificationResult =
            await sendMatchWinNotification(wonMatch);

          if (notificationResult.sent) {
            winNotificationCount += 1;
          } else {
            failedWinNotificationCount += 1;
          }
        } catch (error) {
          failedWinNotificationCount += 1;
          log.error(
            {
              err: error,
              event: "match_sync.win_notification_failed",
              matchId: wonMatch.matchId,
              rosterId: wonMatch.rosterId,
            },
            "Failed to send match win notification",
          );
        }
      }

    }
  }

  return {
    syncedMatchCount,
    failedMatchCount,
    syncedMatches,
    winNotificationCount,
    failedWinNotificationCount,
  };
}
