import { bootstrapCandidateDiscoveryStrategy } from "@/lib/sync/match/strategies/bootstrap-candidate-discovery-strategy";
import {
  type CandidateDiscoveryMode,
  type CandidateDiscoveryStrategy,
} from "@/lib/sync/match/strategies/candidate-discovery-strategy";
import { incrementalCandidateDiscoveryStrategy } from "@/lib/sync/match/strategies/incremental-candidate-discovery-strategy";

const strategies: Record<
  CandidateDiscoveryMode,
  CandidateDiscoveryStrategy
> = {
  bootstrap: bootstrapCandidateDiscoveryStrategy,
  incremental: incrementalCandidateDiscoveryStrategy,
};

/**
 * 타입이 확정된 모드에 해당하는 전략을 반환한다.
 * 환경변수처럼 신뢰할 수 없는 문자열을 해석하는 책임은 갖지 않는다.
 */
export function resolveCandidateDiscoveryStrategy(
  mode: CandidateDiscoveryMode,
): CandidateDiscoveryStrategy {
  return strategies[mode];
}
