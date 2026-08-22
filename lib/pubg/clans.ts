import type { PubgClan, PubgClanResponse } from "@/lib/pubg/clan-types";
import { pubgFetch } from "@/lib/pubg/client";
import type { PubgPlatform } from "@/lib/pubg/types";

export async function getClanById(
  clanId: string,
  platform: PubgPlatform,
): Promise<PubgClan> {
  const response = await pubgFetch<PubgClanResponse>(
    `/shards/${platform}/clans/${encodeURIComponent(clanId)}`,
  );

  const clan = response.data;

  // PUBG의 JSON:API 응답을 프로젝트에서 사용하기 쉬운 평평한 객체로 바꾼다.
  return {
    id: clan.id,
    platform,
    name: clan.attributes.clanName,
    tag: clan.attributes.clanTag,
    level: clan.attributes.clanLevel,
    memberCount: clan.attributes.clanMemberCount,
  };
}
