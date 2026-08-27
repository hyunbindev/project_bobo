import { Activity, Clock3, Crosshair, Map, Trophy } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MatchRosterListItem } from "@/lib/repositories/match-repository";

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

export function MatchHistoryTable({
  matches,
}: {
  matches: MatchRosterListItem[];
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-border/60 bg-card">
      <Table className="min-w-0 lg:min-w-250">
        <TableHeader className="hidden bg-muted/20 lg:table-header-group">
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead className="w-20 px-6 text-[9px] font-black tracking-[0.16em] text-muted-foreground">
              RANK
            </TableHead>
            <TableHead className="text-[9px] font-black tracking-[0.16em] text-muted-foreground">
              MAP / MODE
            </TableHead>
            <TableHead className="w-28 text-[9px] font-black tracking-[0.16em] text-muted-foreground">
              TEAM KILLS
            </TableHead>
            <TableHead className="w-20 text-[9px] font-black tracking-[0.16em] text-muted-foreground">
              DBNO
            </TableHead>
            <TableHead className="w-28 text-[9px] font-black tracking-[0.16em] text-muted-foreground">
              DAMAGE
            </TableHead>
            <TableHead className="w-64 text-[9px] font-black tracking-[0.16em] text-muted-foreground">
              MEMBERS
            </TableHead>
            <TableHead className="w-40 px-6 text-right text-[9px] font-black tracking-[0.16em] text-muted-foreground">
              PLAYED
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {matches.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell className="h-64 text-center" colSpan={7}>
                <Trophy className="mx-auto size-8 text-primary/70" />
                <p className="mt-4 text-sm font-black">저장된 경기가 아직 없어</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  동기화가 완료되면 최신 경기부터 여기에 표시돼
                </p>
              </TableCell>
            </TableRow>
          ) : (
            matches.map((match) => {
              const href = `/matches/${encodeURIComponent(match.matchId)}/rosters/${encodeURIComponent(match.rosterId)}`;

              return (
                <Fragment
                  key={`${match.matchId}:${match.rosterId}`}
                >
                  <TableRow className="border-border/50 hover:bg-foreground/[0.025] lg:hidden">
                    <TableCell className="whitespace-normal p-0" colSpan={7}>
                      <Link
                        aria-label={`${formatMapName(match.mapName)} 경기 상세 보기`}
                        className="block px-4 py-4 sm:px-5"
                        href={href}
                      >
                        <div className="flex min-w-0 items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span
                              className={`shrink-0 text-xl font-black tracking-[-0.05em] ${
                                match.rank === 1
                                  ? "text-primary"
                                  : "text-foreground"
                              }`}
                            >
                              #{match.rank}
                            </span>
                            <strong className="flex min-w-0 items-center gap-1.5 truncate text-sm">
                              <Map className="size-3.5 shrink-0 text-primary" />
                              <span className="truncate">
                                {formatMapName(match.mapName)}
                              </span>
                            </strong>
                          </div>
                          <span className="flex shrink-0 items-center gap-1 text-[9px] font-semibold text-muted-foreground">
                            <Clock3 className="size-3" />
                            {formatPlayedAt(match.playedAt)}
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-[10px] font-semibold text-muted-foreground">
                          <span className="truncate">
                            {formatMode(match.matchType, match.gameMode)}
                          </span>
                          <span className="whitespace-nowrap">
                            {match.kills}킬 · {match.dbnos}기절 · {Math.round(match.damage).toLocaleString("ko-KR")}딜
                          </span>
                        </div>
                      </Link>
                    </TableCell>
                  </TableRow>

                  <TableRow className="hidden border-border/50 hover:bg-foreground/[0.025] lg:table-row">
                    <TableCell className="p-0">
                      <Link className="block px-6 py-5" href={href}>
                        <span
                          className={`text-2xl font-black tracking-[-0.05em] ${
                            match.rank === 1
                              ? "text-primary"
                              : "text-foreground"
                          }`}
                        >
                          #{match.rank}
                        </span>
                      </Link>
                    </TableCell>

                    <TableCell className="p-0">
                      <Link className="block py-5" href={href}>
                        <p className="flex items-center gap-2 text-sm font-black">
                          <Map className="size-3.5 text-primary" />
                          {formatMapName(match.mapName)}
                        </p>
                        <p className="mt-1 truncate text-[10px] font-semibold text-muted-foreground">
                          {formatMode(match.matchType, match.gameMode)}
                        </p>
                      </Link>
                    </TableCell>

                    <MetricCell
                      href={href}
                      icon={Crosshair}
                      value={match.kills}
                    />
                    <MetricCell href={href} icon={Activity} value={match.dbnos} />
                    <MetricCell
                      href={href}
                      icon={Trophy}
                      value={Math.round(match.damage).toLocaleString("ko-KR")}
                    />

                    <TableCell className="p-0">
                      <Link className="flex flex-wrap gap-1 py-5" href={href}>
                        {match.memberNames.map((member, index) => (
                          <span
                            className="max-w-28 truncate rounded-sm bg-foreground/[0.055] px-2 py-1 text-[9px] font-bold text-muted-foreground"
                            key={`${member}:${index}`}
                            title={member}
                          >
                            {member}
                          </span>
                        ))}
                      </Link>
                    </TableCell>

                    <TableCell className="p-0 text-right">
                      <Link
                        className="flex items-center justify-end gap-1.5 px-6 py-5 text-[10px] font-semibold text-muted-foreground"
                        href={href}
                      >
                        <Clock3 className="size-3" />
                        {formatPlayedAt(match.playedAt)}
                      </Link>
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function MetricCell({
  href,
  icon: Icon,
  value,
}: {
  href: string;
  icon: typeof Crosshair;
  value: string | number;
}) {
  return (
    <TableCell className="p-0">
      <Link className="flex items-center gap-2 py-5" href={href}>
        <Icon className="size-3 text-primary" />
        <strong className="text-sm font-black">{value}</strong>
      </Link>
    </TableCell>
  );
}

function formatMapName(mapName: string) {
  return mapLabels[mapName] ?? mapName.replace(/_Main$/i, "").toUpperCase();
}

function formatMode(matchType: string, gameMode: string) {
  const typeLabel = matchType === "competitive" ? "경쟁전" : "일반전";
  const modeLabel = gameMode.replaceAll("-", " ").toUpperCase();

  return `${typeLabel} · ${modeLabel}`;
}

function formatPlayedAt(playedAt: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(playedAt);
}
