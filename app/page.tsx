import { ArrowUpRight, Crosshair, Crown, Users } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";

import { ClanJoinModal } from "@/components/clan-dashboard/clan-join-modal";
import { RecentClanMatches } from "@/components/clan-dashboard/recent-clan-matches";
import { SiteHeader } from "@/components/clan-dashboard/site-header";
import { AnimatedRankingValue } from "@/components/clan-rankings/animated-ranking-value";
import { getMainClanSummary } from "@/lib/services/clan-service";
import { getRecentWonMatches } from "@/lib/services/match-service";
import { getCurrentBoboKingRanking } from "@/lib/services/weekly-ranking-service";

export default async function Home() {
  // DB 값은 빌드 시점이 아니라 실제 페이지 요청 시점에 조회한다.
  await connection();
  const clan = await getMainClanSummary();
  const [recentWonMatches, currentBoboKing] = await Promise.all([
    getRecentWonMatches(3),
    getCurrentBoboKingRanking(clan?.id ?? null),
  ]);
  const clanName = clan?.name ?? "BOBO";
  const clanTag = clan?.tag ?? "BOBO";
  const clanMark = clanTag.slice(0, 2).toUpperCase();
  const mainClanStats = [
    {
      label: "클랜원",
      value: String(clan?.memberCount ?? 0),
      unit: "명",
      icon: Users,
    },
    {
      label: "클랜 레벨",
      value: String(clan?.level ?? 0),
      unit: "LV",
      icon: Crosshair,
    }
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <SiteHeader clanName={clanName} clanTag={clanTag} />

      <section id="top" className="relative border-b border-border/50 pt-18">
        <div
          className="hero-grid absolute inset-0 opacity-30"
          aria-hidden="true"
        />
        <div
          className="hero-glow absolute -left-48 top-20 size-130 rounded-full"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid min-h-172.5 max-w-360 items-center gap-16 px-5 py-16 sm:px-8 lg:grid-cols-[1.06fr_.94fr] lg:px-12 lg:py-20">
          <div className="relative z-10 max-w-3xl">
            <div className="mb-8 flex items-center gap-3 text-[11px] font-bold tracking-[0.2em] text-primary">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              KAKAO SERVER · {clanTag} CLAN ONLINE
            </div>

            <p className="mb-3 font-mono text-xs font-semibold tracking-[0.34em] text-muted-foreground">
              EST. 2024 / KR
            </p>
            <h1 className="max-w-195 text-[clamp(3.5rem,8vw,7.4rem)] font-black leading-[0.84] tracking-[-0.075em]">
              <span className="military-glitch" data-text={clanTag}>
                {clanTag}
              </span>
              <br />
              <span
                className="military-glitch military-glitch-primary text-primary"
                data-text={clanName}
              >
                {clanName}
              </span>
            </h1>

            <div
              className="mt-10 flex scroll-mt-24 flex-wrap items-center gap-3"
              id="notice"
            >
              <ClanJoinModal />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/50 bg-surface">
        <div className="mx-auto grid max-w-360 grid-cols-2 px-5 sm:px-8 lg:grid-cols-3 lg:px-12">
          {mainClanStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`group flex min-h-36 items-center gap-4 border-border/50 py-7 sm:px-6 ${index % 2 === 0 ? "border-r" : ""} lg:border-r lg:last:border-r-0`}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-4.5" />
                </span>
                <div>
                  <p className="text-2xl font-black tracking-tight sm:text-3xl">
                    {stat.value}
                    <span className="ml-1 text-sm text-primary">
                      {stat.unit}
                    </span>
                  </p>
                  <p className="mt-1 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="squad" className="border-y border-border/50 bg-surface">
        <div className="mx-auto grid max-w-360 gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[.72fr_1.28fr] lg:px-12 lg:py-32">
          <div>
            <p className="mb-4 text-[10px] font-black tracking-[0.28em] text-primary">
              WEEKLY BOBOKING
            </p>
            <h2 className="text-4xl font-black leading-none tracking-[-0.055em] sm:text-5xl">
              이번 주<br />
              BOBOKING
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-6 text-muted-foreground">
              킬, 기절, 대미지를 합산한 이번 주 클랜원 종합 순위입니다.
            </p>
            <div className="mt-10 inline-flex items-center gap-2 border-l-2 border-primary pl-4 text-xs font-bold text-foreground">
              <Crown className="size-4 text-primary" />{" "}
              {formatRankingPeriod(
                currentBoboKing.period.startAt,
                currentBoboKing.period.endAt,
              )}
            </div>
          </div>

          <div className="divide-y divide-border/50 border-y border-border/50">
            {currentBoboKing.ranking.rankings.length === 0 && (
              <p className="py-14 text-center text-xs font-bold text-muted-foreground">
                집계 조건을 충족한 기록이 없습니다.
              </p>
            )}
            {currentBoboKing.ranking.rankings.map((player) => (
              <Link
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-5 sm:grid-cols-[64px_1fr_auto_auto] sm:gap-6"
                href={`/members/${player.playerId}`}
                key={player.playerId}
              >
                <span className="hidden font-mono text-xs font-bold text-foreground/25 sm:block">
                  {String(player.rank).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black sm:text-base">
                    {player.playerName}
                  </h3>
                  <p className="mt-1 text-[9px] font-bold tracking-[0.2em] text-muted-foreground">
                    BOBO CLAN MEMBER
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-lg font-black">{player.matchCount}</p>
                  <p className="text-[9px] font-bold tracking-widest text-muted-foreground">
                    MATCHES
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-primary">
                    <AnimatedRankingValue
                      unit={currentBoboKing.ranking.unit}
                      value={player.value}
                    />
                  </p>
                  <p className="text-[9px] font-bold tracking-widest text-muted-foreground">
                    BOBO POINT
                  </p>
                </div>
              </Link>
            ))}
            <div className="py-5 text-right">
              <Link
                className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
                href="/ranking"
              >
                랭킹 더보기 <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        id="matches"
        className="mx-auto max-w-360 px-5 py-24 sm:px-8 lg:px-12 lg:py-32"
      >
        <SectionHeading
          eyebrow="RECENT OPERATIONS"
          title="최근 치킨 게임"
          description="함께 출전한 스쿼드 경기와 팀 퍼포먼스를 한눈에 확인하세요."
        />
        <RecentClanMatches matches={recentWonMatches} />
        <div className="mt-7 text-right">
          <Link
            href="/matches"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
          >
            전체 경기 기록 <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/50 bg-surface-deep">
        <div className="mx-auto flex max-w-360 flex-col gap-6 px-5 py-8 text-xs text-muted-foreground sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-sm bg-primary text-[10px] font-black text-primary-foreground">
              {clanMark}
            </span>
            <span className="font-bold tracking-[0.16em] text-foreground">
              {clanName} CLAN
            </span>
          </div>
          <p className="font-mono text-[10px]">
            © 178cm63kg31cm. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-3 text-[10px] font-black tracking-[0.28em] text-primary">
          {eyebrow}
        </p>
        <h2 className="text-4xl font-black tracking-[-0.055em] sm:text-5xl">
          {title}
        </h2>
      </div>
      <p className="max-w-md text-sm leading-6 text-muted-foreground md:text-right">
        {description}
      </p>
    </div>
  );
}

function formatRankingPeriod(startAt: Date, endAt: Date) {
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
  });

  return `${formatter.format(startAt)} — ${formatter.format(new Date(endAt.getTime() - 1))}`;
}
