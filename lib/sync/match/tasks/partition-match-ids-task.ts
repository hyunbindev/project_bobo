import { findStoredMatchIds } from "@/lib/repositories/match-repository";
import type { MatchIdPartition } from "@/lib/sync/match/match-sync-types";

/**
 * 발견한 ID만 DB에 질의해 신규 매치를 구분한다.
 * 저장된 매치의 원본 JSON은 다시 읽지 않으므로 후보 재탐색과 불필요한 메모리 사용을 막는다.
 */
export async function partitionMatchIdsTask(
  discoveredMatchIds: string[],
): Promise<MatchIdPartition> {
  const storedMatchIds = new Set(
    await findStoredMatchIds(discoveredMatchIds),
  );

  return {
    storedMatchCount: storedMatchIds.size,
    newMatchIds: discoveredMatchIds.filter(
      (matchId) => !storedMatchIds.has(matchId),
    ),
  };
}
