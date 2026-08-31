import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Car,
  CircleOff,
  Crosshair,
  Dices,
  Dumbbell,
  Eye,
  Flame,
  Footprints,
  HeartPulse,
  Pill,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { connection } from "next/server";

import { SiteHeader } from "@/components/clan-dashboard/site-header";
import {
  RankingCard,
  type RankingTheme,
} from "@/components/clan-rankings/ranking-card";
import { BoboKingCard } from "@/components/clan-rankings/bobo-king-card";
import type { RegularRankingCode } from "@/lib/rankings/types";
import { getMainClanSummary } from "@/lib/services/clan-service";
import { getWeeklyRankingPageData } from "@/lib/services/weekly-ranking-service";
import { formatKstDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "최근 일주일 랭킹 | BOBO",
  description: "이번 주 클랜 경기 기록으로 선정한 BOBO 클랜 랭킹과 순위",
};

// 아이콘과 색상은 UI 설정이므로 서비스가 아닌 화면 계층에서 관리한다.
const rankingThemes: Record<RegularRankingCode, RankingTheme> = {
  average_damage: {
    icon: Flame,
    accent: "text-kill",
    glow: "bg-kill/8",
    hoverBorder: "hover:border-kill/35",
  },
  damage_carry: {
    icon: Dumbbell,
    accent: "text-primary",
    glow: "bg-primary/8",
    hoverBorder: "hover:border-primary/35",
  },
  boost: {
    icon: Pill,
    accent: "text-primary",
    glow: "bg-primary/8",
    hoverBorder: "hover:border-primary/35",
  },
  revive: {
    icon: HeartPulse,
    accent: "text-support",
    glow: "bg-support/8",
    hoverBorder: "hover:border-support/35",
  },
  heal: {
    icon: Activity,
    accent: "text-success",
    glow: "bg-success/8",
    hoverBorder: "hover:border-success/35",
  },
  dbno: {
    icon: Crosshair,
    accent: "text-kill",
    glow: "bg-kill/8",
    hoverBorder: "hover:border-kill/35",
  },
  headshot: {
    icon: Target,
    accent: "text-info",
    glow: "bg-info/8",
    hoverBorder: "hover:border-info/35",
  },
  max_kills: {
    icon: Trophy,
    accent: "text-primary",
    glow: "bg-primary/8",
    hoverBorder: "hover:border-primary/35",
  },
  kill_deviation: {
    icon: Dices,
    accent: "text-kill",
    glow: "bg-kill/8",
    hoverBorder: "hover:border-kill/35",
  },
  no_weapon: {
    icon: CircleOff,
    accent: "text-support",
    glow: "bg-support/8",
    hoverBorder: "hover:border-support/35",
  },
  zero_damage: {
    icon: CircleOff,
    accent: "text-support",
    glow: "bg-support/8",
    hoverBorder: "hover:border-support/35",
  },
  spectator: {
    icon: Eye,
    accent: "text-info",
    glow: "bg-info/8",
    hoverBorder: "hover:border-info/35",
  },
  driver: {
    icon: Car,
    accent: "text-support",
    glow: "bg-support/8",
    hoverBorder: "hover:border-support/35",
  },
  walker: {
    icon: Footprints,
    accent: "text-success",
    glow: "bg-success/8",
    hoverBorder: "hover:border-success/35",
  },
};

export default async function RankingPage() {
  // 이번 주 기간과 DB 집계를 요청 시점 기준으로 갱신한다.
  await connection();

  const mainClan = await getMainClanSummary();
  const data = await getWeeklyRankingPageData(mainClan?.id ?? null);
  const periodLabel = `${formatKstDate(data.period.startAt)} ~ ${formatKstDate(
    new Date(data.period.endAt.getTime() - 1),
  )}`;

  return (
    <main className="min-h-screen bg-background pt-18 text-foreground">
      <SiteHeader
        clanName={mainClan?.name ?? "BOBO"}
        clanTag={mainClan?.tag ?? "BOBO"}
      />

      <section className="relative overflow-hidden border-b border-border/50">
        <div className="hero-grid absolute inset-0 opacity-25" />
        <div className="hero-glow absolute -left-40 top-0 size-96 rounded-full" />
        <div className="relative mx-auto grid max-w-360 gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-12 lg:py-24">
          <div>
            <p className="mb-4 flex items-center gap-2 text-[10px] font-black tracking-[0.27em] text-primary">
              <Sparkles className="size-3.5" /> WEEKLY RANKING
            </p>
            <h1 className="text-5xl font-black leading-[0.92] tracking-[-0.065em] sm:text-7xl">
              <span className="military-glitch" data-text="BOBO">
                BOBO
              </span>
              <br />
              <span
                className="military-glitch military-glitch-primary text-primary"
                data-text="WEEKLY RANKING"
              >
                WEEKLY RANKING
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-6 text-muted-foreground">
              {periodLabel}
              <br />
              매주 월요일 초기화
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/50 bg-surface">
        <div className="mx-auto flex max-w-360 flex-wrap gap-2 px-5 py-5 sm:px-8 lg:px-12">
          <RuleBadge icon={ShieldCheck} text="클랜원 2명 이상 로스터" />
          <RuleBadge icon={Users} text="클랜원 기록만 집계" />
          <RuleBadge icon={Activity} text={periodLabel} />
        </div>
      </section>

      <section className="mx-auto max-w-360 px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-black tracking-[0.24em] text-primary">
              CLAN RANKINGS
            </p>
            <h2 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              이번주 랭킹
            </h2>
          </div>
          <p className="max-w-sm text-xs leading-5 text-muted-foreground sm:text-right">
            매주 월요일에 갱신되는 랭킹입니다.
          </p>
        </div>

        <BoboKingCard ranking={data.boboKing} />

        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {data.rankings.map((ranking) => (
            <RankingCard
              ranking={ranking}
              key={ranking.code}
              theme={rankingThemes[ranking.code]}
            />
          ))}
        </div>
      </section>

      <footer className="border-t border-border/50 bg-surface">
        <div className="mx-auto flex max-w-360 flex-col gap-3 px-5 py-8 text-[9px] font-semibold tracking-wide text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span>BOBO CLAN · WEEKLY RANKING</span>
          <span>CURRENT WEEK DATA</span>
        </div>
      </footer>
    </main>
  );
}

function RuleBadge({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-sm border border-border/60 bg-card px-3 py-2 text-[9px] font-bold text-muted-foreground">
      <Icon className="size-3.5 text-primary" /> {text}
    </span>
  );
}
