import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Crown,
  History,
  Trophy,
} from "lucide-react";

import { SiteHeader } from "@/components/clan-dashboard/site-header";
import { getMainClanSummary } from "@/lib/services/clan-service";

export const metadata: Metadata = {
  title: "지난 랭킹 기록 | BOBO",
  description: "주차별 BOBO 클랜 랭킹 기록",
};

const weeklyRecords = [
  {
    period: "2026.08.24 ~ 2026.08.30",
    week: "8월 5주차",
    king: "Yjjjjjjjjj-",
    highlight: "평균 딜량 1위 · 284.6",
    status: "집계 완료",
  },
  {
    period: "2026.08.17 ~ 2026.08.23",
    week: "8월 4주차",
    king: "sodoqldoal",
    highlight: "최다 킬 1위 · 6킬",
    status: "집계 완료",
  },
  {
    period: "2026.08.10 ~ 2026.08.16",
    week: "8월 3주차",
    king: "BOBOShort",
    highlight: "팀 기여도 1위 · 47.2%",
    status: "집계 완료",
  },
  {
    period: "2026.08.03 ~ 2026.08.09",
    week: "8월 2주차",
    king: "Leekwangju_",
    highlight: "부활 횟수 1위 · 18회",
    status: "집계 완료",
  },
] as const;

export default async function RankingHistoryPage() {
  await connection();

  const mainClan = await getMainClanSummary();

  return (
    <main className="min-h-screen bg-background pt-18 text-foreground">
      <SiteHeader
        clanName={mainClan?.name ?? "BOBO"}
        clanTag={mainClan?.tag ?? "BOBO"}
      />

      <section className="relative overflow-hidden border-b border-border/50">
        <div className="hero-grid absolute inset-0 opacity-25" />
        <div className="hero-glow absolute -left-40 top-0 size-96 rounded-full" />
        <div className="relative mx-auto max-w-360 px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <Link
            className="mb-7 inline-flex items-center gap-2 text-[10px] font-black tracking-[0.12em] text-muted-foreground transition-colors hover:text-primary"
            href="/ranking"
          >
            <ArrowLeft className="size-3.5" /> 현재 랭킹으로 돌아가기
          </Link>

          <p className="mb-4 flex items-center gap-2 text-[10px] font-black tracking-[0.27em] text-primary">
            <History className="size-3.5" /> RANKING ARCHIVE
          </p>
          <h1 className="text-4xl font-black tracking-[-0.055em] sm:text-6xl">
            지난 랭킹 기록
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">
            매주 확정된 클랜 랭킹을 주차별로 확인할 수 있습니다.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-360 px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-black tracking-[0.22em] text-primary">
              WEEKLY RECORDS
            </p>
            <h2 className="text-2xl font-black tracking-[-0.035em] sm:text-3xl">
              주차별 기록
            </h2>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground">
            총 {weeklyRecords.length}주
          </span>
        </div>

        <div className="overflow-hidden rounded-sm border border-border/70 bg-card">
          {weeklyRecords.map((record, index) => (
            <article
              className="group grid gap-5 border-b border-border/60 p-5 last:border-b-0 sm:grid-cols-[minmax(150px,0.8fr)_minmax(180px,1fr)_auto] sm:items-center sm:p-6"
              key={record.period}
            >
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <CalendarDays className="size-3.5 text-primary" />
                  <span className="text-[10px] font-black tracking-[0.12em] text-primary">
                    {record.week}
                  </span>
                  {index === 0 && (
                    <span className="rounded-sm bg-primary/10 px-2 py-1 text-[8px] font-black text-primary">
                      LATEST
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {record.period}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-primary/25 bg-primary/8 text-primary">
                  <Crown className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] font-black tracking-[0.14em] text-muted-foreground">
                    BOBO KING
                  </p>
                  <p className="truncate text-sm font-black">{record.king}</p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">
                    {record.highlight}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-success">
                  <Trophy className="size-3" /> {record.status}
                </span>
                <button
                  aria-label={`${record.week} 랭킹 상세 보기`}
                  className="inline-flex size-9 items-center justify-center rounded-sm border border-border/70 text-muted-foreground transition-colors group-hover:border-primary/35 group-hover:text-primary"
                  type="button"
                >
                  <ArrowUpRight className="size-4" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-4 text-[10px] leading-5 text-muted-foreground">
          현재는 화면 구성을 확인하기 위한 예시 데이터입니다. 기록 저장 기능을 연결하면 확정된 주간 랭킹이 이 목록에 추가됩니다.
        </p>
      </section>

      <footer className="border-t border-border/50 bg-surface">
        <div className="mx-auto flex max-w-360 flex-col gap-3 px-5 py-8 text-[9px] font-semibold tracking-wide text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span>BOBO CLAN · RANKING ARCHIVE</span>
          <span>WEEKLY SNAPSHOTS</span>
        </div>
      </footer>
    </main>
  );
}
