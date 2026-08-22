import { findMainClanSummary } from "@/lib/repositories/clan-repository";

export async function getMainClanSummary() {
  // 값이 있으면 지정 클랜을, 없으면 가장 최근 동기화된 클랜을 메인으로 사용한다.
  return findMainClanSummary(process.env.PUBG_CLAN_ID);
}
