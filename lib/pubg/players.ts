import { pubgFetch } from "@/lib/pubg/client";
import type {
  PubgPlatform,
  PubgPlayer,
  PubgPlayersResponse,
} from "@/lib/pubg/types";

const MAX_PLAYERS_PER_REQUEST = 10;

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

export async function getPlayersByAccountIds(
  accountIds: string[],
  platform: PubgPlatform,
): Promise<PubgPlayer[]> {
  // 중복 ID가 API의 한 요청당 10명 제한을 불필요하게 차지하지 않게 정리한다.
  const uniqueAccountIds = [...new Set(accountIds)];

  if (uniqueAccountIds.length === 0) {
    return [];
  }

  if (uniqueAccountIds.length > MAX_PLAYERS_PER_REQUEST) {
    throw new RangeError(
      `PUBG Players API accepts at most ${MAX_PLAYERS_PER_REQUEST} account IDs per request.`,
    );
  }

  const response = await pubgFetch<PubgPlayersResponse>(
    `/shards/${platform}/players`,
    {
      searchParams: {
        "filter[playerIds]": uniqueAccountIds.join(","),
      },
    },
  );

  return response.data.map((player) => ({
    accountId: player.id,
    name: player.attributes.name,
    platform,
    clanId: player.attributes.clanId ?? null,
    matchIds: player.relationships.matches.data.map((match) => match.id),
  }));
}
