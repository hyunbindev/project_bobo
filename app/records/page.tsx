import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  History,
  Radio,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import { SiteHeader } from "@/components/clan-dashboard/site-header";
import {
  RankingTrendChart,
  type RankingTrend,
} from "@/components/clan-records/ranking-trend-chart";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "주간 랭킹 기록 | BOBO",
  description: "BOBO 클랜의 주차별 랭킹 변화와 순위 추이",
};

const playerColors = {
  agubobo: "var(--primary)",
  oneSevenEight: "var(--info)",
  juha: "var(--kill)",
  jongjongse: "var(--support)",
} as const;

const boboKingTrend: RankingTrend = {
  code: "bobo_king",
  label: "BOBOKING · RANK MOVEMENT",
  title: "주간 BOBOKING 순위 추이",
  description:
    "최근 6주간 종합 전투 지수 순위입니다. 그래프 위쪽일수록 높은 순위입니다.",
  players: [
    { key: "agubobo", name: "AGUBOBO", color: playerColors.agubobo },
    {
      key: "oneSevenEight",
      name: "178cm63kg31cm",
      color: playerColors.oneSevenEight,
    },
    { key: "juha", name: "juha100", color: playerColors.juha },
    {
      key: "jongjongse",
      name: "jongjongse",
      color: playerColors.jongjongse,
    },
  ],
  points: [
    {
      week: "W30",
      agubobo: 4,
      oneSevenEight: 1,
      juha: 3,
      jongjongse: null,
    },
    { week: "W31", agubobo: 3, oneSevenEight: 1, juha: 4, jongjongse: 6 },
    { week: "W32", agubobo: 5, oneSevenEight: 2, juha: 3, jongjongse: 4 },
    { week: "W33", agubobo: 4, oneSevenEight: 2, juha: 1, jongjongse: 5 },
    {
      week: "W34",
      agubobo: 3,
      oneSevenEight: 1,
      juha: 3,
      jongjongse: null,
    },
    { week: "W35", agubobo: 1, oneSevenEight: 2, juha: 3, jongjongse: 4 },
  ],
};

const rankingTrends: RankingTrend[] = [
  {
    code: "average_damage",
    label: "DAMAGE DEALER",
    title: "평균 대미지 순위",
    description: "판당 평균 대미지 기준 주차별 순위",
    players: boboKingTrend.players,
    points: [
      { week: "W30", agubobo: 3, oneSevenEight: 1, juha: 5, jongjongse: 6 },
      { week: "W31", agubobo: 2, oneSevenEight: 1, juha: 4, jongjongse: 5 },
      { week: "W32", agubobo: 4, oneSevenEight: 2, juha: 3, jongjongse: 5 },
      { week: "W33", agubobo: 3, oneSevenEight: 1, juha: 4, jongjongse: 6 },
      { week: "W34", agubobo: 2, oneSevenEight: 1, juha: 5, jongjongse: 4 },
      { week: "W35", agubobo: 1, oneSevenEight: 2, juha: 3, jongjongse: 4 },
    ],
  },
  {
    code: "dbno",
    label: "KNOCK FACTORY",
    title: "DBNO 순위",
    description: "판당 DBNO 기준 주차별 순위",
    players: [
      boboKingTrend.players[2],
      boboKingTrend.players[1],
      boboKingTrend.players[3],
      boboKingTrend.players[0],
    ],
    points: [
      { week: "W30", juha: 2, oneSevenEight: 5, jongjongse: null, agubobo: 3 },
      { week: "W31", juha: 1, oneSevenEight: 4, jongjongse: 6, agubobo: 3 },
      { week: "W32", juha: 1, oneSevenEight: 3, jongjongse: 5, agubobo: 2 },
      { week: "W33", juha: 2, oneSevenEight: 3, jongjongse: 4, agubobo: 1 },
      { week: "W34", juha: 1, oneSevenEight: 4, jongjongse: null, agubobo: 2 },
      { week: "W35", juha: 1, oneSevenEight: 2, jongjongse: 3, agubobo: 4 },
    ],
  },
  {
    code: "headshot",
    label: "HEAD HUNTER",
    title: "헤드샷 순위",
    description: "전체 킬 대비 헤드샷 비율 주차별 순위",
    players: [
      boboKingTrend.players[3],
      boboKingTrend.players[1],
      boboKingTrend.players[0],
      boboKingTrend.players[2],
    ],
    points: [
      { week: "W30", jongjongse: 5, oneSevenEight: 3, agubobo: 2, juha: 4 },
      { week: "W31", jongjongse: 4, oneSevenEight: 2, agubobo: 3, juha: 5 },
      { week: "W32", jongjongse: 3, oneSevenEight: 1, agubobo: 4, juha: 2 },
      { week: "W33", jongjongse: 4, oneSevenEight: 2, agubobo: 3, juha: 1 },
      { week: "W34", jongjongse: 3, oneSevenEight: 2, agubobo: 4, juha: 1 },
      { week: "W35", jongjongse: 1, oneSevenEight: 3, agubobo: 4, juha: 2 },
    ],
  },
  {
    code: "revive",
    label: "FIELD MEDIC",
    title: "부활 순위",
    description: "판당 팀원 부활 횟수 주차별 순위",
    players: [
      boboKingTrend.players[3],
      boboKingTrend.players[2],
      boboKingTrend.players[0],
      boboKingTrend.players[1],
    ],
    points: [
      { week: "W30", jongjongse: 6, juha: 2, agubobo: 4, oneSevenEight: 3 },
      { week: "W31", jongjongse: 5, juha: 2, agubobo: 4, oneSevenEight: 3 },
      { week: "W32", jongjongse: 4, juha: 1, agubobo: 3, oneSevenEight: 2 },
      { week: "W33", jongjongse: 3, juha: 2, agubobo: 5, oneSevenEight: 1 },
      { week: "W34", jongjongse: 5, juha: 2, agubobo: 4, oneSevenEight: 1 },
      { week: "W35", jongjongse: 2, juha: 3, agubobo: 4, oneSevenEight: 1 },
    ],
  },
];

export default function RecordsPage() {
  return (
    <main className="min-h-screen bg-background pt-18 text-foreground">
      <SiteHeader clanName="BOBO" clanTag="BOBO" />

      <section className="relative overflow-hidden border-b border-border/50">
        <div className="hero-grid absolute inset-0 opacity-25" />
        <div className="hero-glow absolute -left-40 top-0 size-96 rounded-full" />
        <div className="relative mx-auto max-w-360 px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <p className="mb-4 flex items-center gap-2 text-[10px] font-black tracking-[0.27em] text-primary">
            <History className="size-3.5" /> RANKING ARCHIVE
          </p>
          <h1 className="text-5xl font-black leading-[0.92] tracking-[-0.065em] sm:text-7xl">
            <span className="military-glitch" data-text="RANKING">
              RANKING
            </span>
            <br />
            <span
              className="military-glitch military-glitch-primary text-primary"
              data-text="HISTORY"
            >
              HISTORY
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-6 text-muted-foreground">
            주차별 순위선을 통해 상승세와 하락세를 추적합니다.
          </p>
        </div>
      </section>

      <section className="border-b border-border/50 bg-surface">
        <div className="mx-auto flex max-w-360 flex-col gap-4 px-5 py-5 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-sm border border-primary/30 bg-primary/10 text-primary">
              <CalendarDays className="size-4.5" />
            </span>
            <div>
              <p className="text-[8px] font-black tracking-[0.23em] text-muted-foreground">
                LATEST FINALIZED WEEK
              </p>
              <p className="mt-1 text-sm font-black">
                2026.08.24 — 2026.08.30
              </p>
            </div>
            <span className="rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[8px] font-black tracking-wider text-success">
              FINAL
            </span>
          </div>
          <div className="flex gap-2">
            <Link
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
              )}
              href="/records?week=2026-08-17"
            >
              <ArrowLeft /> 이전 주
            </Link>
            <Button disabled size="sm" variant="outline">
              다음 주 <ArrowRight />
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border/50">
        <div className="mx-auto grid max-w-360 sm:grid-cols-3 sm:px-8 lg:px-12">
          <SummaryMetric
            detail="AGUBOBO · BOBOKING"
            icon={TrendingUp}
            label="BIGGEST CLIMB"
            value="▲ 2"
          />
          <SummaryMetric
            detail="최근 6주 순위 기록"
            icon={ChartNoAxesCombined}
            label="TRACKED WEEKS"
            value="06"
          />
          <SummaryMetric
            detail="현재 주차는 실시간 집계"
            icon={Radio}
            label="LIVE STATUS"
            value="ON"
          />
        </div>
      </section>

      <section className="mx-auto max-w-360 px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[9px] font-black tracking-[0.24em] text-primary">
              <Sparkles className="size-3" /> SIX WEEK MOVEMENT
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              주차별 랭킹 그래프
            </h2>
          </div>
          <Link
            className="text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
            href="/ranking"
          >
            이번 주 실시간 랭킹 보기 →
          </Link>
        </div>

        <RankingTrendChart featured ranking={boboKingTrend} />

        <div className="mt-6 grid gap-5">
          {rankingTrends.map((ranking) => (
            <RankingTrendChart key={ranking.code} ranking={ranking} />
          ))}
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-sm border border-border/60 bg-surface px-4 py-4 text-[10px] leading-5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            각 점은 해당 주차의 확정 순위입니다. 위로 움직일수록 순위 상승,
            선이 끊긴 구간은 최소 경기 수 미달 또는 순위권 밖을 의미합니다.
          </p>
        </div>
      </section>

      <footer className="border-t border-border/50 bg-surface">
        <div className="mx-auto flex max-w-360 flex-col gap-3 px-5 py-8 text-[9px] font-semibold tracking-wide text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span>BOBO CLAN · RANKING ARCHIVE</span>
          <span>STATIC PREVIEW · SIX WEEK TREND</span>
        </div>
      </footer>
    </main>
  );
}

function SummaryMetric({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string;
  icon: typeof TrendingUp;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-30 items-center gap-4 border-b border-border/50 px-5 py-6 sm:border-b-0 sm:border-r sm:px-6 last:sm:border-r-0">
      <span className="grid size-10 shrink-0 place-items-center rounded-sm border border-border/70 bg-card text-primary">
        <Icon className="size-4.5" />
      </span>
      <div>
        <p className="text-[8px] font-black tracking-[0.22em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-2xl font-black tracking-[-0.04em]">{value}</p>
        <p className="mt-1 text-[9px] font-semibold text-muted-foreground">
          {detail}
        </p>
      </div>
    </div>
  );
}
