import { pubgFetch } from "@/lib/pubg/client";
import type {
  PubgPlatform,
  PubgPlayer,
  PubgPlayersResponse,
} from "@/lib/pubg/types";

export async function getPlayerByName(
  name: string,
  platform: PubgPlatform,
): Promise<PubgPlayer | null> {
  const response = await pubgFetch<PubgPlayersResponse>(
    `/shards/${platform}/players`,
    {
      searchParams: {
        "filter[playerNames]": name,
      },
    },
  );

  const player = response.data[0];

  if (!player) {
    return null;
  }

  // JSON:API 응답을 나머지 애플리케이션에서 쓰기 쉬운 형태로 정규화한다.
  return {
    accountId: player.id,
    name: player.attributes.name,
    platform,
    clanId: player.attributes.clanId ?? null,
    matchIds: player.relationships.matches.data.map((match) => match.id),
  };
}
