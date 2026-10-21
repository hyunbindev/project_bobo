"use client";

import { Crosshair, Users } from "lucide-react";
import { useEffect, useId, useState, type ReactNode, type KeyboardEvent } from "react";

import { SquadHistoryPanel } from "@/components/clan-dashboard/squad-history-panel";
import { getMatchDetailTab, matchDetailHref, type MatchDetailTab } from "@/lib/match-detail-navigation";

const tabs = [
  { value: "match", label: "이번 경기", icon: Crosshair },
  { value: "history", label: "함께한 전적", icon: Users },
] as const;

export function MatchDetailTabs({
  children, matchId, rosterId, initialTab = "match", initialPage = 1, historyEnabled = true,
}: {
  children?: ReactNode;
  matchId: string;
  rosterId: string;
  initialTab?: MatchDetailTab;
  initialPage?: number;
  historyEnabled?: boolean;
}) {
  const id = useId();
  const [selection, setSelection] = useState({ tab: initialTab, page: initialPage });
  const activeTab = historyEnabled ? selection.tab : "match";

  useEffect(() => {
    function restoreSelection() {
      const params = new URLSearchParams(window.location.search);
      const page = Number(params.get("squadPage") ?? 1);
      setSelection({
        tab: getMatchDetailTab(Object.fromEntries(params)),
        page: Number.isSafeInteger(page) && page > 0 ? page : 1,
      });
    }
    window.addEventListener("popstate", restoreSelection);
    return () => window.removeEventListener("popstate", restoreSelection);
  }, []);

  function select(tab: MatchDetailTab, page?: number) {
    if (tab === activeTab && (page === undefined || page === selection.page)) return;
    setSelection((previous) => ({ tab, page: page ?? previous.page }));
    const query: Record<string, string[]> = {};
    for (const [key, value] of new URLSearchParams(window.location.search)) {
      (query[key] ??= []).push(value);
    }
    window.history.pushState(null, "", matchDetailHref(query, tab, page));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") next = 1 - index;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 1;
    else return;
    event.preventDefault();
    select(tabs[next].value);
    document.getElementById(`${id}-tab-${tabs[next].value}`)?.focus();
  }

  return (
    <>
      {historyEnabled && (
        <div className="border-b border-border/60 bg-surface">
          <div role="tablist" aria-label="경기 기록 보기" className="mx-auto flex max-w-360 px-5 sm:px-8 lg:px-12">
            {tabs.map(({ value, label, icon: Icon }, index) => (
              <button
                key={value}
                id={`${id}-tab-${value}`}
                type="button"
                role="tab"
                aria-selected={activeTab === value}
                aria-controls={`${id}-panel-${value}`}
                tabIndex={activeTab === value ? 0 : -1}
                onClick={() => select(value)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-5 text-sm font-black transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary sm:flex-none sm:px-8 ${activeTab === value ? "border-primary bg-primary/5 text-primary" : "border-transparent text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}
              >
                <Icon aria-hidden="true" className="size-4" />{label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div id={`${id}-panel-match`} role={historyEnabled ? "tabpanel" : undefined} aria-labelledby={historyEnabled ? `${id}-tab-match` : undefined} hidden={activeTab !== "match"} tabIndex={historyEnabled ? 0 : undefined}>
        {children}
      </div>
      {historyEnabled && (
        <div id={`${id}-panel-history`} role="tabpanel" aria-labelledby={`${id}-tab-history`} hidden={activeTab !== "history"} tabIndex={0}>
          {activeTab === "history" && <SquadHistoryPanel matchId={matchId} rosterId={rosterId} page={selection.page} onPageChange={(page) => select("history", page)} />}
        </div>
      )}
    </>
  );
}
