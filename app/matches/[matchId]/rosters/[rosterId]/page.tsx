import {
  Activity,
  ArrowLeft,
  Clock3,
  Crosshair,
  HeartPulse,
  Map,
  Shield,
  Skull,
  Swords,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";

type RosterMember = {
  id: string;
  name: string;
  initials: string;
  clanMember: boolean;
  kills: number;
  assists: number;
  damage: number;
  dbnos: number;
  revives: number;
  survivalTime: string;
  accent: "primary" | "info" | "kill" | "support";
};

const rosterMembers: RosterMember[] = [
  {
    id: "rush",
    name: "BOBO_RUSH",
    initials: "BR",
    clanMember: true,
    kills: 4,
    assists: 2,
    damage: 617,
    dbnos: 3,
    revives: 1,
    survivalTime: "26:48",
    accent: "primary",
  },
  {
    id: "cloud",
    name: "BOBO_CLOUD",
    initials: "BC",
    clanMember: true,
    kills: 3,
    assists: 3,
    damage: 524,
    dbnos: 2,
    revives: 2,
    survivalTime: "28:14",
    accent: "info",
  },
  {
    id: "178",
    name: "178cm63kg31cm",
    initials: "17",
    clanMember: true,
    kills: 2,
    assists: 1,
    damage: 431,
    dbnos: 2,
    revives: 1,
    survivalTime: "24:07",
    accent: "kill",
  },
  {
    id: "mate",
    name: "RandomMate_07",
    initials: "RM",
    clanMember: false,
    kills: 2,
    assists: 2,
    damage: 364,
    dbnos: 2,
    revives: 0,
    survivalTime: "21:36",
    accent: "support",
  },
];

const matchMetrics = [
  { label: "TEAM KILLS", value: "11", icon: Crosshair, tone: "text-primary" },
  { label: "TOTAL DAMAGE", value: "1,936", icon: Target, tone: "text-info" },
  { label: "DBNO", value: "9", icon: Activity, tone: "text-kill" },
  { label: "REVIVES", value: "4", icon: HeartPulse, tone: "text-support" },
];

const accentClasses = {
  primary: "border-primary/40 bg-primary/10 text-primary",
  info: "border-info/40 bg-info/10 text-info",
  kill: "border-kill/40 bg-kill/10 text-kill",
  support: "border-support/40 bg-support/10 text-support",
};

export default async function RosterMatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string; rosterId: string }>;
}) {
  const { matchId, rosterId } = await params;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-360 items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
            href="/matches"
          >
            <ArrowLeft className="size-4" /> 경기 목록
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
        <div className="relative mx-auto grid max-w-360 gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_240px] lg:px-12 lg:py-20">
          <div>
            <p className="mb-4 flex items-center gap-2 text-[10px] font-black tracking-[0.26em] text-primary">
              <Shield className="size-3.5" /> ROSTER MATCH REPORT
            </p>
            <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
              <h1 className="text-5xl font-black tracking-[-0.06em] sm:text-7xl">
                ERANGEL
              </h1>
              <span className="mb-2 rounded-sm border border-primary/35 bg-primary/10 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-primary">
                경쟁전 · 스쿼드 FPP
              </span>
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">
              BOBO 클랜원 3명과 함께한 로스터의 경기 결과입니다. 로스터 단위로
              팀 성적과 모든 참여자의 기록을 확인할 수 있습니다.
            </p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-semibold text-muted-foreground">
              <span className="flex items-center gap-2">
                <Clock3 className="size-3.5 text-primary" /> 2026.08.23 · 23:42
              </span>
              <span>경기 시간 28:14</span>
              <span className="font-mono">MATCH / {matchId}</span>
            </div>
          </div>

          <div className="flex items-end justify-between border-l-2 border-primary pl-6 lg:block lg:text-right">
            <div>
              <p className="text-[10px] font-black tracking-[0.24em] text-muted-foreground">
                FINAL RANK
              </p>
              <p className="mt-1 text-7xl font-black tracking-[-0.08em] text-primary sm:text-8xl">
                #3
              </p>
            </div>
            <div className="lg:mt-3">
              <p className="text-xs font-black tracking-[0.2em] text-primary">TOP 3</p>
              <p className="mt-1 text-[9px] font-semibold text-muted-foreground">
                25 TEAMS
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/50 bg-surface">
        <div className="mx-auto grid max-w-360 grid-cols-2 px-5 sm:px-8 lg:grid-cols-4 lg:px-12">
          {matchMetrics.map(({ label, value, icon: Icon, tone }) => (
            <div
              className="border-border/50 px-4 py-6 first:pl-0 even:border-l lg:border-l lg:px-7 lg:first:border-l-0 lg:first:pl-0"
              key={label}
            >
              <p className="flex items-center gap-2 text-[9px] font-black tracking-[0.17em] text-muted-foreground">
                <Icon className={`size-3.5 ${tone}`} /> {label}
              </p>
              <p className="mt-2 text-3xl font-black tracking-[-0.045em]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-360 gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-12 lg:py-20">
        <div>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-black tracking-[0.24em] text-primary">
                ROSTER MEMBERS
              </p>
              <h2 className="text-2xl font-black tracking-tight">참여자 기록</h2>
            </div>
            <span className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
              <Users className="size-4 text-primary" /> 4 PLAYERS
            </span>
          </div>

          <div className="overflow-hidden rounded-sm border border-border/60 bg-card">
            <div className="hidden grid-cols-[minmax(180px,1.5fr)_repeat(6,minmax(58px,0.6fr))] border-b border-border/60 px-5 py-3 text-[8px] font-black tracking-[0.14em] text-muted-foreground md:grid">
              <span>PLAYER</span>
              <span>KILLS</span>
              <span>ASSISTS</span>
              <span>DAMAGE</span>
              <span>DBNO</span>
              <span>REVIVE</span>
              <span>SURVIVED</span>
            </div>
            <div className="divide-y divide-border/50">
              {rosterMembers.map((member) => (
                <article
                  className="grid gap-5 px-5 py-5 transition-colors hover:bg-foreground/[0.025] md:grid-cols-[minmax(180px,1.5fr)_repeat(6,minmax(58px,0.6fr))] md:items-center"
                  key={member.id}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-sm border text-[10px] font-black ${accentClasses[member.accent]}`}
                    >
                      {member.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{member.name}</p>
                      <p className="mt-1 text-[8px] font-bold tracking-[0.15em] text-muted-foreground">
                        {member.clanMember ? "BOBO CLAN" : "SQUAD MATE"}
                      </p>
                    </div>
                  </div>
                  <MemberMetric label="KILLS" value={member.kills} emphasis />
                  <MemberMetric label="ASSISTS" value={member.assists} />
                  <MemberMetric label="DAMAGE" value={member.damage.toLocaleString()} />
                  <MemberMetric label="DBNO" value={member.dbnos} />
                  <MemberMetric label="REVIVE" value={member.revives} />
                  <MemberMetric label="SURVIVED" value={member.survivalTime} />
                </article>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-sm border border-border/60 bg-card p-6">
            <p className="mb-2 text-[10px] font-black tracking-[0.22em] text-primary">
              TEAM CONTRIBUTION
            </p>
            <h2 className="text-xl font-black">대미지 기여도</h2>
            <div className="mt-7 space-y-5">
              {rosterMembers.map((member) => {
                const contribution = Math.round((member.damage / 1936) * 100);

                return (
                  <div key={member.id}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-bold">
                      <span className="truncate">{member.name}</span>
                      <span className="font-mono text-muted-foreground">{contribution}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-foreground/6">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${contribution}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-sm border border-border/60 bg-card p-6">
            <p className="mb-5 text-[10px] font-black tracking-[0.22em] text-primary">
              MATCH INFO
            </p>
            <dl className="space-y-4 text-xs">
              <InfoRow icon={Map} label="맵" value="ERANGEL" />
              <InfoRow icon={Swords} label="모드" value="SQUAD FPP" />
              <InfoRow icon={Trophy} label="게임 유형" value="RANKED" />
              <InfoRow icon={Clock3} label="경기 시간" value="28:14" />
              <InfoRow icon={Skull} label="종료 사유" value="ELIMINATED" />
            </dl>
            <div className="mt-6 border-t border-border/50 pt-5">
              <p className="text-[8px] font-black tracking-[0.17em] text-muted-foreground">
                ROSTER ID
              </p>
              <p className="mt-2 break-all font-mono text-[9px] leading-4 text-foreground/70">
                {rosterId}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <footer className="border-t border-border/50 bg-surface">
        <div className="mx-auto flex max-w-360 flex-col gap-3 px-5 py-8 text-[9px] font-semibold tracking-wide text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span>BOBO CLAN · MATCH ARCHIVE</span>
          <span>정적 화면용 샘플 데이터</span>
        </div>
      </footer>
    </main>
  );
}

function MemberMetric({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string | number;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 md:block">
      <span className="text-[8px] font-black tracking-[0.13em] text-muted-foreground md:hidden">
        {label}
      </span>
      <strong className={`text-sm font-black ${emphasis ? "text-primary" : ""}`}>
        {value}
      </strong>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Map;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5 text-primary" /> {label}
      </dt>
      <dd className="font-black">{value}</dd>
    </div>
  );
}
