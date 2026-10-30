"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { SquadHistoryPanel } from "@/components/clan-dashboard/squad-history-panel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getMatchDetailScrollTarget, getSquadHistoryNavigation, squadHistoryHref } from "@/lib/matches/navigation";

export function SquadHistoryAccordion({ matchId, rosterId, matchCount, initialOpen = false, initialPage = 1 }: {
  matchId: string;
  rosterId: string;
  matchCount: number;
  initialOpen?: boolean;
  initialPage?: number;
}) {
  const [selection, setSelection] = useState({ open: initialOpen, page: initialPage });

  useEffect(() => {
    const restore = () => {
      const navigation = getSquadHistoryNavigation(Object.fromEntries(new URLSearchParams(window.location.search)));
      setSelection({ ...navigation, open: navigation.open || getMatchDetailScrollTarget(window.location.hash) === "squad-matches" });
    };
    const frame = requestAnimationFrame(restore);
    window.addEventListener("popstate", restore);
    window.addEventListener("hashchange", restore);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("popstate", restore);
      window.removeEventListener("hashchange", restore);
    };
  }, []);

  function navigate(open: boolean, page: number, push = false) {
    setSelection({ open, page });
    const query: Record<string, string[]> = {};
    for (const [key, value] of new URLSearchParams(window.location.search)) (query[key] ??= []).push(value);
    const href = squadHistoryHref(query, open, open ? page : undefined);
    if (push) window.history.pushState(null, "", href);
    else window.history.replaceState(null, "", href);
  }

  return (
    <Collapsible id="squad-history" className="group mt-3 scroll-mt-24 rounded-sm border border-border/60 bg-card" open={selection.open}
      onOpenChange={(open) => navigate(open, selection.page)}
    >
      <CollapsibleTrigger className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 px-5 text-left text-sm font-bold hover:text-primary focus-visible:outline-2 focus-visible:outline-primary sm:px-8">
        <span>함께한 경기 <span className="text-primary">{matchCount.toLocaleString("ko-KR")}개</span> 보기</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform duration-300 group-data-[open]:rotate-180 motion-reduce:transition-none" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border/50 p-4 sm:p-6">
          <SquadHistoryPanel matchId={matchId} rosterId={rosterId} matchCount={matchCount} page={selection.page}
            onPageChange={(page) => {
              navigate(true, page, true);
            }}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
