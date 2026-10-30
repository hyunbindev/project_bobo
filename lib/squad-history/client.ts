import type { SquadHistory } from "@/lib/squad-history/types";

type SquadHistoryJson = Omit<SquadHistory, "items"> & {
  items: Array<Omit<SquadHistory["items"][number], "playedAt"> & { playedAt: string }>;
};

export async function fetchSquadHistory(
  matchId: string,
  rosterId: string,
  page: number,
  signal: AbortSignal,
): Promise<SquadHistory | null> {
  const response = await fetch(
    `/api/matches/${encodeURIComponent(matchId)}/rosters/${encodeURIComponent(rosterId)}/squad-history?page=${page}`,
    { signal, cache: "no-store" },
  );
  if (!response.ok) throw new Error("함께한 경기 기록을 불러오지 못했습니다.");
  const { data } = await response.json() as { data: SquadHistoryJson | null };
  if (!data) return null;
  return {
    ...data,
    items: data.items.map((match) => ({ ...match, playedAt: new Date(match.playedAt) })),
  };
}
