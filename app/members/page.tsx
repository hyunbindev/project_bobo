import {
  ArrowLeft,
  Clock3,
  Gamepad2,
  Radio,
  ShieldCheck,
  UserRoundCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

import { getClanMemberList } from "@/lib/services/clan-member-service";

export default async function MembersPage() {
  const { clan, members } = await getClanMemberList();
  const registeredMemberCount = members.filter(
    (member) => member.profileRegistered,
  ).length;
  const discoveredMemberCount = members.length - registeredMemberCount;

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
        <div className="relative mx-auto max-w-360 px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <p className="mb-3 text-[10px] font-black tracking-[0.28em] text-primary">
            CLAN ROSTER
          </p>
          <h1 className="text-4xl font-black tracking-[-0.055em] sm:text-6xl">
            {clan?.name ?? "클랜원 목록"}
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">
            PUBG 매치 기록을 통해 확인된 현재 클랜원을 한눈에 확인해.
          </p>
          {clan && (
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-bold text-muted-foreground">
              <span className="text-primary">[{clan.tag}]</span>
              <span>CLAN LEVEL {clan.level}</span>
              <span>{clan.platform.toUpperCase()}</span>
              <span>API ROSTER {clan.memberCount}명</span>
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-border/50 bg-surface">
        <div className="mx-auto grid max-w-360 grid-cols-3 px-5 sm:px-8 lg:px-12">
          <SummaryMetric
            icon={Users}
            label="ACTIVE MEMBERS"
            value={members.length}
          />
          <SummaryMetric
            icon={UserRoundCheck}
            label="REGISTERED"
            value={registeredMemberCount}
          />
          <SummaryMetric
            icon={Radio}
            label="DISCOVERED"
            value={discoveredMemberCount}
          />
        </div>
      </section>

      <section className="mx-auto max-w-360 px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-black tracking-[0.24em] text-primary">
              ACTIVE ROSTER
            </p>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              전체 클랜원
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
            <Users className="size-4 text-primary" /> 탐색된 클랜원 {members.length}명
          </div>
        </div>

        <div className="overflow-hidden rounded-sm border border-border/60 bg-card">
          <div className="hidden grid-cols-[minmax(220px,1.5fr)_120px_140px_100px_170px] border-b border-border/60 px-6 py-3 text-[9px] font-black tracking-[0.14em] text-muted-foreground lg:grid">
            <span>PLAYER</span>
            <span>PLATFORM</span>
            <span>PROFILE</span>
            <span>STATUS</span>
            <span className="text-right">LAST SYNC</span>
          </div>

          {members.length === 0 ? (
            <div className="grid min-h-64 place-items-center px-6 py-16 text-center">
              <div>
                <Users className="mx-auto size-8 text-primary/70" />
                <p className="mt-4 text-sm font-black">확인된 클랜원이 아직 없어</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  매치 동기화가 진행되면 발견된 클랜원이 여기에 표시돼.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {members.map((member) => (
                <article
                  className="grid gap-5 px-5 py-5 transition-colors hover:bg-foreground/[0.025] lg:grid-cols-[minmax(220px,1.5fr)_120px_140px_100px_170px] lg:items-center lg:px-6"
                  key={member.memberId}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-sm border border-primary/35 bg-primary/10 text-[10px] font-black text-primary">
                      {getInitials(member.nickname)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{member.nickname}</p>
                      <p className="mt-1 truncate text-[9px] font-bold tracking-[0.12em] text-muted-foreground">
                        {member.displayName ?? "AUTO DISCOVERED"}
                      </p>
                    </div>
                  </div>

                  <MemberValue
                    icon={Gamepad2}
                    label="PLATFORM"
                    value={member.platform.toUpperCase()}
                  />

                  <div className="flex items-center justify-between gap-3 lg:block">
                    <span className="text-[9px] font-bold tracking-wider text-muted-foreground lg:hidden">
                      PROFILE
                    </span>
                    <span
                      className={`inline-flex rounded-sm border px-2 py-1 text-[8px] font-black tracking-[0.12em] ${
                        member.profileRegistered
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-info/30 bg-info/10 text-info"
                      }`}
                    >
                      {member.profileRegistered ? "REGISTERED" : "DISCOVERED"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 lg:block">
                    <span className="text-[9px] font-bold tracking-wider text-muted-foreground lg:hidden">
                      STATUS
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-success">
                      <span className="size-1.5 rounded-full bg-success" /> ACTIVE
                    </span>
                  </div>

                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground lg:justify-end">
                    <Clock3 className="size-3 text-primary" /> {formatDateTime(member.lastSyncedAt)}
                  </span>
                </article>
              ))}
            </div>
          )}
        </div>

        <p className="mt-5 flex items-center gap-2 text-[9px] leading-5 text-muted-foreground">
          <ShieldCheck className="size-3.5 shrink-0 text-primary" /> 현재 활성 상태인
          클랜원만 표시하며, 자동 탐색 멤버는 프로필 등록 전까지 PUBG 닉네임으로
          노출돼.
        </p>
      </section>
    </main>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="border-l border-border/50 px-4 py-6 first:border-l-0 first:pl-0 sm:px-7">
      <p className="flex items-center gap-2 text-[8px] font-black tracking-[0.15em] text-muted-foreground sm:text-[9px]">
        <Icon className="size-3.5 text-primary" />
        <span className="hidden sm:inline">{label}</span>
      </p>
      <p className="mt-2 text-3xl font-black tracking-[-0.045em]">{value}</p>
    </div>
  );
}

function MemberValue({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gamepad2;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 lg:block">
      <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider text-muted-foreground lg:hidden">
        <Icon className="size-3" /> {label}
      </span>
      <strong className="text-xs font-black">{value}</strong>
    </div>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getInitials(name: string) {
  return name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "P";
}
