import { ApiError } from "@/lib/api/errors";
import { findStoredPlayerByName } from "@/lib/members/repository";
import { PubgApiError } from "@/lib/pubg/client";
import { getPlayerByName } from "@/lib/pubg/players";
import type { PubgPlatform, PubgPlayer } from "@/lib/pubg/types";

/** 계정 조회·검증만 수행한다. DB 저장·클랜 가입 검사·Discord 수정은 호출한 쪽에서 처리한다. */
export async function resolvePubgPlayer(nickname: string, platform: PubgPlatform): Promise<PubgPlayer> {
  const name = nickname.trim();
  if (!name || name.length > 64 || name.includes(",")) {
    throw new ApiError(400, "INVALID_PUBG_NICKNAME", "올바른 PUBG 아이디를 입력해 주세요.");
  }

  try {
    const storedPlayer = await findStoredPlayerByName(name, platform);
    if (storedPlayer) {
      return {
        accountId: storedPlayer.pubgAccountId,
        name: storedPlayer.name,
        platform: storedPlayer.platform,
        clanId: storedPlayer.pubgClanId,
        matchIds: [],
      };
    }

    const player = await getPlayerByName(name, platform);
    if (!player) throw new ApiError(404, "PUBG_PLAYER_NOT_FOUND", "PUBG 계정을 찾을 수 없습니다.");
    return player;
  } catch (error) {
    if (error instanceof PubgApiError) {
      if (error.status === 404) throw new ApiError(404, "PUBG_PLAYER_NOT_FOUND", "PUBG 계정을 찾을 수 없습니다.");
      throw new ApiError(
        error.status === 429 ? 429 : 502,
        error.status === 429 ? "PUBG_RATE_LIMITED" : "PUBG_API_ERROR",
        "PUBG 계정 조회에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        error.retryAfter ? { "Retry-After": error.retryAfter } : undefined,
      );
    }
    throw error;
  }
}
