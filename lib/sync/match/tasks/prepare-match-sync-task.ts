import type { PubgClan } from "@/lib/pubg/clan-types";
import { findStoredClanMember } from "@/lib/repositories/clan-member-repository";
import { getMainClanSummary } from "@/lib/services/clan-service";
import {
  MATCH_SYNC_PLATFORM,
  PLAYER_BATCH_SIZE,
} from "@/lib/sync/match/match-sync-config";
import type { MatchSyncContext } from "@/lib/sync/match/match-sync-types";

/**
 * 한 번의 동기화 실행에서 공유할 클랜 정보와 조회 대상 멤버를 준비한다.
 * repository가 오래 동기화되지 않은 멤버부터 정렬하므로 매 실행마다 다음 멤버로 순환한다.
 */
export async function prepareMatchSyncTask(): Promise<MatchSyncContext> {
  const clanSummary = await getMainClanSummary();

  if (!clanSummary) {
    throw new Error("Main clan is not configured.");
  }

  const targetClanId = process.env.PUBG_CLAN_ID || clanSummary.pubgClanId;
  const targetClan: PubgClan = {
    id: clanSummary.pubgClanId,
    platform: clanSummary.platform,
    name: clanSummary.name,
    tag: clanSummary.tag,
    level: clanSummary.level,
    memberCount: clanSummary.memberCount,
  };
  const storedMembers = await findStoredClanMember();
  const clanMembers = storedMembers.filter(
    ({ players }) =>
      players.pubgClanId === targetClanId &&
      players.platform === MATCH_SYNC_PLATFORM,
  );

  return {
    targetClanId,
    targetClan,
    clanPubgAccountIds: new Set(
      clanMembers.map(({ players }) => players.pubgAccountId),
    ),
    memberAccountIds: clanMembers
      .slice(0, PLAYER_BATCH_SIZE)
      .map(({ players }) => players.pubgAccountId),
  };
}
