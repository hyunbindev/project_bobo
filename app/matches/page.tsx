import { Activity, ArrowLeft, Clock3, Crosshair, Map, Trophy, Users } from "lucide-react";
import Link from "next/link";

import {
  RecentClanMatches,
  type RecentClanMatch,
} from "@/components/clan-dashboard/recent-clan-matches";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const chickenMatches: RecentClanMatch[] = [
  {
    id: "winner-erangel",
    map: "ERANGEL",
    mode: "경쟁전 · 스쿼드 FPP",
    rank: "#1",
    status: "WINNER WINNER",
    kills: 19,
    damage: "2,847",
    time: "24분 전",
    accent: "primary",
    members: [
      { id: "rush", name: "BOBO_RUSH", kills: 7, damage: 842 },
      { id: "178", name: "178cm63kg31cm", kills: 5, damage: 731 },
      { id: "cloud", name: "BOBO_CLOUD", kills: 4, damage: 682 },
      { id: "doha", name: "BOBO_Doha", kills: 3, damage: 592 },
    ],
  },
  {
    id: "winner-taego",
    map: "TAEGO",
    mode: "일반전 · 스쿼드 TPP",
    rank: "#1",
    status: "WINNER WINNER",
    kills: 16,
    damage: "2,431",
    time: "3일 전",
    accent: "primary",
    members: [
      { id: "178", name: "178cm63kg31cm", kills: 6, damage: 764 },
      { id: "cloud", name: "BOBO_CLOUD", kills: 4, damage: 621 },
      { id: "rush", name: "BOBO_RUSH", kills: 4, damage: 593 },
      { id: "doha", name: "BOBO_Doha", kills: 2, damage: 453 },
    ],
  },
  {
    id: "winner-rondo",
    map: "RONDO",
    mode: "경쟁전 · 스쿼드 FPP",
    rank: "#1",
    status: "WINNER WINNER",
    kills: 14,
    damage: "2,196",
    time: "6일 전",
    accent: "primary",
    members: [
      { id: "cloud", name: "BOBO_CLOUD", kills: 5, damage: 687 },
      { id: "rush", name: "BOBO_RUSH", kills: 4, damage: 581 },
      { id: "178", name: "178cm63kg31cm", kills: 3, damage: 514 },
      { id: "doha", name: "BOBO_Doha", kills: 2, damage: 414 },
    ],
  },
];

const matchHistory = [
  { id: "m1", map: "ERANGEL", mode: "경쟁전 · 스쿼드 FPP", rank: 1, kills: 19, damage: 2847, members: ["BOBO_RUSH", "178cm63kg31cm", "BOBO_CLOUD", "BOBO_Doha"], time: "24분 전" },
  { id: "m2", map: "TAEGO", mode: "일반전 · 스쿼드 TPP", rank: 3, kills: 11, damage: 1936, members: ["178cm63kg31cm", "BOBO_CLOUD", "BOBO_Doha", "BOBO_RUSH"], time: "1시간 전" },
  { id: "m3", map: "RONDO", mode: "경쟁전 · 스쿼드 FPP", rank: 7, kills: 8, damage: 1422, members: ["BOBO_CLOUD", "BOBO_RUSH", "178cm63kg31cm", "BOBO_Doha"], time: "어제" },
  { id: "m4", map: "MIRAMAR", mode: "경쟁전 · 스쿼드 FPP", rank: 12, kills: 6, damage: 1184, members: ["BOBO_RUSH", "178cm63kg31cm", "BOBO_CLOUD"], time: "2일 전" },
  { id: "m5", map: "TAEGO", mode: "일반전 · 스쿼드 TPP", rank: 1, kills: 16, damage: 2431, members: ["178cm63kg31cm", "BOBO_CLOUD", "BOBO_RUSH", "BOBO_Doha"], time: "3일 전" },
  { id: "m6", map: "DESTON", mode: "일반전 · 스쿼드 FPP", rank: 5, kills: 9, damage: 1678, members: ["BOBO_Doha", "BOBO_RUSH", "BOBO_CLOUD", "178cm63kg31cm"], time: "4일 전" },
  { id: "m7", map: "VIKENDI", mode: "경쟁전 · 스쿼드 FPP", rank: 9, kills: 7, damage: 1352, members: ["BOBO_CLOUD", "BOBO_Doha", "178cm63kg31cm", "BOBO_RUSH"], time: "5일 전" },
  { id: "m8", map: "RONDO", mode: "경쟁전 · 스쿼드 FPP", rank: 1, kills: 14, damage: 2196, members: ["BOBO_CLOUD", "BOBO_RUSH", "178cm63kg31cm", "BOBO_Doha"], time: "6일 전" },
];

const dbnosByMatch: Record<string, number> = {
  m1: 12,
  m2: 8,
  m3: 6,
  m4: 4,
  m5: 10,
  m6: 7,
  m7: 5,
  m8: 9,
};

export default function MatchesPage() {
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
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-sm bg-primary text-xs font-black text-primary-foreground">
              BB
            </span>
            <span className="text-sm font-black tracking-[0.18em]">BOBO</span>
          </div>
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
            최근 클랜 경기
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">
            BOBO 클랜원이 함께 출전한 경기 결과와 팀 퍼포먼스를 확인해.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-360 px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-black tracking-[0.24em] text-primary">
              CHICKEN DINNERS
            </p>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              최근 치킨 경기
            </h2>
          </div>
          <span className="hidden items-center gap-2 text-[10px] font-bold text-muted-foreground sm:flex">
            <Trophy className="size-4 text-primary" /> 최근 3경기
          </span>
        </div>

        <RecentClanMatches matches={chickenMatches} />
      </section>

      <section className="border-t border-border/50 bg-surface">
        <div className="mx-auto max-w-360 px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="mb-8">
            <p className="mb-2 text-[10px] font-black tracking-[0.24em] text-primary">
              ALL OPERATIONS
            </p>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              전체 경기 기록
            </h2>
          </div>

          <div className="overflow-hidden rounded-sm border border-border/60 bg-card">
            <div className="hidden grid-cols-[70px_minmax(160px,1fr)_90px_80px_100px_220px_80px] border-b border-border/60 px-6 py-3 text-[9px] font-black tracking-[0.16em] text-muted-foreground lg:grid">
              <span>RANK</span>
              <span>MAP / MODE</span>
              <span>TEAM KILLS</span>
              <span>DBNO</span>
              <span>DAMAGE</span>
              <span>MEMBERS</span>
              <span className="text-right">PLAYED</span>
            </div>

            <div className="divide-y divide-border/50">
              {matchHistory.map((match) => (
                <article
                  className="grid gap-4 px-5 py-5 transition-colors hover:bg-foreground/[0.025] lg:grid-cols-[70px_minmax(160px,1fr)_90px_80px_100px_220px_80px] lg:items-center lg:px-6"
                  key={match.id}
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
                      <Map className="size-3.5 text-primary" /> {match.map}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-muted-foreground">
                      {match.mode}
                    </p>
                  </div>

                  <MatchMetric icon={Crosshair} label="KILLS" value={match.kills} />
                  <MatchMetric icon={Activity} label="DBNO" value={dbnosByMatch[match.id]} />
                  <MatchMetric icon={Trophy} label="DMG" value={match.damage.toLocaleString()} />
                  <div>
                    <p className="mb-2 flex items-center gap-1 text-[9px] font-bold tracking-wider text-muted-foreground lg:hidden">
                      <Users className="size-3" /> PLAYERS
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {match.members.map((member) => (
                        <span
                          className="max-w-28 truncate rounded-sm bg-foreground/[0.055] px-2 py-1 text-[9px] font-bold text-muted-foreground"
                          key={member}
                          title={member}
                        >
                          {member}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground lg:justify-end">
                    <Clock3 className="size-3" /> {match.time}
                  </span>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-border/50 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] font-semibold text-muted-foreground">
              총 42경기 중 1–8경기
            </p>
            <Pagination className="mx-0 w-auto justify-start sm:justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="?page=1" text="이전" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    className="rounded-sm border-primary text-primary"
                    href="?page=1"
                    isActive
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink className="rounded-sm" href="?page=2">
                    2
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink className="rounded-sm" href="?page=3">
                    3
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink className="rounded-sm" href="?page=6">
                    6
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="?page=2" text="다음" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </section>
    </main>
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
