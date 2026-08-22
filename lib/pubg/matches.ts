import { pubgFetch } from "@/lib/pubg/client";
import type {
  PubgAssetResource,
  PubgMatch,
  PubgMatchResponse,
  PubgParticipantResource,
  PubgRosterResource,
} from "@/lib/pubg/match-types";
import type { PubgPlatform } from "@/lib/pubg/types";

function isParticipant(
  resource: PubgMatchResponse["included"][number],
): resource is PubgParticipantResource {
  return resource.type === "participant";
}

function isRoster(
  resource: PubgMatchResponse["included"][number],
): resource is PubgRosterResource {
  return resource.type === "roster";
}

function isAsset(
  resource: PubgMatchResponse["included"][number],
): resource is PubgAssetResource {
  return resource.type === "asset";
}

export async function getMatchById(
  matchId: string,
  platform: PubgPlatform,
): Promise<PubgMatch> {
  const response = await pubgFetch<PubgMatchResponse>(
    `/shards/${platform}/matches/${encodeURIComponent(matchId)}`,
    {
      // 공식 명세상 Match API는 인증이 필요 없고 rate limit 대상도 아니다.
      authorization: false,
    },
  );

  const rawParticipants = response.included.filter(isParticipant);
  const rawRosters = response.included.filter(isRoster);
  const telemetryAsset = response.included
    .filter(isAsset)
    .find((asset) => asset.attributes.name === "telemetry");

  const rosters = rawRosters.map((roster) => ({
    id: roster.id,
    teamId: roster.attributes.stats.teamId,
    rank: roster.attributes.stats.rank,
    won: roster.attributes.won === "true",
    participantIds: roster.relationships.participants.data.map(
      (participant) => participant.id,
    ),
  }));

  // Participant에는 소속 팀이 없으므로 Roster 관계를 역으로 조회할 맵을 만든다.
  const rosterByParticipantId = new Map(
    rosters.flatMap((roster) =>
      roster.participantIds.map(
        (participantId) => [participantId, roster] as const,
      ),
    ),
  );

  const participants = rawParticipants.map((participant) => {
    const roster = rosterByParticipantId.get(participant.id);

    return {
      id: participant.id,
      rosterId: roster?.id ?? null,
      teamId: roster?.teamId ?? null,
      teamRank: roster?.rank ?? null,
      stats: participant.attributes.stats,
    };
  });

  return {
    id: response.data.id,
    platform,
    createdAt: response.data.attributes.createdAt,
    duration: response.data.attributes.duration,
    matchType: response.data.attributes.matchType,
    gameMode: response.data.attributes.gameMode,
    mapName: response.data.attributes.mapName,
    isCustomMatch: response.data.attributes.isCustomMatch,
    patchVersion: response.data.attributes.patchVersion ?? null,
    seasonState: response.data.attributes.seasonState,
    titleId: response.data.attributes.titleId,
    telemetryUrl: telemetryAsset?.attributes.URL ?? null,
    rosters,
    participants,
  };
}
