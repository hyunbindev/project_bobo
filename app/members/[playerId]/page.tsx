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
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MatchHistoryTable } from "@/components/clan-dashboard/match-history-table";
import { MatchPagination } from "@/components/clan-dashboard/match-pagination";
import {
  PlayerPerformanceTrends,
  type PlayerTrendMetric,
} from "@/components/clan-dashboard/player-performance-trends";
import {
  PlayerRecords,
  type PlayerRecord,
} from "@/components/clan-dashboard/player-records";
import { getClanMemberDetail } from "@/lib/services/clan-member-service";
import {
  getPlayerHighRecord,
  getPlayerMatchHistoryPage,
  type HighRecord,
} from "@/lib/services/player-stat-service";

const MATCH_PAGE_SIZE = 10;
import { formatDateTime } from "@/lib/utils";

const trendMetrics: PlayerTrendMetric[] = [
  {
    label: "AVERAGE DAMAGE",
    currentValue: "648",
    change: "+15.1%",
    description: "AVG 492",
    values: [312, 445, 287, 520, 391, 610, 478, 534, 702, 648],
    tone: "primary",
  },
  {
    label: "AVERAGE KILLS",
    currentValue: "4.2",
    change: "+0.6",
    description: "AVG 3.3",
    values: [2.1, 2.8, 1.9, 3.4, 2.6, 4.1, 3.2, 3.8, 4.6, 4.2],
    tone: "info",
  },
  {
    label: "AVERAGE RANK",
    currentValue: "#4.8",
    change: "▲ 2.4",
    description: "AVG #8.3",
    values: [12.4, 10.8, 13.2, 8.6, 9.4, 6.8, 7.2, 5.9, 4.1, 4.8],
    tone: "support",
    lowerIsBetter: true,
  },
];

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
  const member = await getClanMemberDetail(playerId);

  if (!member) {
    notFound();
  }

  const [playerHighRecord, matchHistory] = await Promise.all([
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
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-360 items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
            href="/members"
          >
            <ArrowLeft className="size-4" /> 클랜원 목록
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
            description="최근 10경기 기준으로 경기별 흐름을 비교해."
            eyebrow="RECENT FORM"
            icon={Radio}
            title="경기력 추이"
          />
          <PlayerPerformanceTrends metrics={trendMetrics} />
        </section>

        <section>
          <SectionHeading
            description="현재 저장된 경기 중 가장 높은 개인 기록이야."
            eyebrow="PERSONAL BEST"
            icon={Trophy}
            title="최고 기록"
          />
          <PlayerRecords records={records} />
        </section>

        <section>
          <SectionHeading
            description="맵과 모드별 세부 성적을 시간순으로 확인할 수 있어."
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
