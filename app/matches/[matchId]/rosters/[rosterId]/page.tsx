import { formatDateTime } from "@/lib/shared/date";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock3, MapPin, Trophy } from "lucide-react";
import { notFound } from "next/navigation";

import { RosterParticipantsTable } from "@/components/matches/roster-participants-table";
import { SiteHeader } from "@/components/layout/site-header";
import { SquadHistoryAccordion } from "@/components/squad-history/squad-history-accordion";
import { SquadHistorySection } from "@/components/squad-history/squad-history";
import { getSquadHistoryNavigation } from "@/lib/matches/navigation";
import { getMainClanSummary } from "@/lib/clans/service";
import { getMatchRosterDetail } from "@/lib/matches/service";
import { getSquadHistorySummary } from "@/lib/squad-history/service";
import { MatchDetailScroll } from "./match-detail-scroll";
import { formatMapName } from "@/lib/pubg/maps";
import { formatMatchMode } from "@/lib/pubg/game-modes";

type PageProps = {
  params: Promise<{ matchId: string; rosterId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { matchId, rosterId } = await params;
  const detail = await getMatchRosterDetail(matchId, rosterId);
  if (!detail) return { title: "경기를 찾을 수 없음" };
  const title = `${formatMapName(detail.match.mapName)} #${detail.roster.rank} 로스터 전적 | BOBO`;
  const description = `${formatMatchMode(detail.match.matchType, detail.match.gameMode)} · ${detail.totals.kills}킬 · ${Math.round(detail.totals.damage).toLocaleString("ko-KR")} 대미지`;
  
  return { 
    title,
    description,
    openGraph: { title, description, images: [] },
    twitter: { card: "summary", title, description, images: [] } 
  };
}

export default async function RosterMatchDetailPage({ params, searchParams }: PageProps) {
  const { matchId, rosterId } = await params;
  const [detail, clan, query] = await Promise.all([
    getMatchRosterDetail(matchId, rosterId), getMainClanSummary(),
    searchParams,
  ]);
  if (!detail) notFound();

  const squadHistory = clan ? await getSquadHistorySummary({ matchId, rosterId, clanId: clan.id }) : null;
  const navigation = getSquadHistoryNavigation(query);
  const mode = formatMatchMode(detail.match.matchType, detail.match.gameMode);
  const squadMemberIds = new Set(squadHistory?.members.map((member) => member.id));
  const currentSquad = detail.participants.reduce((totals, member) => {
    if (squadMemberIds.has(member.playerId)) {
      totals.kills += member.kills;
      totals.damage += member.damageDealt;
    }
    return totals;
  }, { kills: 0, damage: 0, rank: detail.roster.rank });

  return (
    <main className="min-h-screen bg-background pt-18 text-foreground">
      <MatchDetailScroll key={`${matchId}:${rosterId}`} historyAvailable={Boolean(squadHistory)} />
      <SiteHeader clanName={clan?.name ?? "BOBO"} clanTag={clan?.tag ?? "BOBO"} />
      <div className="mx-auto max-w-6xl px-5 pb-14 sm:px-8 lg:px-10">
        <header className="pb-8 pt-7 sm:pb-10 sm:pt-10">

          <Link href="/matches" className="inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary">
            <ArrowLeft aria-hidden="true" className="size-3.5" /> 경기 목록
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="text-6xl font-black leading-none tracking-[-0.08em] text-primary sm:text-7xl">#{detail.roster.rank}</span>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[10px] font-black tracking-[0.18em] text-primary sm:text-xs">
                {detail.roster.rank === 1 && <Trophy aria-hidden="true" className="size-3.5" />}
                {formatRankStatus(detail.roster.rank)}
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{formatMapName(detail.match.mapName)}</h1>
              <p className="mt-1 text-xs text-muted-foreground">{mode} · {detail.match.totalTeams}팀</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 aria-hidden="true" className="size-3.5" />
              {formatDateTime(detail.match.playedAt, { includeYear: true })}
            </span>
            <span>경기 시간 {formatDuration(detail.match.duration)}</span>
          </div>
        </header>

        {squadHistory && (
          <section aria-label="조합 전적과 이번 경기 비교">
            <SquadHistorySection history={squadHistory} mode={mode} current={currentSquad} />
            <SquadHistoryAccordion key={`${matchId}:${rosterId}`} matchId={matchId} rosterId={rosterId}
              matchCount={squadHistory.matchCount} initialOpen={navigation.open} initialPage={navigation.page} />
          </section>
        )}

        <section id="match-records" aria-labelledby="participants-heading" className={`${squadHistory ? "mt-10 sm:mt-12" : ""} scroll-mt-24`}>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] text-primary">MATCH PERFORMANCE</p>
              <h2 id="participants-heading" className="mt-2 text-xl font-black tracking-tight sm:text-2xl">이번 경기 참여자 기록</h2>
            </div>
            <span className="text-xs text-muted-foreground">전체 팀원 {detail.participants.length}명</span>
          </div>
          <dl className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border/60 bg-border/60 sm:grid-cols-4">
            {[
              ["팀 킬", detail.totals.kills], ["팀 딜", Math.round(detail.totals.damage)],
              ["기절", detail.totals.dbnos], ["소생", detail.totals.revives],
            ].map(([label, value]) => (
              <div key={label} className="bg-card px-5 py-4">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-2xl font-black tabular-nums">{value.toLocaleString("ko-KR")}</dd>
              </div>
            ))}
          </dl>
          <p className="mb-3 text-xs leading-5 text-muted-foreground">클랜원과 외부 팀원을 포함한 기록입니다. 각 참여자를 펼치면 상세 활동을 확인할 수 있습니다.</p>
          <RosterParticipantsTable participants={detail.participants} />
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-5 text-[10px] text-muted-foreground">
          <span>BOBO CLAN · MATCH ARCHIVE</span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="size-3" />
            {formatMapName(detail.match.mapName)} · {mode}
          </span>
        </footer>
      </div>
    </main>
  );
}
function formatRankStatus(rank: number) {
  return rank === 1 ? "WINNER WINNER" : rank <= 3 ? "TOP 3" : rank <= 10 ? "TOP 10" : "MATCH RESULT";
}
function formatDuration(value: number) {
  const seconds = Math.max(Math.round(value), 0);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
