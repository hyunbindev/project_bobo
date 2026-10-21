import {
  findSquadHistoryMatches,
  findSquadHistorySummary,
  type SquadHistoryInput,
} from "@/lib/repositories/squad-history-repository";

const PAGE_SIZE = 10;

export async function getSquadHistorySummary(input: SquadHistoryInput) {
  const summary = await findSquadHistorySummary(input);
  if (!summary) return null;
  return {
    ...summary,
    winRate: summary.matchCount > 0 ? (summary.winCount / summary.matchCount) * 100 : 0,
  };
}

export async function getSquadHistory(
  input: SquadHistoryInput,
  requestedPage = 1,
) {
  const summary = await getSquadHistorySummary(input);
  if (!summary) return null;

  const totalPages = Math.max(Math.ceil(summary.matchCount / PAGE_SIZE), 1);
  const page = Math.min(
    Math.max(Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1, 1),
    totalPages,
  );
  const items = await findSquadHistoryMatches(input, PAGE_SIZE, (page - 1) * PAGE_SIZE);

  return {
    ...summary,
    items,
    page,
    totalPages,
  };
}

export type SquadHistory = NonNullable<Awaited<ReturnType<typeof getSquadHistory>>>;
export type SquadSummary = NonNullable<Awaited<ReturnType<typeof getSquadHistorySummary>>>;
