import {
  ApiError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/lib/api/errors";
import { getClanById } from "@/lib/pubg/clans";
import { PubgApiError } from "@/lib/pubg/client";
import { getPlayerByName } from "@/lib/pubg/players";
import { PUBG_PLATFORMS, type PubgPlatform } from "@/lib/pubg/types";
import { saveClanMemberRegistration } from "@/lib/repositories/clan-member-repository";

type RegisterClanMemberInput = {
  nickname: string;
  displayName: string;
  age: number;
  platform: PubgPlatform;
};

function isPubgPlatform(value: string): value is PubgPlatform {
  return PUBG_PLATFORMS.some((platform) => platform === value);
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

  const nickname = input.nickname.trim();
  const displayName = input.displayName.trim();

  if (!nickname || nickname.length > 64 || nickname.includes(",")) {
    throw new BadRequestError("Enter one valid PUBG nickname.");
  }

  if (!displayName || displayName.length > 30) {
    throw new BadRequestError(
      "displayName must contain 1 to 30 characters.",
    );
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

export async function registerClanMember(input: unknown) {
  const data = parseRegisterInput(input);

  try {
    const player = await getPlayerByName(data.nickname, data.platform);

    if (!player) {
      throw new NotFoundError("PUBG player not found.");
    }

    const clanId = player.clanId;

    if (!clanId) {
      throw new BadRequestError("The PUBG player does not belong to a clan.");
    }

    const clan = await getClanById(clanId, data.platform);
    const registration = await saveClanMemberRegistration({
      clan,
      player,
      member: {
        displayName: data.displayName,
        age: data.age,
      },
    });

    if (!registration) {
      throw new ConflictError("The clan member is already registered.");
    }

    return registration;
  } catch (error) {
    if (error instanceof PubgApiError) {
      throw convertPubgApiError(error);
    }

    throw error;
  }
}
