import { Clock3 } from "lucide-react";

import { MatchHistoryTable } from "@/components/clan-dashboard/match-history-table";
import { MatchPagination } from "@/components/clan-dashboard/match-pagination";
import { SiteHeader } from "@/components/clan-dashboard/site-header";
import { getMainClanSummary } from "@/lib/services/clan-service";
import { getMatchRosterHistoryPage } from "@/lib/services/match-service";

const PAGE_SIZE = 20;

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const requestedPage = parsePage(resolvedSearchParams.page);
  const [matchHistory, clan] = await Promise.all([
    getMatchRosterHistoryPage(requestedPage, PAGE_SIZE),
    getMainClanSummary(),
  ]);
  const firstItem =
    matchHistory.totalCount === 0
      ? 0
      : (matchHistory.page - 1) * matchHistory.pageSize + 1;
  const lastItem = Math.min(
    matchHistory.page * matchHistory.pageSize,
    matchHistory.totalCount,
  );

  return (
    <main className="min-h-screen bg-background pt-18 text-foreground">
      <SiteHeader
        clanName={clan?.name ?? "BOBO"}
        clanTag={clan?.tag ?? "BOBO"}
      />

      <section className="relative overflow-hidden border-b border-border/50">
        <div className="hero-grid absolute inset-0 opacity-25" />
        <div className="hero-glow absolute -left-40 top-0 size-96 rounded-full" />
        <div className="relative mx-auto max-w-360 px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <p className="mb-3 text-[10px] font-black tracking-[0.28em] text-primary">
            MATCH ARCHIVE
          </p>
          <h1 className="text-4xl font-black tracking-[-0.055em] sm:text-6xl">
            <span
              className="military-glitch"
              data-text={"BOBO"}
            >
              BOBO
            </span>
            <br/>
            <span
              className="military-glitch text-primary"
              data-text={"MATCH HISTORY"}
            >
              MATCH HISTORY
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">
            클랜원이 함께 출전한 최신 전적 조회
          </p>
          <div className="mt-7 flex items-center gap-2 text-[10px] font-black tracking-[0.15em] text-muted-foreground">
            <Clock3 className="size-3.5 text-primary" /> 총{" "}
            {matchHistory.totalCount.toLocaleString("ko-KR")}개 roster 경기
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-360 px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-black tracking-[0.24em] text-primary">
                ALL OPERATIONS
              </p>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                시간순 경기 기록
              </h2>
            </div>
            <span className="hidden text-[10px] font-semibold text-muted-foreground sm:block">
              최신 경기순
            </span>
          </div>

          <MatchHistoryTable matches={matchHistory.items} />

          {matchHistory.totalCount > 0 && (
            <div className="mt-8 flex flex-col gap-4 border-t border-border/50 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground">
                총 {matchHistory.totalCount.toLocaleString("ko-KR")}건 중{" "}
                {firstItem.toLocaleString("ko-KR")}–
                {lastItem.toLocaleString("ko-KR")}건
              </p>
              <MatchPagination
                currentPage={matchHistory.page}
                totalPages={matchHistory.totalPages}
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function parsePage(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(candidate ?? "1", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
