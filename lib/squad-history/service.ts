import type {
  SquadHistory,
  SquadSummary,
  SquadHistoryInput,
} from "@/lib/squad-history/types";
import { findSquadHistoryMatches, findSquadHistorySummary } from "@/lib/squad-history/repository";

import { getSquadHistoryPagination, SQUAD_HISTORY_PAGE_SIZE } from "@/lib/squad-history/pagination";

export async function getSquadHistorySummary(input: SquadHistoryInput): Promise<SquadSummary | null> {
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
): Promise<SquadHistory | null> {
  const summary = await getSquadHistorySummary(input);
  if (!summary) return null;

  const { page, totalPages } = getSquadHistoryPagination(summary.matchCount, requestedPage);
  const items = await findSquadHistoryMatches(input, SQUAD_HISTORY_PAGE_SIZE, (page - 1) * SQUAD_HISTORY_PAGE_SIZE);

  return {
    ...summary,
    items,
    page,
    totalPages,
  };
}

