import Link from "next/link";
import type { ReactNode } from "react";

import { MatchHistoryTable, MatchHistoryTableSkeleton } from "@/components/clan-dashboard/match-history-table";
import type { SquadHistory, SquadSummary } from "@/lib/services/squad-history-service";

import { getSquadHistoryPagination } from "@/lib/squad-history-pagination";

const formatter = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 });

export function SquadHistorySection({ history, mode, current }: {
  history: SquadSummary;
  mode: string;
  current: { kills: number; damage: number; rank: number };
}) {
  const metrics = [
    { label: "킬", current: current.kills, average: history.previousAverageKills },
    { label: "딜", current: Math.round(current.damage), average: history.previousAverageDamage },
    { label: "순위", current: current.rank, average: history.previousAverageRank },
  ];
  const memberNames = history.members.map((member) => member.name).join(" · ") || "이 조합";

  return (
    <div className="overflow-hidden rounded-sm border border-border/70 bg-card">
      <div className="border-b border-border/60 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-2xl font-black tracking-tight sm:text-3xl">
          {history.members.map((member, index) => (
            <span key={member.id} className="inline-flex min-w-0 max-w-full items-center gap-2">
              {index > 0 && <span aria-hidden="true" className="text-muted-foreground/50">·</span>}
              <Link href={`/members/${member.id}`} className="break-all underline-offset-4 hover:text-primary hover:underline">{member.name}</Link>
            </span>
          ))}
        </div>
        <h2 className="mt-2 text-lg font-bold tracking-tight text-foreground sm:text-xl">함께한 기록과 이번 경기</h2>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>함께한 <strong className="text-foreground">{formatter.format(history.matchCount)}판</strong></span>
          <span><strong className="text-primary">{formatter.format(history.winCount)}승</strong></span>
          <span>승률 <strong className="text-foreground">{formatter.format(history.winRate)}%</strong></span>
        </p>
        <p className="mt-2 text-[10px] leading-4 text-muted-foreground sm:text-[11px]">{mode} · 이 멤버들이 함께한 경기 · 이 경기까지 수집된 기록</p>
      </div>
      <div className="px-5 py-4 sm:px-6">
        <table className="w-full table-fixed text-right tabular-nums">
          <caption className="sr-only">동일한 클랜원들의 이번 경기 성적과 이전 경기 평균 비교</caption>
          <thead>
            <tr className="text-[10px] text-muted-foreground sm:text-[11px]">
              <th scope="col" className="w-1/5 pb-2 text-left font-medium">지표</th>
              <th scope="col" className="pb-2 font-bold text-primary">이번 경기</th>
              <th scope="col" className="pb-2 font-medium">이전 {formatter.format(history.previousMatchCount)}경기 평균</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => {
              const precision = metric.label === "딜" ? 1 : 10;
              const difference = metric.average === null ? null : Math.round(
                (metric.label === "순위" ? metric.average - metric.current : metric.current - metric.average) * precision,
              ) / precision;
              return (
              <tr key={metric.label} className="border-t border-border/40">
                <th scope="row" className="py-2.5 text-left text-xs font-semibold">{metric.label}</th>
                <td className="py-2.5 text-base font-black tracking-tight sm:text-lg">
                  <span className="inline-flex flex-wrap items-baseline justify-end gap-x-1.5">
                    <span>{metric.label === "순위" && "#"}{formatter.format(metric.current)}</span>
                    {difference !== null && (
                      <span
                        className={`text-xs font-semibold ${difference > 0 ? "text-success" : difference < 0 ? "text-destructive" : "text-muted-foreground"}`}
                        title={metric.label === "순위" ? "이전 평균보다 순위가 오르면 +로 표시합니다." : "이전 경기 평균 대비 변화량"}
                      >
                        {`(${difference > 0 ? "+" : ""}${formatter.format(difference)})`}
                      </span>
                    )}
                  </span>
                </td>
                <td className="py-2.5 text-sm font-semibold text-muted-foreground sm:text-base">{metric.average === null ? "—" : `${metric.label === "순위" ? "#" : ""}${formatter.format(metric.average)}`}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-1 border-t border-border/50 pt-3">
          <p className="break-words text-xs font-semibold leading-5">
            {`${memberNames}의 `}
            <strong className="text-primary">{formatter.format(current.rank === 1 ? history.winCount : history.matchCount)}번째 {current.rank === 1 ? "치킨 경기" : "함께한 경기"}</strong>
            입니다!
          </p>
        </div>
      </div>
    </div>
  );
}

export function SquadMatchHistorySection({ history, onPageChange }: {
  history: SquadHistory;
  onPageChange: (page: number) => void;
}) {
  return (
    <SquadMatchHistoryLayout history={history} onPageChange={onPageChange}>
      <MatchHistoryTable matches={history.items} variant="clan-squad" />
    </SquadMatchHistoryLayout>
  );
}

function SquadMatchHistoryLayout({ history, onPageChange, children }: {
  history: Pick<SquadHistory, "matchCount" | "page" | "totalPages">;
  onPageChange?: (page: number) => void;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold">함께한 경기 <span className="text-muted-foreground">{formatter.format(history.matchCount)}개</span></h3>
        <span className="text-xs text-muted-foreground">최신순 · {history.page} / {history.totalPages} 페이지</span>
      </div>
      {children}
      <nav aria-label="스쿼드 조합 경기 페이지" className="mt-4 flex items-center justify-end gap-2 text-xs font-bold">
        <button type="button" disabled={!onPageChange || history.page <= 1} onClick={() => onPageChange?.(history.page - 1)} className="min-h-10 rounded-sm border border-border px-4 hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40">이전</button>
        <span aria-live="polite" className="px-3 tabular-nums">{history.page} / {history.totalPages}</span>
        <button type="button" disabled={!onPageChange || history.page >= history.totalPages} onClick={() => onPageChange?.(history.page + 1)} className="min-h-10 rounded-sm border border-border px-4 hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40">다음</button>
      </nav>
    </div>
  );
}

export function SquadMatchHistorySkeleton({ matchCount, page }: { matchCount: number; page: number }) {
  const pagination = getSquadHistoryPagination(matchCount, page);
  return (
    <div role="status" aria-label="함께한 경기 기록 로딩 중" aria-busy="true">
      <SquadMatchHistoryLayout history={{ matchCount, ...pagination }}>
        <MatchHistoryTableSkeleton rowCount={pagination.rowCount} />
      </SquadMatchHistoryLayout>
    </div>
  );
}
