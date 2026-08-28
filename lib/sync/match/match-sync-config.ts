import type { PubgPlatform } from "@/lib/pubg/types";

export const MATCH_SYNC_PLATFORM: PubgPlatform = "kakao";
export const PLAYER_BATCH_SIZE = 10;
export const MATCH_FETCH_BATCH_SIZE = 5;
export const PLAYER_REQUEST_INTERVAL_MS = 8_000;
export const MAX_RATE_LIMIT_RETRIES = 3;
