import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeft,
  Car,
  Crosshair,
  Footprints,
  HeartPulse,
  Medal,
  Pill,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "최근 14일 클랜 칭호 | BOBO",
  description: "최근 14일 클랜 경기 기록으로 선정한 BOBO 클랜 칭호와 순위",
};

type AwardRanker = {
  playerId: string;
  name: string;
  value: string;
  detail: string;
};

type ClanAward = {
  id: string;
  code: string;
  title: string;
  description: string;
  metric: string;
  icon: LucideIcon;
  tone: "primary" | "info" | "kill" | "support" | "success";
  rankings: AwardRanker[];
};

const awards: ClanAward[] = [
  {
    id: "boost",
    code: "BOOST ADDICT",
    title: "약물 중독",
    description: "진통제, 에너지 드링크, 아드레날린을 판당 가장 많이 사용한 플레이어",
    metric: "판당 부스트",
    icon: Pill,
    tone: "primary",
    rankings: [
      { playerId: "p1", name: "178cm63kg31cm", value: "6.8", detail: "41경기 · 총 279회" },
      { playerId: "p2", name: "AGUBOBO", value: "6.2", detail: "38경기" },
      { playerId: "p3", name: "AinPAPA81", value: "5.9", detail: "35경기" },
      { playerId: "p4", name: "juha100", value: "5.5", detail: "32경기" },
    ],
  },
  {
    id: "revive",
    code: "FIELD MEDIC",
    title: "이머전시! 이머전시!",
    description: "기절한 팀원을 평균 많이 부활시킨 플레이어",
    metric: "판당 부활",
    icon: HeartPulse,
    tone: "support",
    rankings: [
      { playerId: "p2", name: "AGUBOBO", value: "1.24", detail: "38경기 · 총 47회" },
      { playerId: "p5", name: "jongjongse", value: "1.11", detail: "36경기" },
      { playerId: "p1", name: "178cm63kg31cm", value: "0.98", detail: "41경기" },
      { playerId: "p3", name: "AinPAPA81", value: "0.91", detail: "35경기" },
    ],
  },
  {
    id: "heal",
    code: "BANDAGE MUMMY",
    title: "맞은거 까먹기",
    description: "회복 아이템을 평균 많이 사용한 플레이어",
    metric: "판당 회복",
    icon: Activity,
    tone: "success",
    rankings: [
      { playerId: "p3", name: "AinPAPA81", value: "5.7", detail: "35경기 · 총 201회" },
      { playerId: "p4", name: "juha100", value: "5.3", detail: "32경기" },
      { playerId: "p2", name: "AGUBOBO", value: "5.1", detail: "38경기" },
      { playerId: "p5", name: "jongjongse", value: "4.8", detail: "36경기" },
    ],
  },
  {
    id: "dbno",
    code: "KNOCK FACTORY",
    title: "난 말로 안해",
    description: "킬 여부와 상관없이 상대를 가장 자주 바닥에 눕혔어.",
    metric: "판당 DBNO",
    icon: Crosshair,
    tone: "kill",
    rankings: [
      { playerId: "p4", name: "juha100", value: "2.91", detail: "32경기 · 총 93회" },
      { playerId: "p1", name: "178cm63kg31cm", value: "2.73", detail: "41경기" },
      { playerId: "p5", name: "jongjongse", value: "2.42", detail: "36경기" },
      { playerId: "p2", name: "AGUBOBO", value: "2.29", detail: "38경기" },
    ],
  },
  {
    id: "headshot",
    code: "HEAD HUNTER",
    title: "머리카락 보인다",
    description: "전체 킬 중 헤드샷 비율이 높은 플레이어.",
    metric: "헤드샷 비율",
    icon: Target,
    tone: "info",
    rankings: [
      { playerId: "p5", name: "jongjongse", value: "31.8%", detail: "총 66킬 · 헤드샷 21회" },
      { playerId: "p3", name: "AinPAPA81", value: "29.4%", detail: "총 51킬" },
      { playerId: "p1", name: "178cm63kg31cm", value: "27.7%", detail: "총 83킬" },
      { playerId: "p4", name: "juha100", value: "25.9%", detail: "총 81킬" },
    ],
  },
  {
    id: "longest-kill",
    code: "ONE SHOT",
    title: "한 발이면 충분해",
    description: "지난 14일 동안 가장 먼 거리에서 적을 처치.",
    metric: "최장거리 킬",
    icon: Trophy,
    tone: "primary",
    rankings: [
      { playerId: "p1", name: "178cm63kg31cm", value: "487m", detail: "MIRAMAR · SQUAD FPP" },
      { playerId: "p5", name: "jongjongse", value: "421m", detail: "ERANGEL" },
      { playerId: "p3", name: "AinPAPA81", value: "386m", detail: "TAEGO" },
      { playerId: "p2", name: "AGUBOBO", value: "344m", detail: "VIKENDI" },
    ],
  },
  {
    id: "driver",
    code: "DESIGNATED DRIVER",
    title: "프로 관전러",
    description: "팀원들 중 가장 빨리 죽은 비율.",
    metric: "판당 차량 이동",
    icon: Car,
    tone: "support",
    rankings: [
      { playerId: "p2", name: "AGUBOBO", value: "4.8km", detail: "38경기 · 총 182km" },
      { playerId: "p4", name: "juha100", value: "4.3km", detail: "32경기" },
      { playerId: "p1", name: "178cm63kg31cm", value: "3.9km", detail: "41경기" },
      { playerId: "p5", name: "jongjongse", value: "3.5km", detail: "36경기" },
    ],
  },
  {
    id: "walker",
    code: "ROAD WARRIOR",
    title: "짧고 굵게",
    description: "차량보다 두 다리를 믿고 판당 가장 오래 전장을 누볐어.",
    metric: "판당 도보 이동",
    icon: Footprints,
    tone: "success",
    rankings: [
      { playerId: "p3", name: "AinPAPA81", value: "3.1km", detail: "35경기 · 총 108km" },
      { playerId: "p5", name: "jongjongse", value: "2.9km", detail: "36경기" },
      { playerId: "p4", name: "juha100", value: "2.7km", detail: "32경기" },
      { playerId: "p1", name: "178cm63kg31cm", value: "2.6km", detail: "41경기" },
    ],
  },
];

const toneClasses = {
  primary: {
    icon: "border-primary/35 bg-primary/10 text-primary",
    glow: "bg-primary/8",
    value: "text-primary",
  },
  info: {
    icon: "border-info/35 bg-info/10 text-info",
    glow: "bg-info/8",
    value: "text-info",
  },
  kill: {
    icon: "border-kill/35 bg-kill/10 text-kill",
    glow: "bg-kill/8",
    value: "text-kill",
  },
  support: {
    icon: "border-support/35 bg-support/10 text-support",
    glow: "bg-support/8",
    value: "text-support",
  },
  success: {
    icon: "border-success/35 bg-success/10 text-success",
    glow: "bg-success/8",
    value: "text-success",
  },
};

export default function StatisticsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-xl">
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
        <div className="relative mx-auto grid max-w-360 gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-12 lg:py-24">
          <div>
            <p className="mb-4 flex items-center gap-2 text-[10px] font-black tracking-[0.27em] text-primary">
              <Sparkles className="size-3.5" /> 14 DAY HONORS
            </p>
            <h1 className="text-5xl font-black leading-[0.92] tracking-[-0.065em] sm:text-7xl">
              전장의 별명은
              <br />
              기록이 만든다
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-6 text-muted-foreground">
              최근 14일 클랜 경기에서 나온 기록을 판당 평균과 비율로 비교한
              BOBO 클랜 내부 명예의 전당이야.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-px self-end overflow-hidden rounded-sm border border-border/60 bg-border/60">
            <HeroMetric label="AWARDS" value="08" />
            <HeroMetric label="RANKED" value="04" />
            <HeroMetric label="WINDOW" value="14D" />
            <HeroMetric label="MIN MATCH" value="05" />
          </div>
        </div>
      </section>

      <section className="border-b border-border/50 bg-surface">
        <div className="mx-auto flex max-w-360 flex-wrap gap-2 px-5 py-5 sm:px-8 lg:px-12">
          <RuleBadge icon={ShieldCheck} text="클랜원 2명 이상 로스터" />
          <RuleBadge icon={Users} text="클랜원 기록만 집계" />
          <RuleBadge icon={Medal} text="최소 5경기 이상" />
          <RuleBadge icon={Activity} text="2026.08.12 — 2026.08.25" />
        </div>
      </section>

      <section className="mx-auto max-w-360 px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-black tracking-[0.24em] text-primary">
              CLAN AWARDS
            </p>
            <h2 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              최근 14일 칭호
            </h2>
          </div>
          <p className="max-w-sm text-xs leading-5 text-muted-foreground sm:text-right">
            1위는 칭호의 주인이 되고, 2위부터 4위까지는 다음 탈환 기회를 노려.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {awards.map((award) => (
            <AwardCard award={award} key={award.id} />
          ))}
        </div>
      </section>

      <footer className="border-t border-border/50 bg-surface">
        <div className="mx-auto flex max-w-360 flex-col gap-3 px-5 py-8 text-[9px] font-semibold tracking-wide text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span>BOBO CLAN · 14 DAY HONORS</span>
          <span>정적 화면용 샘플 데이터</span>
        </div>
      </footer>
    </main>
  );
}

function AwardCard({ award }: { award: ClanAward }) {
  const winner = award.rankings[0];
  const Icon = award.icon;
  const tone = toneClasses[award.tone];

  return (
    <article className="group relative overflow-hidden rounded-sm border border-border/60 bg-card transition-colors hover:border-primary/35">
      <div
        className={`pointer-events-none absolute -right-14 -top-14 size-40 rounded-full blur-3xl ${tone.glow}`}
      />
      <div className="relative border-b border-border/50 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[8px] font-black tracking-[0.22em] text-muted-foreground">
              {award.code}
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-[-0.04em]">
              {award.title}
            </h3>
          </div>
          <span className={`grid size-10 shrink-0 place-items-center rounded-sm border ${tone.icon}`}>
            <Icon className="size-4.5" />
          </span>
        </div>
        <p className="mt-4 min-h-10 text-[11px] leading-5 text-muted-foreground">
          {award.description}
        </p>

        <div className="mt-7 grid grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-3 rounded-sm border border-primary/20 bg-primary/[0.045] p-4">
          <span className="pb-1 font-mono text-[10px] font-black text-primary">01</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{winner.name}</p>
            <p className="mt-1 truncate text-[8px] font-bold tracking-wide text-muted-foreground">
              {winner.detail}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-black tracking-[-0.05em] ${tone.value}`}>
              {winner.value}
            </p>
            <p className="mt-1 text-[7px] font-black tracking-[0.13em] text-muted-foreground">
              {award.metric}
            </p>
          </div>
        </div>
      </div>

      <ol className="relative divide-y divide-border/45 px-5 sm:px-6">
        {award.rankings.slice(1).map((ranker, index) => (
          <li
            className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 py-3.5"
            key={ranker.playerId}
          >
            <span className="font-mono text-[9px] font-black text-foreground/30">
              {String(index + 2).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-black">{ranker.name}</p>
              <p className="mt-1 truncate text-[8px] text-muted-foreground">
                {ranker.detail}
              </p>
            </div>
            <strong className="text-sm font-black text-foreground/75">
              {ranker.value}
            </strong>
          </li>
        ))}
      </ol>
    </article>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card px-5 py-4">
      <p className="text-2xl font-black tracking-[-0.045em] text-primary">{value}</p>
      <p className="mt-1 text-[8px] font-black tracking-[0.15em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function RuleBadge({
  icon: Icon,
  text,
}: {
  icon: LucideIcon;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-sm border border-border/60 bg-card px-3 py-2 text-[9px] font-bold text-muted-foreground">
      <Icon className="size-3.5 text-primary" /> {text}
    </span>
  );
}
