import {
  ArrowLeft,
  Crosshair,
  Gamepad2,
  HeartHandshake,
  Medal,
  Radio,
  Ruler,
  Target,
  Trophy,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MatchHistoryTable } from "@/components/clan-dashboard/match-history-table";
import { MatchPagination } from "@/components/clan-dashboard/match-pagination";
import { PlayerPerformanceTrends } from "@/components/clan-dashboard/player-performance-trends";
import {
  PlayerRecords,
  type PlayerRecord,
} from "@/components/clan-dashboard/player-records";
import { SiteHeader } from "@/components/clan-dashboard/site-header";
import {
  getClanMemberDetail,
  getStoredPlayerSummary,
} from "@/lib/services/clan-member-service";
import { getMainClanSummary } from "@/lib/services/clan-service";
import {
  getPlayerHighRecord,
  getPlayerMatchHistoryPage,
  getPlayerPerformanceTrends,
  type HighRecord,
} from "@/lib/services/player-stat-service";

import { formatDateTime } from "@/lib/utils";

const MATCH_PAGE_SIZE = 10;

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ playerId: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const [{ playerId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const requestedPage = parsePage(resolvedSearchParams.page);
  const [member, clan] = await Promise.all([
    getClanMemberDetail(playerId),
    getMainClanSummary(),
  ]);

  if (!member) {
    const player = await getStoredPlayerSummary(playerId);

    if (!player) {
      notFound();
    }

    return (
      <NonClanMemberView
        clanName={clan?.name ?? "BOBO"}
        clanTag={clan?.tag ?? "BOBO"}
        nickname={player.nickname}
        platform={player.platform}
      />
    );
  }

  const [trendMetrics, playerHighRecord, matchHistory] =
    await Promise.all([
      getPlayerPerformanceTrends(playerId, member.clanId),
      getPlayerHighRecord(playerId),
      getPlayerMatchHistoryPage(
        playerId,
        member.clanId,
        requestedPage,
        MATCH_PAGE_SIZE,
      ),
    ]);
  const records = createHighRecordCards(playerHighRecord);
  const firstMatch =
    matchHistory.totalCount === 0
      ? 0
      : (matchHistory.page - 1) * matchHistory.pageSize + 1;
  const lastMatch = Math.min(
    matchHistory.page * matchHistory.pageSize,
    matchHistory.totalCount,
  );

  return (
    <main className="min-h-screen bg-background pt-18 text-foreground">
      <SiteHeader
        clanName={clan?.name ?? "BOBO"}
        clanTag={clan?.tag ?? member.clanTag}
      />

      <section className="relative overflow-hidden border-b border-border/50">
        <div className="hero-grid absolute inset-0 opacity-25" />
        <div className="hero-glow absolute -left-40 top-0 size-96 rounded-full" />
        <div className="relative mx-auto max-w-360 px-5 py-14 sm:px-8 lg:px-12 lg:py-18">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 text-[10px] font-black tracking-[0.28em] text-primary">
                PLAYER PERFORMANCE
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black tracking-[-0.055em] sm:text-6xl">
                  {member.nickname}
                </h1>
              </div>
              <p className="mt-4 text-sm font-semibold text-muted-foreground">
                {member.displayName ?? "미등록"} · [{member.clanTag}] ·{" "}
                {member.platform.toUpperCase()}
              </p>
              <p className="mt-2 max-w-xl truncate text-[10px] text-muted-foreground/60">
                LAST UPDATED · {formatDateTime(member.lastUpdateAt)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-360 space-y-16 px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <section>
          <SectionHeading
            description="최근 14일 클랜 파티 경기 중 최대 50경기를 기준으로 산출한 경기력 추이입니다."
            eyebrow="RECENT FORM"
            icon={Radio}
            title="경기력 추이"
          />
          <PlayerPerformanceTrends metrics={trendMetrics} />
        </section>

        <section>
          <SectionHeading
            description="현재 저장된 경기에서 확인된 개인 최고 기록입니다."
            eyebrow="PERSONAL BEST"
            icon={Trophy}
            title="최고 기록"
          />
          <PlayerRecords records={records} />
        </section>

        <section>
          <SectionHeading
            description="클랜원과 함께한 경기의 세부 기록을 최신순으로 제공합니다."
            eyebrow="MATCH HISTORY"
            icon={Gamepad2}
            title="최근 전적"
          />
          <MatchHistoryTable matches={matchHistory.items} />

          {matchHistory.totalCount > 0 && (
            <div className="mt-8 flex flex-col gap-4 border-t border-border/50 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground">
                총 {matchHistory.totalCount.toLocaleString("ko-KR")}건 중{" "}
                {firstMatch.toLocaleString("ko-KR")}–
                {lastMatch.toLocaleString("ko-KR")}건
              </p>
              <MatchPagination
                currentPage={matchHistory.page}
                totalPages={matchHistory.totalPages}
              />
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function NonClanMemberView({
  clanName,
  clanTag,
  nickname,
  platform,
}: {
  clanName: string;
  clanTag: string;
  nickname: string;
  platform: string;
}) {
  return (
    <main className="min-h-screen bg-background pt-18 text-foreground">
      <SiteHeader clanName={clanName} clanTag={clanTag} />

      <section className="relative grid min-h-[calc(100vh-4.5rem)] place-items-center overflow-hidden px-5 py-16">
        <div className="hero-grid absolute inset-0 opacity-20" />
        <div className="hero-glow absolute left-1/2 top-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full" />

        <div className="relative w-full max-w-xl rounded-sm border border-border/60 bg-card p-8 text-center sm:p-12">
          <span className="mx-auto grid size-16 place-items-center rounded-full border border-primary/35 bg-primary/10 text-primary">
            <UserX className="size-8" />
          </span>
          <p className="mt-6 text-[10px] font-black tracking-[0.25em] text-primary">
            NON-CLAN PLAYER
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            클랜원이 아닙니다
          </h1>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            <strong className="text-foreground">{nickname}</strong>
            <span> · {platform.toUpperCase()}</span>
            <br />
            현재 {clanName} 클랜원으로 등록되어 있지 않아 상세 전적을 제공하지 않습니다.
          </p>
          <Link
            className="mx-auto mt-8 inline-flex h-10 items-center gap-2 rounded-sm border border-primary/50 px-5 text-xs font-black text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            href="/members"
          >
            <ArrowLeft className="size-4" /> 클랜원 목록으로
          </Link>
        </div>
      </section>
    </main>
  );
}

function parsePage(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(candidate ?? "1", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

const mapLabels: Record<string, string> = {
  Baltic_Main: "ERANGEL",
  Chimera_Main: "PARAMO",
  Desert_Main: "MIRAMAR",
  DihorOtok_Main: "VIKENDI",
  Heaven_Main: "HAVEN",
  Kiki_Main: "DESTON",
  Range_Main: "CAMP JACKAL",
  Savage_Main: "SANHOK",
  Summerland_Main: "KARAKIN",
  Tiger_Main: "TAEGO",
};

function createHighRecordCards(highRecord: HighRecord | null): PlayerRecord[] {
  return [
    {
      label: "MAX DAMAGE",
      value: highRecord
        ? Math.round(highRecord.maxDamage.value).toLocaleString("ko-KR")
        : "-",
      detail: formatRecordDetail(highRecord?.maxDamage),
      icon: Target,
    },
    {
      label: "MAX KILLS",
      value: highRecord ? String(highRecord.maxKills.value) : "-",
      detail: formatRecordDetail(highRecord?.maxKills),
      icon: Crosshair,
    },
    {
      label: "LONGEST KILL",
      value: highRecord
        ? `${Math.round(highRecord.longestKillRange.value)}m`
        : "-",
      detail: formatRecordDetail(highRecord?.longestKillRange),
      icon: Ruler,
    },
    {
      label: "MAX REVIVES",
      value: highRecord ? String(highRecord.maxRevives.value) : "-",
      detail: formatRecordDetail(highRecord?.maxRevives),
      icon: HeartHandshake,
    },
  ];
}

function formatRecordDetail(record: HighRecord["maxDamage"] | undefined) {
  if (!record) {
    return "NO MATCH DATA";
  }

  const mapName =
    mapLabels[record.mapName] ??
    record.mapName.replace(/_Main$/i, "").toUpperCase();
  const gameMode = record.gameMode.replaceAll("-", " ").toUpperCase();

  return `${mapName} · ${gameMode}`;
}

function SectionHeading({
  description,
  eyebrow,
  icon: Icon,
  title,
}: {
  description: string;
  eyebrow: string;
  icon: typeof Medal;
  title: string;
}) {
  return (
    <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 flex items-center gap-2 text-[9px] font-black tracking-[0.2em] text-primary">
          <Icon className="size-3.5" /> {eyebrow}
        </p>
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
          {title}
        </h2>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}
