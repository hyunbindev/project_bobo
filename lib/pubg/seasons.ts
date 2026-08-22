import { pubgFetch } from "@/lib/pubg/client";
import type {
  PubgPlayerSeasonResponse,
  PubgPlayerSeasonStats,
  PubgSeasonsResponse,
} from "@/lib/pubg/season-types";
import type { PubgPlatform } from "@/lib/pubg/types";

const CURRENT_SEASON_CACHE_TTL = 24 * 60 * 60 * 1_000;
const currentSeasonCache = new Map<
  PubgPlatform,
  { seasonId: string; expiresAt: number }
>();

export async function getCurrentSeasonId(
  platform: PubgPlatform,
): Promise<string> {
  const cached = currentSeasonCache.get(platform);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.seasonId;
  }

  const response = await pubgFetch<PubgSeasonsResponse>(
    `/shards/${platform}/seasons`,
  );
  const currentSeason = response.data.find(
    (season) => season.attributes.isCurrentSeason,
  );

  if (!currentSeason) {
    throw new Error(`Current PUBG season was not found for ${platform}.`);
  }

  // 시즌 목록은 자주 바뀌지 않으므로 프로세스 안에서 하루 동안 재사용한다.
  currentSeasonCache.set(platform, {
    seasonId: currentSeason.id,
    expiresAt: Date.now() + CURRENT_SEASON_CACHE_TTL,
  });

  return currentSeason.id;
}

export async function getPlayerSeasonStats(
  accountId: string,
  seasonId: string,
  platform: PubgPlatform,
): Promise<PubgPlayerSeasonStats> {
  const response = await pubgFetch<PubgPlayerSeasonResponse>(
    `/shards/${platform}/players/${encodeURIComponent(accountId)}/seasons/${encodeURIComponent(seasonId)}`,
  );
  const relationships = response.data.relationships;
  const matchIds = relationships
    ? Object.entries(relationships)
        .filter(([name]) => name.startsWith("matches"))
        .flatMap(([, relationship]) =>
          "data" in relationship && Array.isArray(relationship.data)
            ? relationship.data.map((match) => match.id)
            : [],
        )
    : [];

  return {
    accountId,
    platform,
    seasonId,
    bestRankPoint: response.data.attributes.bestRankPoint ?? null,
    gameModeStats: response.data.attributes.gameModeStats,
    // PUBG는 모드마다 matchesSolo, matchesSquadFPP처럼 관계를 나눠서 내려준다.
    matchIds: [...new Set(matchIds)],
  };
}
