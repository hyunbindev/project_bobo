import type { Metadata } from "next";
import {
  Activity,
  ArrowLeft,
  Car,
  Clock3,
  Crosshair,
  Footprints,
  HeartPulse,
  Map,
  PackageOpen,
  Pill,
  Shield,
  Skull,
  Swords,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getMatchRosterDetail } from "@/lib/services/match-service";

type PageProps = {
  params: Promise<{ matchId: string; rosterId: string }>;
};

const mapLabels: Record<string, string> = {
  Baltic_Main: "ERANGEL",
  Chimera_Main: "PARAMO",
  Desert_Main: "MIRAMAR",
  DihorOtok_Main: "VIKENDI",
  Heaven_Main: "HAVEN",
  Kiki_Main: "DESTON",
  Neon_Main: "RONDO",
  Range_Main: "CAMP JACKAL",
  Savage_Main: "SANHOK",
  Summerland_Main: "KARAKIN",
  Tiger_Main: "TAEGO",
};

const accentClasses = [
  "border-primary/40 bg-primary/10 text-primary",
  "border-info/40 bg-info/10 text-info",
  "border-kill/40 bg-kill/10 text-kill",
  "border-support/40 bg-support/10 text-support",
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { matchId, rosterId } = await params;
  const detail = await getMatchRosterDetail(matchId, rosterId);

  if (!detail) {
    return { title: "경기를 찾을 수 없음 | BOBO" };
  }

  const mapName = formatMapName(detail.match.mapName);
  const title = `${mapName} #${detail.roster.rank} 로스터 전적 | BOBO`;
  const description = `${formatMode(detail.match.matchType, detail.match.gameMode)} · ${detail.totals.kills}킬 · ${Math.round(detail.totals.damage).toLocaleString("ko-KR")} 대미지`;

  return {
    title,
    description,
    openGraph: { title, description, images: [] },
    twitter: { card: "summary", title, description, images: [] },
  };
}

export default async function RosterMatchDetailPage({ params }: PageProps) {
  const { matchId, rosterId } = await params;
  const detail = await getMatchRosterDetail(matchId, rosterId);

  if (!detail) {
    notFound();
  }

  const mapName = formatMapName(detail.match.mapName);
  const mode = formatMode(detail.match.matchType, detail.match.gameMode);
  const rankStatus = formatRankStatus(detail.roster.rank);
  const matchMetrics = [
    {
      label: "TEAM KILLS",
      value: detail.totals.kills.toLocaleString("ko-KR"),
      icon: Crosshair,
      tone: "text-primary",
    },
    {
      label: "TOTAL DAMAGE",
      value: Math.round(detail.totals.damage).toLocaleString("ko-KR"),
      icon: Target,
      tone: "text-info",
    },
    {
      label: "DBNO",
      value: detail.totals.dbnos.toLocaleString("ko-KR"),
      icon: Activity,
      tone: "text-kill",
    },
    {
      label: "REVIVES",
      value: detail.totals.revives.toLocaleString("ko-KR"),
      icon: HeartPulse,
      tone: "text-support",
    },
  ];

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
                {mapName}
              </h1>
              <span className="mb-2 rounded-sm border border-primary/35 bg-primary/10 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-primary">
                {mode}
              </span>
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">
              클랜원 {detail.clanMemberCount}명이 함께한 로스터의 경기 결과야. 팀
              성적과 참여자 {detail.participants.length}명의 전체 기록을 확인할 수 있어.
            </p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-semibold text-muted-foreground">
              <span className="flex items-center gap-2">
                <Clock3 className="size-3.5 text-primary" /> {formatPlayedAt(detail.match.playedAt)}
              </span>
              <span>경기 시간 {formatDuration(detail.match.duration)}</span>
              <span className="font-mono">MATCH / {detail.match.pubgMatchId}</span>
            </div>
          </div>

          <div className="flex items-end justify-between border-l-2 border-primary pl-6 lg:block lg:text-right">
            <div>
              <p className="text-[10px] font-black tracking-[0.24em] text-muted-foreground">
                FINAL RANK
              </p>
              <p className="mt-1 text-7xl font-black tracking-[-0.08em] text-primary sm:text-8xl">
                #{detail.roster.rank}
              </p>
            </div>
            <div className="lg:mt-3">
              <p className="text-xs font-black tracking-[0.2em] text-primary">
                {rankStatus}
              </p>
              <p className="mt-1 text-[9px] font-semibold text-muted-foreground">
                {detail.match.totalTeams} TEAMS
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
              <Users className="size-4 text-primary" /> {detail.participants.length} PLAYERS
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
              {detail.participants.map((member, index) => (
                <article
                  className="grid gap-5 px-5 py-5 transition-colors hover:bg-foreground/[0.025] md:grid-cols-[minmax(180px,1.5fr)_repeat(6,minmax(58px,0.6fr))] md:items-center"
                  key={member.id}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-sm border text-[10px] font-black ${accentClasses[index % accentClasses.length]}`}
                    >
                      {getInitials(member.name)}
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
                  <MemberMetric
                    label="DAMAGE"
                    value={Math.round(member.damageDealt).toLocaleString("ko-KR")}
                  />
                  <MemberMetric label="DBNO" value={member.dbnos} />
                  <MemberMetric label="REVIVE" value={member.revives} />
                  <MemberMetric
                    label="SURVIVED"
                    value={formatDuration(member.timeSurvived)}
                  />
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
              {detail.participants.map((member) => {
                const contribution =
                  detail.totals.damage > 0
                    ? Math.round((member.damageDealt / detail.totals.damage) * 100)
                    : 0;

                return (
                  <div key={member.id}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-bold">
                      <span className="truncate">{member.name}</span>
                      <span className="font-mono text-muted-foreground">
                        {contribution}%
                      </span>
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
              <InfoRow icon={Map} label="맵" value={mapName} />
              <InfoRow icon={Swords} label="모드" value={formatGameMode(detail.match.gameMode)} />
              <InfoRow
                icon={Trophy}
                label="게임 유형"
                value={formatMatchType(detail.match.matchType)}
              />
              <InfoRow
                icon={Clock3}
                label="경기 시간"
                value={formatDuration(detail.match.duration)}
              />
              <InfoRow icon={Users} label="클랜원" value={`${detail.clanMemberCount}명`} />
              <InfoRow icon={Shield} label="플랫폼" value={detail.match.platform.toUpperCase()} />
            </dl>
            <div className="mt-6 border-t border-border/50 pt-5">
              <p className="text-[8px] font-black tracking-[0.17em] text-muted-foreground">
                ROSTER ID
              </p>
              <p className="mt-2 break-all font-mono text-[9px] leading-4 text-foreground/70">
                {detail.roster.id}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="border-t border-border/50 bg-surface">
        <div className="mx-auto max-w-360 px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <div className="mb-7">
            <p className="mb-2 text-[10px] font-black tracking-[0.24em] text-primary">
              FIELD REPORT
            </p>
            <h2 className="text-2xl font-black tracking-tight">상세 활동 기록</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {detail.participants.map((member) => (
              <article
                className="rounded-sm border border-border/60 bg-card p-5"
                key={member.id}
              >
                <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{member.name}</p>
                    <p className="mt-1 text-[8px] font-bold tracking-[0.14em] text-muted-foreground">
                      {member.deathType.replaceAll("_", " ").toUpperCase()}
                    </p>
                  </div>
                  <span className="text-xs font-black text-primary">#{member.killPlace}</span>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">
                  <SmallStat icon={Pill} label="BOOST" value={member.boosts} />
                  <SmallStat icon={HeartPulse} label="HEAL" value={member.heals} />
                  <SmallStat icon={Crosshair} label="HEADSHOT" value={member.headshotKills} />
                  <SmallStat
                    icon={Target}
                    label="LONGEST"
                    value={`${Math.round(member.longestKill)}m`}
                  />
                  <SmallStat
                    icon={Footprints}
                    label="ON FOOT"
                    value={formatDistance(member.walkDistance)}
                  />
                  <SmallStat
                    icon={Car}
                    label="VEHICLE"
                    value={formatDistance(member.rideDistance)}
                  />
                  <SmallStat
                    icon={PackageOpen}
                    label="WEAPONS"
                    value={member.weaponsAcquired}
                  />
                  <SmallStat icon={Skull} label="TEAM KILL" value={member.teamKills} />
                </dl>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 bg-background">
        <div className="mx-auto flex max-w-360 flex-col gap-3 px-5 py-8 text-[9px] font-semibold tracking-wide text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span>BOBO CLAN · MATCH ARCHIVE</span>
          <span>{detail.match.pubgMatchId}</span>
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
      <dd className="text-right font-black">{value}</dd>
    </div>
  );
}

function SmallStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Map;
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[8px] font-black tracking-[0.12em] text-muted-foreground">
        <Icon className="size-3 text-primary" /> {label}
      </dt>
      <dd className="mt-1.5 text-sm font-black">{value}</dd>
    </div>
  );
}

function formatMapName(mapName: string) {
  return mapLabels[mapName] ?? mapName.replace(/_Main$/i, "").toUpperCase();
}

function formatMode(matchType: string, gameMode: string) {
  return `${formatMatchType(matchType)} · ${formatGameMode(gameMode)}`;
}

function formatMatchType(matchType: string) {
  if (matchType === "competitive") return "경쟁전";
  if (matchType === "custom") return "커스텀";
  return "일반전";
}

function formatGameMode(gameMode: string) {
  return gameMode.replaceAll("-", " ").toUpperCase();
}

function formatRankStatus(rank: number) {
  if (rank === 1) return "WINNER WINNER";
  if (rank <= 3) return "TOP 3";
  if (rank <= 10) return "TOP 10";
  return "ELIMINATED";
}

function formatPlayedAt(playedAt: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(playedAt);
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(Math.round(totalSeconds), 0);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatDistance(distanceInMeters: number) {
  if (distanceInMeters >= 1_000) {
    return `${(distanceInMeters / 1_000).toFixed(1)}km`;
  }

  return `${Math.round(distanceInMeters)}m`;
}

function getInitials(name: string) {
  return name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "P";
}
