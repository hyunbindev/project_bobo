"use client";

import { useEffect, useState } from "react";

import { SquadMatchHistorySection, SquadMatchHistorySkeleton } from "@/components/clan-dashboard/squad-history";
import { fetchSquadHistory } from "@/lib/squad-history-client";
import type { SquadHistory } from "@/lib/services/squad-history-service";

export function SquadHistoryPanel({
  matchId, rosterId, page, onPageChange, enabled = true, members = [],
}: {
  matchId: string;
  rosterId: string;
  page: number;
  onPageChange: (page: number) => void;
  enabled?: boolean;
  members?: SquadHistory["members"];
}) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    key: string; data: SquadHistory | null; error?: string;
  } | null>(null);
  const key = `${matchId}:${rosterId}:${page}:${attempt}`;

  useEffect(() => {
    if (!enabled || result?.key === key) return;
    const controller = new AbortController();
    void fetchSquadHistory(matchId, rosterId, page, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setResult({ key, data: null, error: error instanceof Error ? error.message : "기록을 불러오지 못했습니다." });
      });
    return () => controller.abort();
  }, [matchId, rosterId, page, key, enabled, result?.key]);

  const loading = result?.key !== key;
  let content;
  if (!loading && result.error) {
    content = (
      <div className="mx-auto max-w-360 px-5 py-14 sm:px-8 lg:px-12">
        <p role="alert" className="text-sm text-muted-foreground">{result.error}</p>
        <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-4 rounded-sm border border-primary/40 px-4 py-2 text-sm font-bold text-primary">다시 시도</button>
      </div>
    );
  } else if (!loading && !result.data) {
    content = <p className="mx-auto max-w-360 px-5 py-14 text-sm text-muted-foreground sm:px-8 lg:px-12">현재 조합의 경기 기록이 없습니다.</p>;
  } else if (!loading && result.data) {
    content = <SquadMatchHistorySection history={result.data} onPageChange={onPageChange} />;
  }
  return (
    <div className="grid grid-cols-1 items-start">
      <div aria-hidden={!loading} inert={!loading} className={`col-start-1 row-start-1 min-w-0 ${loading ? "" : "invisible pointer-events-none"}`}>
        <SquadMatchHistorySkeleton members={members} page={page} />
      </div>
      {!loading && <div className="col-start-1 row-start-1 min-w-0">{content}</div>}
    </div>
  );
}
