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
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h2 className="min-w-0 text-2xl font-black tracking-tight [overflow-wrap:anywhere]">
            <span>{history.members.map((member) => member.name).join(", ")}</span>
            {" "}<br/>가같이 참여한 경기들
          </h2>
          <span className="shrink-0 text-xs text-muted-foreground">최신순 · {history.page} / {history.totalPages} 페이지</span>
        </div>
        <MatchHistoryTable
          matches={history.items}
          variant="clan-squad"
        />
        <nav aria-label="스쿼드 조합 경기 페이지" className="mt-5 flex items-center justify-end gap-4 text-xs font-bold">
          <button type="button" disabled={history.page <= 1} onClick={() => onPageChange(history.page - 1)} className="hover:text-primary disabled:text-muted-foreground/50">이전</button>
          <span>{history.page} / {history.totalPages}</span>
          <button type="button" disabled={history.page >= history.totalPages} onClick={() => onPageChange(history.page + 1)} className="hover:text-primary disabled:text-muted-foreground/50">다음</button>
        </nav>
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
