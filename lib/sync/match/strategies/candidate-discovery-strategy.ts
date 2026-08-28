import type { PubgMatch } from "@/lib/pubg/match-types";
import type { MatchSyncContext } from "@/lib/sync/match/match-sync-types";

export const CANDIDATE_DISCOVERY_MODES = [
  "bootstrap",
  "incremental",
] as const;

export type CandidateDiscoveryMode =
  (typeof CANDIDATE_DISCOVERY_MODES)[number];

// 초기 수집 시 bootstrap, 일반 운영 시 incremental로 변경한다.
export const CANDIDATE_DISCOVERY_MODE: CandidateDiscoveryMode =
  "incremental";

export type CandidateDiscoveryInput = {
  context: MatchSyncContext;
  discoveredMatchIds: string[];
  syncedMatches: PubgMatch[];
};

/** 후보의 출처만 교체하고 이후 PUBG 검증·저장 과정은 공통 task에 맡긴다. */
export type CandidateDiscoveryStrategy = {
  mode: CandidateDiscoveryMode;
  discoverCandidates: (
    input: CandidateDiscoveryInput,
  ) => Promise<string[]>;
};
