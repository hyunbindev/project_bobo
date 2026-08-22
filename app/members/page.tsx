import {
  ArrowLeft,
  Clock3,
  Crosshair,
  Crown,
  Medal,
  Shield,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

const rankingLeaders = [
  {
    label: "KILL LEADER",
    title: "킬 1위",
    name: "BOBO_RUSH",
    value: "186",
    unit: "KILLS",
    detail: "경기당 4.86킬",
    icon: Crosshair,
    accent: "text-primary",
  },
  {
    label: "DAMAGE LEADER",
    title: "평균 딜 1위",
    name: "178cm63kg31cm",
    value: "512",
    unit: "AVG DMG",
    detail: "총 대미지 34,816",
    icon: Zap,
    accent: "text-info",
  },
  {
    label: "WIN LEADER",
    title: "치킨 1위",
    name: "BOBO_CLOUD",
    value: "14",
    unit: "WINS",
    detail: "승률 18.4%",
    icon: Trophy,
    accent: "text-primary",
  },
  {
    label: "SURVIVAL LEADER",
    title: "생존 1위",
    name: "BOBO_Doha",
    value: "22:41",
    unit: "AVG TIME",
    detail: "TOP 10 비율 46.2%",
    icon: Shield,
    accent: "text-success",
  },
];

const members = [
  { id: "p1", rank: 1, name: "BOBO_RUSH", role: "ENTRY", matches: 68, kills: 186, kd: 4.86, avgDamage: 498, wins: 11, top10: 31, dbnos: 142 },
  { id: "p2", rank: 2, name: "178cm63kg31cm", role: "IGL", matches: 68, kills: 174, kd: 4.21, avgDamage: 512, wins: 12, top10: 34, dbnos: 136 },
  { id: "p3", rank: 3, name: "BOBO_CLOUD", role: "SUPPORT", matches: 76, kills: 168, kd: 3.97, avgDamage: 431, wins: 14, top10: 38, dbnos: 154 },
  { id: "p4", rank: 4, name: "BOBO_Doha", role: "SCOUT", matches: 65, kills: 143, kd: 3.72, avgDamage: 406, wins: 9, top10: 30, dbnos: 119 },
  { id: "p5", rank: 5, name: "BOBO_MOON", role: "FRAGGER", matches: 58, kills: 132, kd: 3.54, avgDamage: 389, wins: 8, top10: 26, dbnos: 108 },
  { id: "p6", rank: 6, name: "BOBO_ZERO", role: "SUPPORT", matches: 61, kills: 119, kd: 3.18, avgDamage: 367, wins: 7, top10: 25, dbnos: 113 },
  { id: "p7", rank: 7, name: "BOBO_HAZE", role: "SCOUT", matches: 52, kills: 101, kd: 2.94, avgDamage: 341, wins: 5, top10: 21, dbnos: 84 },
  { id: "p8", rank: 8, name: "BOBO_NOVA", role: "ENTRY", matches: 49, kills: 96, kd: 2.81, avgDamage: 328, wins: 4, top10: 19, dbnos: 79 },
];

export default function MembersPage() {
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
            CLAN ROSTER
          </p>
          <h1 className="text-4xl font-black tracking-[-0.055em] sm:text-6xl">
            클랜원 랭킹
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">
            이번 시즌 클랜원의 전투 기록을 지표별로 비교해.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-360 px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-black tracking-[0.24em] text-primary">
              CATEGORY LEADERS
            </p>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              지표별 1위
            </h2>
          </div>
          <span className="hidden items-center gap-2 text-[10px] font-bold text-muted-foreground sm:flex">
            <Crown className="size-4 text-primary" /> CURRENT SEASON
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {rankingLeaders.map((leader) => {
            const Icon = leader.icon;

            return (
              <article
                className="group relative overflow-hidden rounded-sm border border-border/60 bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40"
                key={leader.label}
              >
                <div className="absolute -right-12 -top-12 size-32 rounded-full bg-primary/[0.045] blur-2xl" />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[9px] font-black tracking-[0.2em] text-muted-foreground">
                        {leader.label}
                      </p>
                      <h3 className="mt-2 text-sm font-black">{leader.title}</h3>
                    </div>
                    <span className={`grid size-9 place-items-center rounded-sm bg-foreground/[0.05] ${leader.accent}`}>
                      <Icon className="size-4" />
                    </span>
                  </div>
                  <p className="mt-9 truncate text-sm font-black">{leader.name}</p>
                  <div className="mt-3 flex items-end gap-2">
                    <strong className={`text-3xl font-black tracking-[-0.05em] ${leader.accent}`}>
                      {leader.value}
                    </strong>
                    <span className="pb-1 text-[9px] font-black tracking-wider text-muted-foreground">
                      {leader.unit}
                    </span>
                  </div>
                  <p className="mt-3 border-t border-border/50 pt-3 text-[10px] text-muted-foreground">
                    {leader.detail}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border/50 bg-surface">
        <div className="mx-auto max-w-360 px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-black tracking-[0.24em] text-primary">
                MEMBER LEADERBOARD
              </p>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                전체 클랜원
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
              <Users className="size-4 text-primary" /> 활성 클랜원 {members.length}명
            </div>
          </div>

          <div className="overflow-hidden rounded-sm border border-border/60 bg-card">
            <div className="hidden grid-cols-[70px_minmax(180px,1fr)_90px_90px_100px_90px_90px_90px_90px] border-b border-border/60 px-6 py-3 text-[9px] font-black tracking-[0.14em] text-muted-foreground xl:grid">
              <span>RANK</span>
              <span>PLAYER</span>
              <span>MATCHES</span>
              <span>KILLS</span>
              <span>AVG DMG</span>
              <span>K/D</span>
              <span>DBNO</span>
              <span>WINS</span>
              <span>TOP 10</span>
            </div>

            <div className="divide-y divide-border/50">
              {members.map((member) => (
                <article
                  className="grid gap-5 px-5 py-5 transition-colors hover:bg-foreground/[0.025] xl:grid-cols-[70px_minmax(180px,1fr)_90px_90px_100px_90px_90px_90px_90px] xl:items-center xl:px-6"
                  key={member.id}
                >
                  <span className={`text-xl font-black ${member.rank <= 3 ? "text-primary" : "text-foreground/60"}`}>
                    {String(member.rank).padStart(2, "0")}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{member.name}</p>
                    <p className="mt-1 text-[9px] font-bold tracking-[0.18em] text-muted-foreground">
                      {member.role}
                    </p>
                  </div>

                  <MemberMetric icon={Clock3} label="MATCHES" value={member.matches} />
                  <MemberMetric icon={Crosshair} label="KILLS" value={member.kills} highlight={member.rank === 1} />
                  <MemberMetric icon={Zap} label="AVG DMG" value={member.avgDamage} highlight={member.avgDamage === 512} />
                  <MemberMetric icon={Target} label="K/D" value={member.kd.toFixed(2)} />
                  <MemberMetric icon={Medal} label="DBNO" value={member.dbnos} />
                  <MemberMetric icon={Trophy} label="WINS" value={member.wins} highlight={member.wins === 14} />
                  <MemberMetric icon={Shield} label="TOP 10" value={member.top10} />
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function MemberMetric({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: typeof Crosshair;
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 xl:block">
      <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider text-muted-foreground xl:hidden">
        <Icon className="size-3" /> {label}
      </span>
      <strong className={`text-sm font-black ${highlight ? "text-primary" : "text-foreground"}`}>
        {value}
      </strong>
    </div>
  );
}
