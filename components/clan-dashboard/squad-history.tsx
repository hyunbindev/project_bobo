import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";

import { MatchHistoryTable } from "@/components/clan-dashboard/match-history-table";
import type { SquadHistory, SquadSummary } from "@/lib/services/squad-history-service";

const numberFormatter = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 });
export function SquadHistorySection({
  history,
  mode,
}: {
  history: SquadSummary;
  mode: string;
}) {
  const metrics = [
    { label: "함께한 경기", value: `${history.matchCount.toLocaleString("ko-KR")}회` },
    { label: "치킨", value: `${history.winCount.toLocaleString("ko-KR")}회` },
    { label: "평균 순위", value: history.averageRank === null ? "—" : `#${numberFormatter.format(history.averageRank)}` },
    { label: "평균 클랜원 합산 딜량", value: history.averageDamage === null ? "—" : Math.round(history.averageDamage).toLocaleString("ko-KR") },
  ];

  return (
    <section id="squad-history" className="scroll-mt-24 border-b border-border/50 bg-surface">
      <div className="mx-auto max-w-360 px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight">
          <Users className="size-5 text-primary" /> 함께한 클랜원 정보
        </h2>
        <SquadMemberCards members={history.members} />
        <p className="mt-3 text-xs font-semibold text-muted-foreground">{mode} · 수집된 전체 기록 기준</p>
        <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border/60 bg-border/60 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-card p-5">
              <dt className="text-[11px] font-bold text-muted-foreground">{metric.label}</dt>
              <dd className="mt-3 text-2xl font-black tracking-tight">{metric.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function SquadMatchHistorySection({
  history,
  onPageChange,
}: {
  history: SquadHistory;
  onPageChange: (page: number) => void;
}) {
  return (
    <section id="squad-matches" className="scroll-mt-24 border-t border-border/50 bg-surface">
      <div className="mx-auto max-w-360 px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <SquadMatchHistoryHeading members={history.members} page={history.page} totalPages={history.totalPages} />
        <div className="min-h-240 lg:min-h-225">
          <MatchHistoryTable
            matches={history.items}
            variant="clan-squad"
          />
        </div>
        <nav aria-label="스쿼드 조합 경기 페이지" className="mt-5 flex items-center justify-end gap-4 text-xs font-bold">
          <button type="button" disabled={history.page <= 1} onClick={() => onPageChange(history.page - 1)} className="hover:text-primary disabled:text-muted-foreground/50">이전</button>
          <span>{history.page} / {history.totalPages}</span>
          <button type="button" disabled={history.page >= history.totalPages} onClick={() => onPageChange(history.page + 1)} className="hover:text-primary disabled:text-muted-foreground/50">다음</button>
        </nav>
      </div>
    </section>
  );
}

function SquadMatchHistoryHeading({ members, page, totalPages }: {
  members: SquadSummary["members"];
  page: number;
  totalPages?: number;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <h2 className="min-w-0 text-2xl font-black tracking-tight [overflow-wrap:anywhere]">
        <span>{members.map((member) => member.name).join(", ")}</span>
        {" "}<br />가같이 참여한 경기들
      </h2>
      <span className="shrink-0 text-xs text-muted-foreground">최신순 · {page} / {totalPages ?? "—"} 페이지</span>
    </div>
  );
}

export function SquadMatchHistorySkeleton({ members = [], page = 1 }: {
  members?: SquadSummary["members"];
  page?: number;
}) {
  return (
    <section role="status" aria-live="polite" aria-busy="true" className="border-t border-border/50 bg-surface">
      <span className="sr-only">함께한 경기 기록을 불러오는 중입니다.</span>
      <div aria-hidden="true" className="mx-auto max-w-360 px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <SquadMatchHistoryHeading members={members} page={page} />
        <div className="min-h-240 lg:min-h-225">
          <div className="overflow-hidden rounded-sm border border-border/60 bg-card motion-safe:animate-pulse">
            <div className="hidden h-10 grid-cols-[60px_1fr_100px_100px_140px] items-center gap-6 bg-muted/20 px-6 lg:grid">
              {["w-8", "w-24", "w-16", "w-16", "w-20"].map((width, index) => <span key={index} className={`h-2 rounded-sm bg-muted ${width}`} />)}
            </div>
            {Array.from({ length: 10 }, (_, index) => (
              <div key={index} className="flex h-22 flex-col justify-center gap-3 border-t border-border/50 px-4 first:border-t-0 sm:px-5 lg:h-20 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-6">
                <div className="flex items-center justify-between gap-4 lg:contents">
                  <div className="flex min-w-0 items-center gap-3 lg:contents">
                    <span className="h-6 w-8 shrink-0 rounded-sm bg-muted lg:w-12" />
                    <div className="space-y-2 lg:flex-1"><div className="h-4 w-28 rounded-sm bg-muted" /><div className="hidden h-2 w-32 rounded-sm bg-muted lg:block" /></div>
                  </div>
                  <span className="h-2 w-20 rounded-sm bg-muted lg:order-last lg:w-28" />
                  <span className="hidden h-4 w-16 rounded-sm bg-muted lg:block" />
                  <span className="hidden h-4 w-20 rounded-sm bg-muted lg:block" />
                </div>
                <div className="flex justify-between gap-6 lg:hidden"><span className="h-2 w-24 rounded-sm bg-muted" /><span className="h-2 w-32 rounded-sm bg-muted" /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 flex h-4 justify-end gap-4"><span className="h-3 w-8 rounded-sm bg-muted" /><span className="h-3 w-12 rounded-sm bg-muted" /><span className="h-3 w-8 rounded-sm bg-muted" /></div>
      </div>
    </section>
  );
}

function SquadMemberCards({ members }: { members: SquadHistory["members"] }) {
  return (
        <div className="mt-5 flex w-full flex-wrap justify-between gap-3">
          {members.map((member, index) => {
            // 카드 내부 너비(cqi)에 닉네임 길이와 문자 폭을 반영한다.
            const nameWidth = Array.from(member.name).reduce(
              (width, character) => width + (/[^\u0000-\u007f]|[MW@#%]/.test(character) ? 1.1 : 0.75),
              0,
            );
            return (
            <Link
              key={member.id}
              href={`/members/${member.id}`}
              className="@container group relative flex min-w-0 flex-1 basis-full flex-col justify-between gap-5 border border-border bg-linear-to-br from-primary/10 via-card to-card p-5 transition-colors hover:border-primary/60 hover:from-primary/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:basis-[calc(50%-0.375rem)] lg:basis-0 lg:p-6"
            >
              <span aria-hidden="true" className="absolute -left-px -top-px size-4 border-l-2 border-t-2 border-primary" />
              <span aria-hidden="true" className="absolute -bottom-px -right-px size-4 border-b-2 border-r-2 border-primary/50 transition-colors group-hover:border-primary" />
              <span className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-muted-foreground">
                  SQUAD MEMBER / {String(index + 1).padStart(2, "0")}
                </span>
                <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-primary/60 transition-colors group-hover:text-primary" />
              </span>
              <span
                title={member.name}
                className="block w-full min-w-0 truncate font-black leading-tight tracking-tight text-primary"
                style={{ fontSize: `clamp(0.875rem, ${100 / Math.max(nameWidth, 10)}cqi, 1.5rem)` }}
              >
                {member.name}
              </span>
            </Link>
            );
          })}
        </div>

  );
}
