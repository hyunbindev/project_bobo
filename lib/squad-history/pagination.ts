export const SQUAD_HISTORY_PAGE_SIZE = 10;

export function getSquadHistoryPagination(matchCount: number, requestedPage: number) {
  const totalPages = Math.max(Math.ceil(matchCount / SQUAD_HISTORY_PAGE_SIZE), 1);
  const page = Math.min(Math.max(Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1, 1), totalPages);
  return {
    page,
    totalPages,
    rowCount: Math.min(SQUAD_HISTORY_PAGE_SIZE, Math.max(0, matchCount - (page - 1) * SQUAD_HISTORY_PAGE_SIZE)),
  };
}
