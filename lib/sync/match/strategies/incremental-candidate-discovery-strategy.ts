import type { CandidateDiscoveryStrategy } from "@/lib/sync/match/strategies/candidate-discovery-strategy";
import { collectClanMemberCandidateIds } from "@/lib/sync/match/match-sync-utils";

/**
 * 운영 전략:
 * 이번 실행에서 저장에 성공한 신규 매치만 검사해 외부 API 호출량을 최소화한다.
 */
export const incrementalCandidateDiscoveryStrategy: CandidateDiscoveryStrategy = {
  mode: "incremental",
  async discoverCandidates({ context, syncedMatches }) {
    return collectClanMemberCandidateIds(
      syncedMatches,
      context.clanPubgAccountIds,
    );
  },
};
