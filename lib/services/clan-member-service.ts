import { cache } from "react";

import { ApiError, BadRequestError, NotFoundError } from "@/lib/api/errors";
import type { PubgClan } from "@/lib/pubg/clan-types";
import { getClanById } from "@/lib/pubg/clans";
import { PubgApiError } from "@/lib/pubg/client";
import { getPlayerByName } from "@/lib/pubg/players";
import {
  PUBG_PLATFORMS,
  type PubgPlatform,
  type PubgPlayer,
} from "@/lib/pubg/types";
import {
  findActiveClanMembersByClanId,
  findClanMemberDetailByPlayerId,
  findStoredClanByPubgId,
  findStoredPlayerById,
  findStoredPlayerByName,
  saveClanMember,
} from "@/lib/repositories/clan-member-repository";
import { getMainClanSummary } from "@/lib/services/clan-service";

type RegisterClanMemberInput = {
  nickname: string;
  displayName: string;
  age: number;
  platform: PubgPlatform;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isPubgPlatform(value: string): value is PubgPlatform {
  return PUBG_PLATFORMS.some((platform) => platform === value);
}

function validateNickname(value: string) {
  const nickname = value.trim();

  if (!nickname || nickname.length > 64 || nickname.includes(",")) {
    throw new BadRequestError("Enter one valid PUBG nickname.");
  }

  return nickname;
}

function parseRegisterInput(value: unknown): RegisterClanMemberInput {
  if (!value || typeof value !== "object") {
    throw new BadRequestError("Registration input must be an object.");
  }

  const input = value as Record<string, unknown>;

  if (
    typeof input.nickname !== "string" ||
    typeof input.displayName !== "string" ||
    typeof input.age !== "number" ||
    typeof input.platform !== "string"
  ) {
    throw new BadRequestError(
      "nickname, displayName, age, and platform are required.",
    );
  }

  const nickname = validateNickname(input.nickname);
  const displayName = input.displayName.trim();

  if (!displayName || displayName.length > 30) {
    throw new BadRequestError("displayName must contain 1 to 30 characters.");
  }

  if (!Number.isInteger(input.age) || input.age < 1 || input.age > 120) {
    throw new BadRequestError("age must be an integer from 1 to 120.");
  }

  if (!isPubgPlatform(input.platform)) {
    throw new BadRequestError(
      `platform must be one of: ${PUBG_PLATFORMS.join(", ")}.`,
    );
  }

  return {
    nickname,
    displayName,
    age: input.age,
    platform: input.platform,
  };
}

function convertPubgApiError(error: PubgApiError): ApiError {
  if (error.status === 404) {
    return new NotFoundError("PUBG resource not found.");
  }

  if (error.status === 429) {
    return new ApiError(
      429,
      "PUBG_RATE_LIMITED",
      "PUBG API rate limit exceeded.",
      error.retryAfter ? { "Retry-After": error.retryAfter } : undefined,
    );
  }

  if (error.status === 500) {
    return new ApiError(500, "PUBG_API_CONFIGURATION_ERROR", error.message);
  }

  return new ApiError(502, "PUBG_API_ERROR", error.message);
}

async function resolvePlayer(
  nickname: string,
  platform: PubgPlatform,
): Promise<PubgPlayer> {
  const storedPlayer = await findStoredPlayerByName(nickname, platform);

  // DB에 클랜 정보까지 있는 플레이어면 PUBG 요청을 소비하지 않고 재사용한다.
  if (storedPlayer?.pubgClanId) {
    return {
      accountId: storedPlayer.pubgAccountId,
      name: storedPlayer.name,
      platform: storedPlayer.platform,
      clanId: storedPlayer.pubgClanId,
      matchIds: [],
    };
  }

  const player = await getPlayerByName(nickname, platform);

  if (!player) {
    throw new NotFoundError("PUBG player not found.");
  }

  return player;
}

async function resolveClan(
  pubgClanId: string,
  platform: PubgPlatform,
): Promise<PubgClan> {
  const storedClan = await findStoredClanByPubgId(pubgClanId, platform);

  if (storedClan) {
    return {
      id: storedClan.pubgClanId,
      platform: storedClan.platform,
      name: storedClan.name,
      tag: storedClan.tag,
      level: storedClan.level,
      memberCount: storedClan.memberCount,
    };
  }

  return getClanById(pubgClanId, platform);
}

async function resolvePlayerAndClan(nickname: string, platform: PubgPlatform) {
  const player = await resolvePlayer(nickname, platform);
  const clanId = player.clanId;

  if (!clanId) {
    throw new BadRequestError("The PUBG player does not belong to a clan.");
  }

  if (process.env.PUBG_CLAN_ID && clanId !== process.env.PUBG_CLAN_ID) {
    throw new BadRequestError("The PUBG player does not belong to this clan.");
  }

  const clan = await resolveClan(clanId, platform);
  return { player, clan };
}

export async function registerClanMember(input: unknown) {
  const data = parseRegisterInput(input);

  try {
    const { player, clan } = await resolvePlayerAndClan(
      data.nickname,
      data.platform,
    );

    return saveClanMember({
      clan,
      player,
      member: {
        displayName: data.displayName,
        age: data.age,
        profileRegistered: true,
      },
    });
  } catch (error) {
    if (error instanceof PubgApiError) {
      throw convertPubgApiError(error);
    }

    throw error;
  }
}

export async function getClanMemberList() {
  const clan = await getMainClanSummary();

  if (!clan) {
    return { clan: null, members: [] };
  }

  const members = await findActiveClanMembersByClanId(clan.pubgClanId);

  return { clan, members };
}

export const getClanMemberDetail = cache(async (playerId: string) => {
  if (!UUID_PATTERN.test(playerId)) {
    return null;
  }

  return findClanMemberDetailByPlayerId(playerId);
});

export const getStoredPlayerSummary = cache(async (playerId: string) => {
  if (!UUID_PATTERN.test(playerId)) {
    return null;
  }

  return findStoredPlayerById(playerId);
});

// 매치 동기화 Worker가 발견한 닉네임을 넘기면 미등록 프로필로 자동 추가한다.
export async function discoverClanMember(
  nickname: string,
  platform: PubgPlatform,
) {
  const validNickname = validateNickname(nickname);

  try {
    const { player, clan } = await resolvePlayerAndClan(
      validNickname,
      platform,
    );

    return saveClanMember({
      clan,
      player,
      member: {
        displayName: null,
        age: null,
        profileRegistered: false,
      },
    });
  } catch (error) {
    if (error instanceof PubgApiError) {
      throw convertPubgApiError(error);
    }

    throw error;
  }
}
