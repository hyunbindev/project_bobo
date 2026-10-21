"use client";

import { useEffect, useState } from "react";

import { SquadMatchHistorySection } from "@/components/clan-dashboard/squad-history";
import { fetchSquadHistory } from "@/lib/squad-history-client";
import type { SquadHistory } from "@/lib/services/squad-history-service";

export function SquadHistoryPanel({
  matchId, rosterId, page, onPageChange,
}: {
  matchId: string;
  rosterId: string;
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

  if (result?.key !== key) {
    return <div role="status" aria-live="polite" className="mx-auto max-w-360 px-5 py-14 text-sm text-muted-foreground sm:px-8 lg:px-12">함께한 경기 기록을 불러오는 중입니다.</div>;
  }
  if (result.error) {
    return (
      <div className="mx-auto max-w-360 px-5 py-14 sm:px-8 lg:px-12">
        <p role="alert" className="text-sm text-muted-foreground">{result.error}</p>
        <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-4 rounded-sm border border-primary/40 px-4 py-2 text-sm font-bold text-primary">다시 시도</button>
      </div>
    );
  }
  if (!result.data) {
    return <p className="mx-auto max-w-360 px-5 py-14 text-sm text-muted-foreground sm:px-8 lg:px-12">현재 조합의 경기 기록이 없습니다.</p>;
  }
  return <SquadMatchHistorySection history={result.data} onPageChange={onPageChange} />;
}
