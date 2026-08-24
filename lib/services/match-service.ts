import {
  countMatchRosterHistories,
  findMatchRosterHistories,
  type MatchRosterListItem,
} from "@/lib/repositories/match-repository";

export type MatchRosterHistoryPage = {
  items: MatchRosterListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export async function getMatchRosterHistoryPage(
  requestedPage = 1,
  pageSize = 20,
): Promise<MatchRosterHistoryPage> {
  const normalizedPageSize = Math.min(Math.max(Math.trunc(pageSize), 1), 100);
  const totalCount = await countMatchRosterHistories();
  const totalPages = Math.max(Math.ceil(totalCount / normalizedPageSize), 1);
  const page = Math.min(
    Math.max(Math.trunc(requestedPage) || 1, 1),
    totalPages,
  );

  const items =
    totalCount === 0
      ? []
      : await findMatchRosterHistories({
          limit: normalizedPageSize,
          offset: (page - 1) * normalizedPageSize,
        });

  return {
    items,
    page,
    pageSize: normalizedPageSize,
    totalCount,
    totalPages,
  };
}
