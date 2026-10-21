export type MatchDetailTab = "match" | "history";
export type MatchDetailSearchParams = Record<string, string | string[] | undefined>;

export function getMatchDetailTab(query: MatchDetailSearchParams): MatchDetailTab {
  const tab = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  return tab === "history" ? "history" : "match";
}

export function matchDetailHref(
  query: MatchDetailSearchParams,
  tab: MatchDetailTab,
  page?: number,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === "tab" || value === undefined || (page !== undefined && key === "squadPage")) continue;
    for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
  }
  params.set("tab", tab);
  if (page !== undefined) params.set("squadPage", String(page));
  return `?${params.toString()}#${page === undefined ? "match-records" : "squad-matches"}`;
}
