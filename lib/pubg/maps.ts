const mapLabels: Record<string, string> = {
  Baltic_Main: "ERANGEL",
  Chimera_Main: "PARAMO",
  Desert_Main: "MIRAMAR",
  DihorOtok_Main: "VIKENDI",
  Heaven_Main: "HAVEN",
  Kiki_Main: "DESTON",
  Neon_Main: "RONDO",
  Range_Main: "CAMP JACKAL",
  Savage_Main: "SANHOK",
  Summerland_Main: "KARAKIN",
  Tiger_Main: "TAEGO",
};

/** PUBG 맵 식별자를 표시 이름으로 변환한다. 미등록 맵은 접미사를 제거한다. */
export function formatMapName(mapName: string) {
  return mapLabels[mapName] ?? mapName.replace(/_Main$/i, "").toUpperCase();
}
