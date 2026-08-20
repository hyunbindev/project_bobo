import {
  ArrowUpRight,
  ChevronRight,
  Clock3,
  Crosshair,
  Crown,
  Radio,
  Shield,
  Target,
  Trophy,
  Users,
} from "lucide-react";

const clanStats = [
  { label: "클랜원", value: "28", unit: "명", icon: Users },
  { label: "이번 시즌 치킨", value: "14", unit: "회", icon: Trophy },
  { label: "평균 K/D", value: "3.42", unit: "", icon: Crosshair },
  { label: "TOP 10", value: "37.8", unit: "%", icon: Target },
];

const recentMatches = [
  { map: "ERANGEL", mode: "경쟁전 · 스쿼드 FPP", rank: "#1", status: "WINNER WINNER", kills: 19, damage: "2,847", time: "24분 전", accent: "primary" },
  { map: "TAEGO", mode: "일반전 · 스쿼드 TPP", rank: "#3", status: "TOP 3", kills: 11, damage: "1,936", time: "1시간 전", accent: "info" },
  { map: "RONDO", mode: "경쟁전 · 스쿼드 FPP", rank: "#7", status: "TOP 10", kills: 8, damage: "1,422", time: "어제", accent: "support" },
];

const mvpPlayers = [
  { rank: "01", name: "BOBO_RUSH", role: "ENTRY", kd: "4.86", damage: "512", initials: "BR" },
  { rank: "02", name: "178cm63kg31cm", role: "IGL", kd: "4.21", damage: "468", initials: "17" },
  { rank: "03", name: "BOBO_CLOUD", role: "SUPPORT", kd: "3.97", damage: "431", initials: "BC" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-360 items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="#top" className="group flex items-center gap-3" aria-label="BOBO 클랜 홈">
            <span className="grid size-9 place-items-center rounded-sm bg-primary text-xs font-black tracking-[-0.08em] text-primary-foreground transition-transform group-hover:-rotate-3">BB</span>
            <span>
              <span className="block text-sm font-black tracking-[0.2em]">BOBO</span>
              <span className="block text-[9px] font-semibold tracking-[0.28em] text-muted-foreground">BATTLEGROUNDS</span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-muted-foreground md:flex" aria-label="주요 메뉴">
            <a href="#top" className="text-foreground transition-colors hover:text-primary">홈</a>
            <a href="#squad" className="transition-colors hover:text-primary">클랜원</a>
            <a href="#matches" className="transition-colors hover:text-primary">최근 경기</a>
            <a href="#records" className="transition-colors hover:text-primary">기록실</a>
          </nav>

          <a href="#notice" className="inline-flex h-9 items-center gap-2 rounded-sm border border-primary/50 px-4 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
            클랜 안내 <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </header>

      <section id="top" className="relative border-b border-border/50 pt-18">
        <div className="hero-grid absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="hero-glow absolute -left-48 top-20 size-[520px] rounded-full" aria-hidden="true" />
        <div className="relative mx-auto grid min-h-[690px] max-w-360 items-center gap-16 px-5 py-16 sm:px-8 lg:grid-cols-[1.06fr_.94fr] lg:px-12 lg:py-20">
          <div className="relative z-10 max-w-3xl">
            <div className="mb-8 flex items-center gap-3 text-[11px] font-bold tracking-[0.2em] text-primary">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              KAKAO SERVER · CLAN ONLINE
            </div>

            <p className="mb-3 font-mono text-xs font-semibold tracking-[0.34em] text-muted-foreground">EST. 2024 / KR</p>
            <h1 className="max-w-[780px] text-[clamp(3.5rem,8vw,7.4rem)] font-black leading-[0.84] tracking-[-0.075em]">
              DROP<br /><span className="text-primary">TOGETHER.</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              같이 내리고, 끝까지 살아남는다. 전적과 순간을 기록하는
              <span className="font-semibold text-foreground"> BOBO 클랜 공식 아지트.</span>
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a href="#matches" className="inline-flex h-12 items-center gap-3 rounded-sm bg-primary px-6 text-sm font-black text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary-hover">
                클랜 전적 보기 <ChevronRight className="size-4" />
              </a>
            </div>
          </div>

        </div>
      </section>

      <section className="border-b border-border/50 bg-surface">
        <div className="mx-auto grid max-w-360 grid-cols-2 px-5 sm:px-8 lg:grid-cols-4 lg:px-12">
          {clanStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`group flex min-h-36 items-center gap-4 border-border/50 py-7 sm:px-6 ${index % 2 === 0 ? "border-r" : ""} lg:border-r lg:last:border-r-0`}>
                <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="size-4.5" /></span>
                <div><p className="text-2xl font-black tracking-tight sm:text-3xl">{stat.value}<span className="ml-1 text-sm text-primary">{stat.unit}</span></p><p className="mt-1 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground">{stat.label}</p></div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="matches" className="mx-auto max-w-360 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <SectionHeading eyebrow="RECENT OPERATIONS" title="최근 클랜 경기" description="함께 출전한 스쿼드 경기와 팀 퍼포먼스를 한눈에 확인하세요." />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {recentMatches.map((match) => (
            <article key={`${match.map}-${match.time}`} className="match-card group relative overflow-hidden rounded-sm border border-border/60 bg-card p-6 transition-all hover:-translate-y-1 hover:border-border">
              <div className={`match-glow match-glow-${match.accent}`} aria-hidden="true" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div><span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground">{match.mode}</span><h3 className="mt-2 text-2xl font-black tracking-tight">{match.map}</h3></div>
                  <span className={`rank rank-${match.accent}`}>{match.rank}</span>
                </div>
                <div className="mt-14 grid grid-cols-2 gap-4 border-t border-border/50 pt-5"><MiniStat label="TEAM KILLS" value={String(match.kills)} /><MiniStat label="DAMAGE" value={match.damage} /></div>
                <div className="mt-6 flex items-center justify-between text-[11px] font-semibold"><span className={`status status-${match.accent}`}>{match.status}</span><span className="flex items-center gap-1.5 text-muted-foreground"><Clock3 className="size-3" />{match.time}</span></div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-7 text-right"><a href="#" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground transition-colors hover:text-primary">전체 경기 기록 <ArrowUpRight className="size-3.5" /></a></div>
      </section>

      <section id="squad" className="border-y border-border/50 bg-surface">
        <div className="mx-auto grid max-w-360 gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[.72fr_1.28fr] lg:px-12 lg:py-32">
          <div>
            <p className="mb-4 text-[10px] font-black tracking-[0.28em] text-primary">SEASON MVP</p>
            <h2 className="text-4xl font-black leading-none tracking-[-0.055em] sm:text-5xl">이번 시즌을<br />지배한 플레이어</h2>
            <p className="mt-6 max-w-sm text-sm leading-6 text-muted-foreground">경쟁전 스쿼드 기준 K/D와 평균 대미지를 반영한 클랜 내부 랭킹입니다.</p>
            <div className="mt-10 inline-flex items-center gap-2 border-l-2 border-primary pl-4 text-xs font-bold text-foreground"><Crown className="size-4 text-primary" /> SEASON 42 · WEEK 03</div>
          </div>

          <div className="divide-y divide-border/50 border-y border-border/50">
            {mvpPlayers.map((player) => (
              <article key={player.name} className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-5 sm:grid-cols-[64px_64px_1fr_auto_auto] sm:gap-6">
                <span className="hidden font-mono text-xs font-bold text-foreground/25 sm:block">{player.rank}</span>
                <div className="grid size-12 place-items-center rounded-sm border border-border/70 bg-foreground/[0.04] font-mono text-xs font-black text-primary transition-colors group-hover:border-primary/50 sm:size-14">{player.initials}</div>
                <div className="min-w-0"><h3 className="truncate text-sm font-black sm:text-base">{player.name}</h3><p className="mt-1 text-[9px] font-bold tracking-[0.2em] text-muted-foreground">{player.role}</p></div>
                <div className="hidden text-right sm:block"><p className="text-lg font-black">{player.kd}</p><p className="text-[9px] font-bold tracking-widest text-muted-foreground">K/D</p></div>
                <div className="text-right"><p className="text-lg font-black text-primary">{player.damage}</p><p className="text-[9px] font-bold tracking-widest text-muted-foreground">AVG DMG</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 bg-surface-deep">
        <div className="mx-auto flex max-w-360 flex-col gap-6 px-5 py-8 text-xs text-muted-foreground sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-sm bg-primary text-[10px] font-black text-primary-foreground">BB</span><span className="font-bold tracking-[0.16em] text-foreground">BOBO CLAN</span></div>
          <p className="font-mono text-[10px]">© 178cm63kg31cm. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div><p className="text-lg font-black tracking-tight">{value}</p><p className="mt-1 text-[9px] font-bold tracking-[0.16em] text-muted-foreground">{label}</p></div>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><p className="mb-3 text-[10px] font-black tracking-[0.28em] text-primary">{eyebrow}</p><h2 className="text-4xl font-black tracking-[-0.055em] sm:text-5xl">{title}</h2></div><p className="max-w-md text-sm leading-6 text-muted-foreground md:text-right">{description}</p></div>;
}

function Notice({ tag, title, date }: { tag: string; title: string; date: string }) {
  return <a href="#" className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-5"><span className="rounded-sm bg-foreground/[0.05] px-2 py-1 text-[9px] font-black text-primary">{tag}</span><span className="truncate text-sm font-semibold transition-colors group-hover:text-primary">{title}</span><span className="font-mono text-[10px] text-muted-foreground">{date}</span></a>;
}
