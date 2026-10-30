import { getClanById } from "@/lib/pubg/clans";
import { getPlayersByAccountIds } from "@/lib/pubg/players";
import type { PubgPlatform } from "@/lib/pubg/types";
import { saveClanMember } from "@/lib/members/repository";
import { findMainClanSummary } from "@/lib/clans/repository";
import { schedulerLogger } from "@/lib/logger";

export async function getMainClanSummary() {
  // 값이 있으면 지정 클랜을, 없으면 가장 최근 동기화된 클랜을 메인으로 사용한다.
  return findMainClanSummary(process.env.PUBG_CLAN_ID?.trim() || undefined);
}

/** Initialize a missing main clan from the configured master's PUBG account. */
export async function ensureMainClanSummary(platform: PubgPlatform) {
  const storedClan = await getMainClanSummary();
  if (storedClan) return storedClan;

  const masterAccountId = process.env.PUBG_CLAN_MASTER_ID?.trim();
  if (!masterAccountId) {
    throw new Error("Main clan is not configured. Set PUBG_CLAN_MASTER_ID to initialize it.");
  }

  const pubgPlayers = await getPlayersByAccountIds([masterAccountId], platform);
  const master = pubgPlayers.find((player) => player.accountId === masterAccountId);
  if (!master) {
    throw new Error("The configured clan master was not found on the match sync platform.");
  }
  if (!master.clanId) {
    throw new Error("The configured clan master does not belong to a PUBG clan.");
  }

  const configuredClanId = process.env.PUBG_CLAN_ID?.trim();
  if (configuredClanId && master.clanId !== configuredClanId) {
    throw new Error("The configured clan master does not belong to PUBG_CLAN_ID.");
  }

  const clan = await getClanById(master.clanId, platform);
  await saveClanMember({
    clan,
    player: master,
    member: { displayName: null, birthYear: null, profileRegistered: false },
  });

  const summary = await findMainClanSummary(clan.id);
  if (!summary) throw new Error("Main clan initialization could not be verified.");

  schedulerLogger.info({
    event: "match_sync.main_clan_initialized",
    clanId: summary.id,
    pubgClanId: clan.id,
    platform,
    masterAccountId,
  }, "Main clan initialized from clan master");

  return summary;
}
