"use client";

import { useEffect, useState } from "react";

import { SquadMatchHistorySection, SquadMatchHistorySkeleton } from "@/components/squad-history/squad-history";
import { fetchSquadHistory } from "@/lib/squad-history/client";
import type { SquadHistory } from "@/lib/squad-history/types";

export function SquadHistoryPanel({
  matchId, rosterId, matchCount, page, onPageChange,
}: {
  matchId: string;
  rosterId: string;
  matchCount: number;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    key: string; data: SquadHistory | null; error?: string;
  } | null>(null);
  const key = `${matchId}:${rosterId}:${page}:${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    void fetchSquadHistory(matchId, rosterId, page, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setResult({ key, data: null, error: error instanceof Error ? error.message : "기록을 불러오지 못했습니다." });
      });
    return () => controller.abort();
  }, [matchId, rosterId, page, key]);

  const loading = result?.key !== key;
  let content;
  if (!loading && result.error) {
    content = (
      <div className="py-4">
        <p role="alert" className="text-sm text-muted-foreground">{result.error}</p>
        <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-4 rounded-sm border border-primary/40 px-4 py-2 text-sm font-bold text-primary">다시 시도</button>
      </div>
    );
  } else if (!loading && !result.data) {
    content = <p className="py-4 text-sm text-muted-foreground">현재 조합의 경기 기록이 없습니다.</p>;
  } else if (!loading && result.data) {
    content = <SquadMatchHistorySection history={result.data} onPageChange={onPageChange} />;
  }
  return (
    <div id="squad-matches" className="scroll-mt-24" aria-busy={loading} data-scroll-ready={!loading}>
      {loading ? <SquadMatchHistorySkeleton matchCount={matchCount} page={page} /> : content}
    </div>
  );
}
