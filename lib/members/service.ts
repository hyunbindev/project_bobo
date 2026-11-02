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
} from "@/lib/members/repository";
import { getMainClanSummary } from "@/lib/clans/service";
import { registerDiscordAccount } from "@/lib/discord-accounts/service";
import type { DiscordRegistrationIdentity } from "@/lib/discord-accounts/types";
import { getDiscordRegistrationParams } from "@/lib/discord-accounts/registration-params";

type RegisterClanMemberInput = {
  nickname: string;
  name: string;
  birthYear: number;
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
    typeof input.name !== "string" ||
    typeof input.birthYear !== "number" ||
    typeof input.platform !== "string"
  ) {
    throw new BadRequestError(
      "nickname, name, birthYear, and platform are required.",
    );
  }

  if (!input.nickname.trim() || input.nickname.trim().length > 64 || input.nickname.includes(",")) {
    throw new ApiError(400, "INVALID_PUBG_NICKNAME", "올바른 PUBG 아이디를 입력해 주세요.");
  }
  const nickname = input.nickname.trim();
  const name = input.name.trim();

  if (!name || name.length > 30) {
    throw new BadRequestError("name must contain 1 to 30 characters.");
  }

  const currentYear = new Date().getFullYear();

  if (
    !Number.isInteger(input.birthYear) ||
    input.birthYear < 1900 ||
    input.birthYear > currentYear
  ) {
    throw new BadRequestError(
      `birthYear must be an integer from 1900 to ${currentYear}.`,
    );
  }

  if (!isPubgPlatform(input.platform)) {
    throw new BadRequestError(
      `platform must be one of: ${PUBG_PLATFORMS.join(", ")}.`,
    );
  }

  return {
    nickname,
    name,
    birthYear: input.birthYear,
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
  { refresh = false }: { refresh?: boolean } = {},
): Promise<PubgPlayer> {
  const storedPlayer = refresh
    ? null
    : await findStoredPlayerByName(nickname, platform);

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

async function resolvePlayerAndClan(
  nickname: string,
  platform: PubgPlatform,
) {
  const player = await resolvePlayer(nickname, platform);
  const clanId = player.clanId;

  if (!clanId) {
    throw new BadRequestError("The PUBG player does not belong to a clan.");
  }

  const configuredClanId = process.env.PUBG_CLAN_ID?.trim();
  if (configuredClanId && clanId !== configuredClanId) {
    throw new BadRequestError("The PUBG player does not belong to this clan.");
  }

  const clan = await resolveClan(clanId, platform);
  return { player, clan };
}

export async function registerClanMember(input: unknown, discordIdentity?: DiscordRegistrationIdentity) {
  const data = parseRegisterInput(input);
  // TODO: 서명된 링크/세션 연결 후 본인 확인 조건을 다시 활성화한다.
  // if (!discordIdentity) {
  //   throw new ApiError(401, "DISCORD_LINK_REQUIRED", "Discord 등록 링크를 통해 접속해 주세요.");
  // }
  if (!discordIdentity) {
    const params = getDiscordRegistrationParams(input);
    if (!params) {
      throw new BadRequestError("Discord 사용자 ID와 서버 ID를 확인해 주세요.");
    }
    // 임시로 URL에서 받은 ID를 사용한다. Discord 이름은 아직 조회하지 않는다.
    discordIdentity = { ...params, discordDisplayName: "", discordUsername: "" };
  }
  return registerDiscordAccount({ ...data, ...discordIdentity });
}

export async function getClanMemberList() {
  const clan = await getMainClanSummary();

  if (!clan) { return { clan: null, members: [], clanMaster: null }; }

  const members = await findActiveClanMembersByClanId(clan.pubgClanId);
  const clanMasterAccountId = process.env.PUBG_CLAN_MASTER_ID?.trim();
  const clanMaster = clanMasterAccountId
    ? (members.find((member) => member.pubgAccountId === clanMasterAccountId,) ?? null): null;

  return { clan, members, clanMaster };
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
    });
  } catch (error) {
    if (error instanceof PubgApiError) {
      throw convertPubgApiError(error);
    }

    throw error;
  }
}
