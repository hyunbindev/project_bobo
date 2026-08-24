import { ArrowLeft, Clock3 } from "lucide-react";
import Link from "next/link";

import { MatchHistoryTable } from "@/components/clan-dashboard/match-history-table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getMatchRosterHistoryPage } from "@/lib/services/match-service";

const PAGE_SIZE = 20;

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const requestedPage = parsePage(resolvedSearchParams.page);
  const matchHistory = await getMatchRosterHistoryPage(requestedPage, PAGE_SIZE);
  const firstItem =
    matchHistory.totalCount === 0
      ? 0
      : (matchHistory.page - 1) * matchHistory.pageSize + 1;
  const lastItem = Math.min(
    matchHistory.page * matchHistory.pageSize,
    matchHistory.totalCount,
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-360 items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
            href="/"
          >
            <ArrowLeft className="size-4" /> 대시보드
          </Link>
          <Link className="flex items-center gap-3" href="/">
            <span className="grid size-9 place-items-center rounded-sm bg-primary text-xs font-black text-primary-foreground">
              BB
            </span>
            <span className="text-sm font-black tracking-[0.18em]">BOBO</span>
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border/50">
        <div className="hero-grid absolute inset-0 opacity-25" />
        <div className="hero-glow absolute -left-40 top-0 size-96 rounded-full" />
        <div className="relative mx-auto max-w-360 px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <p className="mb-3 text-[10px] font-black tracking-[0.28em] text-primary">
            MATCH ARCHIVE
          </p>
          <h1 className="text-4xl font-black tracking-[-0.055em] sm:text-6xl">
            클랜 전적 기록
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">
            클랜원이 함께 출전한 최신 전적 조회
          </p>
          <div className="mt-7 flex items-center gap-2 text-[10px] font-black tracking-[0.15em] text-muted-foreground">
            <Clock3 className="size-3.5 text-primary" /> 총 {matchHistory.totalCount.toLocaleString("ko-KR")}개 roster 경기
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
                총 {matchHistory.totalCount.toLocaleString("ko-KR")}건 중 {firstItem.toLocaleString("ko-KR")}–{lastItem.toLocaleString("ko-KR")}건
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

function MatchPagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <Pagination className="mx-0 w-auto justify-start sm:justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            aria-disabled={currentPage === 1}
            className={currentPage === 1 ? "pointer-events-none opacity-40" : ""}
            href={`?page=${Math.max(currentPage - 1, 1)}`}
            text="이전"
          />
        </PaginationItem>
        {pages.map((page, index) =>
          page === null ? (
            <PaginationItem key={`ellipsis:${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                className={
                  page === currentPage
                    ? "rounded-sm border-primary text-primary"
                    : "rounded-sm"
                }
                href={`?page=${page}`}
                isActive={page === currentPage}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            aria-disabled={currentPage === totalPages}
            className={
              currentPage === totalPages ? "pointer-events-none opacity-40" : ""
            }
            href={`?page=${Math.min(currentPage + 1, totalPages)}`}
            text="다음"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function parsePage(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(candidate ?? "1", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pageSet = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);
  const sortedPages = [...pageSet]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
  const pages: Array<number | null> = [];

  for (const page of sortedPages) {
    const previousPage = pages.at(-1);

    if (typeof previousPage === "number" && page - previousPage > 1) {
      pages.push(null);
    }

    pages.push(page);
  }

  return pages;
}
