export type MatchDetailSearchParams = Record<string, string | string[] | undefined>;

export const MATCH_DETAIL_NAVIGATION_EVENT = "match-detail:navigate";

export function getMatchDetailScrollTarget(hash: string) {
  if (hash === "#match-records") return "match-records";
  if (hash === "#squad-matches") return "squad-matches";
  return null;
}

export function getSquadHistoryNavigation(query: MatchDetailSearchParams) {
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const page = Number(first(query.squadPage) ?? 1);
  return {
    // Preserve links to the former history tab.
    open: first(query.squadHistory) === "open" || first(query.tab) === "history" || query.squadPage !== undefined,
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

export function squadHistoryHref(query: MatchDetailSearchParams, open: boolean, page?: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (["tab", "squadHistory", "squadPage"].includes(key) || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
  }
  if (open) {
    params.set("squadHistory", "open");
    if (page !== undefined) params.set("squadPage", String(page));
  }
  const search = params.toString();
  return `${search ? `?${search}` : ""}#${open && page !== undefined ? "squad-matches" : "squad-history"}`;
}
