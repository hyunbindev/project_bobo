import { Activity, ArrowLeft, Clock3, Crosshair, Map, Trophy, Users } from "lucide-react";
import Link from "next/link";

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

const mapLabels: Record<string, string> = {
  Baltic_Main: "ERANGEL",
  Chimera_Main: "PARAMO",
  Desert_Main: "MIRAMAR",
  DihorOtok_Main: "VIKENDI",
  Heaven_Main: "HAVEN",
  Kiki_Main: "DESTON",
  Neon_Main: "RONDO",
  Range_Main: "CAMP JACKAL",
  Savage_Main: "SANHOK",
  Summerland_Main: "KARAKIN",
  Tiger_Main: "TAEGO",
};

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
            BOBO 클랜원이 함께 출전한 로스터를 최신 경기부터 확인해.
          </p>
          <div className="mt-7 flex items-center gap-2 text-[10px] font-black tracking-[0.15em] text-muted-foreground">
            <Clock3 className="size-3.5 text-primary" /> 총 {matchHistory.totalCount.toLocaleString("ko-KR")}개 로스터 경기
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

          <div className="overflow-hidden rounded-sm border border-border/60 bg-card">
            <div className="hidden grid-cols-[70px_minmax(160px,1fr)_90px_80px_100px_220px_130px] border-b border-border/60 px-6 py-3 text-[9px] font-black tracking-[0.16em] text-muted-foreground lg:grid">
              <span>RANK</span>
              <span>MAP / MODE</span>
              <span>TEAM KILLS</span>
              <span>DBNO</span>
              <span>DAMAGE</span>
              <span>MEMBERS</span>
              <span className="text-right">PLAYED</span>
            </div>

            {matchHistory.items.length === 0 ? (
              <div className="grid min-h-64 place-items-center px-6 py-16 text-center">
                <div>
                  <Trophy className="mx-auto size-8 text-primary/70" />
                  <p className="mt-4 text-sm font-black">저장된 경기가 아직 없어</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    동기화가 완료되면 최신 경기부터 여기에 표시돼.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {matchHistory.items.map((match) => (
                  <Link
                    className="grid gap-4 px-5 py-5 transition-colors hover:bg-foreground/[0.025] lg:grid-cols-[70px_minmax(160px,1fr)_90px_80px_100px_220px_130px] lg:items-center lg:px-6"
                    href={`/matches/${encodeURIComponent(match.matchId)}/rosters/${encodeURIComponent(match.rosterId)}`}
                    key={`${match.matchId}:${match.rosterId}`}
                  >
                    <div>
                      <span
                        className={`text-2xl font-black tracking-[-0.05em] ${
                          match.rank === 1 ? "text-primary" : "text-foreground"
                        }`}
                      >
                        #{match.rank}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-black">
                        <Map className="size-3.5 text-primary" /> {formatMapName(match.mapName)}
                      </p>
                      <p className="mt-1 truncate text-[10px] font-semibold text-muted-foreground">
                        {formatMode(match.matchType, match.gameMode)}
                      </p>
                    </div>

                    <MatchMetric icon={Crosshair} label="KILLS" value={match.kills} />
                    <MatchMetric icon={Activity} label="DBNO" value={match.dbnos} />
                    <MatchMetric
                      icon={Trophy}
                      label="DMG"
                      value={Math.round(match.damage).toLocaleString("ko-KR")}
                    />
                    <div>
                      <p className="mb-2 flex items-center gap-1 text-[9px] font-bold tracking-wider text-muted-foreground lg:hidden">
                        <Users className="size-3" /> PLAYERS
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {match.memberNames.map((member, index) => (
                          <span
                            className="max-w-28 truncate rounded-sm bg-foreground/[0.055] px-2 py-1 text-[9px] font-bold text-muted-foreground"
                            key={`${member}:${index}`}
                            title={member}
                          >
                            {member}
                          </span>
                        ))}
                      </div>
                    </div>

                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground lg:justify-end">
                      <Clock3 className="size-3" /> {formatPlayedAt(match.playedAt)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

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

function MatchMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Crosshair;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2 lg:block">
      <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider text-muted-foreground lg:hidden">
        <Icon className="size-3" /> {label}
      </span>
      <strong className="text-sm font-black">{value}</strong>
    </div>
  );
}

function parsePage(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(candidate ?? "1", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function formatMapName(mapName: string) {
  return mapLabels[mapName] ?? mapName.replace(/_Main$/i, "").toUpperCase();
}

function formatMode(matchType: string, gameMode: string) {
  const typeLabel = matchType === "competitive" ? "경쟁전" : "일반전";
  const modeLabel = gameMode.replaceAll("-", " ").toUpperCase();

  return `${typeLabel} · ${modeLabel}`;
}

function formatPlayedAt(playedAt: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(playedAt);
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
