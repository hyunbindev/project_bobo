import { findStoredMatchResponses } from "@/lib/repositories/match-repository";
import type { CandidateDiscoveryStrategy } from "@/lib/sync/match/strategies/candidate-discovery-strategy";
import { collectClanMemberCandidateIds } from "@/lib/sync/match/match-sync-utils";

/**
 * 초기 수집 전략:
 * 이번에 발견한 신규·기존 매치를 모두 DB에서 읽어 후보를 넓게 다시 찾는다.
 * 초기 클랜원 확보에는 유리하지만 같은 외부 후보를 반복 검증하므로 상시 운영에는 사용하지 않는다.
 */
export const bootstrapCandidateDiscoveryStrategy: CandidateDiscoveryStrategy = {
  mode: "bootstrap",
  async discoverCandidates({ context, discoveredMatchIds }) {
    const histories = await findStoredMatchResponses(discoveredMatchIds);

    return collectClanMemberCandidateIds(
      histories,
      context.clanPubgAccountIds,
    );
  },
};
