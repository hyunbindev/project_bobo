import { formatDateTime } from "@/lib/shared/date";
import { Activity, Clock3, Crosshair, Map, Trophy } from "lucide-react";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MatchRosterListItem } from "@/lib/matches/types";
import { formatMapName } from "@/lib/pubg/maps";
import { formatMatchMode } from "@/lib/pubg/game-modes";

type MatchHistoryItem = Pick<
  MatchRosterListItem,
  "matchId" | "rosterId" | "mapName" | "gameMode" | "matchType" |
  "playedAt" | "rank" | "kills" | "damage"
> & Partial<Pick<MatchRosterListItem, "dbnos" | "memberNames">>;

export function MatchHistoryTable({
  matches,
  variant = "team",
}: {
  matches: MatchHistoryItem[];
  variant?: "team" | "clan-squad";
}) {
  const isClanSquad = variant === "clan-squad";
  const columnCount = isClanSquad ? 5 : 7;
  return (
    <MatchHistoryFrame isClanSquad={isClanSquad}>
        <TableBody>
          {matches.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell className="h-64 text-center" colSpan={columnCount}>
                <Trophy className="mx-auto size-8 text-primary/70" />
                <p className="mt-4 text-sm font-black">저장된 경기가 없습니다.</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  동기화가 완료되면 최신 경기부터 표시됩니다.
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
                    <TableCell className="whitespace-normal p-0" colSpan={columnCount}>
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
                            {formatDateTime(match.playedAt)}
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-[10px] font-semibold text-muted-foreground">
                          <span className="truncate">
                            {formatMatchMode(match.matchType, match.gameMode)}
                          </span>
                          <span className="whitespace-nowrap">
                            {isClanSquad && "클랜원 합산 · "}
                            {match.kills}킬 · {!isClanSquad && `${match.dbnos ?? 0}기절 · `}{Math.round(match.damage).toLocaleString("ko-KR")}딜
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
                          {formatMatchMode(match.matchType, match.gameMode)}
                        </p>
                      </Link>
                    </TableCell>

                    <MetricCell
                      href={href}
                      icon={Crosshair}
                      value={match.kills}
                    />
                    {!isClanSquad && <MetricCell href={href} icon={Activity} value={match.dbnos ?? 0} />}
                    <MetricCell
                      href={href}
                      icon={Trophy}
                      value={Math.round(match.damage).toLocaleString("ko-KR")}
                    />

                    {!isClanSquad && <TableCell className="p-0">
                      <Link className="flex flex-wrap gap-1 py-5" href={href}>
                        {match.memberNames?.map((member, index) => (
                          <span
                            className="max-w-28 truncate rounded-sm bg-foreground/[0.055] px-2 py-1 text-[9px] font-bold text-muted-foreground"
                            key={`${member}:${index}`}
                            title={member}
                          >
                            {member}
                          </span>
                        ))}
                      </Link>
                    </TableCell>}

                    <TableCell className="p-0 text-right">
                      <Link
                        className="flex items-center justify-end gap-1.5 px-6 py-5 text-[10px] font-semibold text-muted-foreground"
                        href={href}
                      >
                        <Clock3 className="size-3" />
                        {formatDateTime(match.playedAt)}
                      </Link>
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })
          )}
        </TableBody>
    </MatchHistoryFrame>
  );
}

function MatchHistoryFrame({ isClanSquad, children }: { isClanSquad: boolean; children: ReactNode }) {
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
              {isClanSquad ? "클랜원 합산 킬" : "TEAM KILLS"}
            </TableHead>
            {!isClanSquad && <TableHead className="w-20 text-[9px] font-black tracking-[0.16em] text-muted-foreground">
              DBNO
            </TableHead>}
            <TableHead className="w-28 text-[9px] font-black tracking-[0.16em] text-muted-foreground">
              {isClanSquad ? "클랜원 합산 딜량" : "DAMAGE"}
            </TableHead>
            {!isClanSquad && <TableHead className="w-64 text-[9px] font-black tracking-[0.16em] text-muted-foreground">
              MEMBERS
            </TableHead>}
            <TableHead className="w-40 px-6 text-right text-[9px] font-black tracking-[0.16em] text-muted-foreground">
              PLAYED
            </TableHead>
          </TableRow>
        </TableHeader>

        {children}
      </Table>
    </div>
  );
}

export function MatchHistoryTableSkeleton({ rowCount }: { rowCount: number }) {
  return (
    <div aria-hidden="true" className="motion-safe:animate-pulse">
      <MatchHistoryFrame isClanSquad>
        <TableBody>
          {Array.from({ length: rowCount }, (_, index) => (
            <TableRow key={index} className="border-border/50 hover:bg-transparent">
              <TableCell colSpan={5} className="p-0">
                <div className="px-4 py-4 sm:px-5 lg:hidden">
                  <div className="flex h-7 items-center justify-between gap-3">
                    <div className="h-5 w-40 rounded-sm bg-muted" />
                    <div className="h-3 w-20 rounded-sm bg-muted" />
                  </div>
                  <div className="mt-2 flex h-lh items-center justify-between gap-3 text-[10px]">
                    <div className="h-2.5 w-24 rounded-sm bg-muted" />
                    <div className="h-2.5 w-32 rounded-sm bg-muted" />
                  </div>
                </div>
                <div className="hidden grid-cols-[5rem_1fr_7rem_7rem_10rem] items-center py-5 lg:grid">
                  <div className="ml-6 h-7 w-8 rounded-sm bg-muted" />
                  <div>
                    <div className="flex h-5 items-center"><div className="h-3.5 w-24 rounded-sm bg-muted" /></div>
                    <div className="mt-1 flex h-lh items-center text-[10px]"><div className="h-2.5 w-28 rounded-sm bg-muted" /></div>
                  </div>
                  <div className="h-3.5 w-12 rounded-sm bg-muted" />
                  <div className="h-3.5 w-16 rounded-sm bg-muted" />
                  <div className="mr-6 ml-auto h-2.5 w-28 rounded-sm bg-muted" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </MatchHistoryFrame>
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
