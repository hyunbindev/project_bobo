/** PUBG 게임 모드를 기존 영어 표시 형식으로 변환한다. */
export function formatGameMode(gameMode: string) {
  return gameMode.replaceAll("-", " ").toUpperCase();
}

/** 경기 종류와 게임 모드를 함께 표시한다. */
export function formatMatchMode(matchType: string, gameMode: string) {
  const matchTypeLabel =
    matchType === "competitive"
      ? "경쟁전"
      : matchType === "custom"
        ? "사용자 지정"
        : "일반전";

  return `${matchTypeLabel} · ${formatGameMode(gameMode)}`;
}
