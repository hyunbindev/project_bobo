import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { ApiError } from "@/lib/api/errors";
import { getDiscordRegistrationParams } from "@/lib/discord-accounts/registration-params";
import type { DiscordRegistrationIdentity, DiscordRegistrationParams } from "@/lib/discord-accounts/types";

const TOKEN_VERSION = "v1";
const TOKEN_PURPOSE = Buffer.from("bobo:discord-registration:v1");
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getEncryptionKey() {
  const value = process.env.DISCORD_REGISTRATION_ENCRYPTION_KEY?.trim();
  if (!value || !/^[A-Za-z0-9+/]{43}=$/.test(value)) {
    throw new ApiError(500, "DISCORD_REGISTRATION_CONFIGURATION_ERROR", "Discord registration is not configured.");
  }
  const key = Buffer.from(value, "base64");
  if (key.length !== 32 || key.toString("base64") !== value) {
    throw new ApiError(500, "DISCORD_REGISTRATION_CONFIGURATION_ERROR", "Discord registration is not configured.");
  }
  return key;
}

/** 봇이 확인한 계정을 담는다. 만료·일회용 제한이 없는 재사용 가능한 등록 링크다. */
export function createRegistrationToken(input: DiscordRegistrationParams): string {
  const params = getDiscordRegistrationParams(input);
  if (!params) throw new Error("Invalid Discord registration parameters.");
  const key = getEncryptionKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: TAG_BYTES });
  cipher.setAAD(TOKEN_PURPOSE);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(params), "utf8"), cipher.final()]);
  return [TOKEN_VERSION, iv.toString("base64url"), ciphertext.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
}

/** 복호화와 인증 태그 검증이 모두 성공한 경우에만 계정 정보를 반환한다. */
export function decryptRegistrationToken(value: unknown): DiscordRegistrationParams | null {
  if (typeof value !== "string" || value.length > 1024) return null;
  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== TOKEN_VERSION || !parts.slice(1).every((part) => /^[A-Za-z0-9_-]+$/.test(part))) return null;
  const [iv, ciphertext, tag] = parts.slice(1).map((part) => Buffer.from(part, "base64url"));
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES || ciphertext.length === 0 ||
      [iv, ciphertext, tag].some((part, index) => part.toString("base64url") !== parts[index + 1])) return null;

  // 서버 설정 오류는 잘못된 사용자 토큰과 구분해 500으로 처리한다.
  const key = getEncryptionKey();
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv, { authTagLength: TAG_BYTES });
    decipher.setAAD(TOKEN_PURPOSE);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    return getDiscordRegistrationParams(JSON.parse(plaintext));
  } catch {
    return null;
  }
}

/** 웹 요청에서는 평문 ID를 신뢰하지 않고 검증된 등록 토큰만 사용한다. */
export function requireDiscordRegistrationIdentity(input: unknown): DiscordRegistrationIdentity {
  const token = input && typeof input === "object" && !Array.isArray(input) && "token" in input ? input.token : null;
  const params = decryptRegistrationToken(token);
  if (!params) throw new ApiError(401, "DISCORD_LINK_REQUIRED", "Discord에서 받은 등록 링크로 다시 접속해 주세요.");
  return { ...params, discordDisplayName: "", discordUsername: "" };
}
