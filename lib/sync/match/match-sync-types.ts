import type { PubgClan } from "@/lib/pubg/clan-types";
import type { PubgMatch } from "@/lib/pubg/match-types";

export type PlayerApiMetrics = {
  requestCount: number;
  rateLimitCount: number;
};

export type MatchSyncContext = {
  targetClanId: string;
  targetClan: PubgClan;
  clanPubgAccountIds: Set<string>;
  memberAccountIds: string[];
};

export type MatchIdPartition = {
  storedMatchCount: number;
  newMatchIds: string[];
};

export type NewMatchSyncResult = {
  syncedMatchCount: number;
  failedMatchCount: number;
  syncedMatches: PubgMatch[];
};

export type CandidateVerificationResult = {
  candidateBatchCount: number;
  verifiedClanMemberCount: number;
  failedCandidateBatchCount: number;
  failedClanMemberSaveCount: number;
};
