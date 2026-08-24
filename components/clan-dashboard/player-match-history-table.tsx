import type { ReactNode } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type PlayerMatchHistoryItem = {
  id: string;
  rank: number;
  map: string;
  mode: string;
  kills: number;
  damage: number;
  dbnos: number;
  revives: number;
  playedAt: string;
};

export function PlayerMatchHistoryTable({
  matches,
}: {
  matches: PlayerMatchHistoryItem[];
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-border/60 bg-card">
      <Table className="min-w-205">
        <TableHeader className="bg-muted/20">
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead className="w-20 px-5 text-[8px] font-black tracking-[0.14em] text-muted-foreground">
              RANK
            </TableHead>
            <TableHead className="w-[32%] text-[8px] font-black tracking-[0.14em] text-muted-foreground">
              MAP / MODE
            </TableHead>
            <StatHead>KILLS</StatHead>
            <StatHead>DAMAGE</StatHead>
            <StatHead>DBNO</StatHead>
            <StatHead>REVIVE</StatHead>
            <TableHead className="w-36 px-5 text-right text-[8px] font-black tracking-[0.14em] text-muted-foreground">
              PLAYED
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {matches.map((match) => (
            <TableRow
              className="border-border/50 hover:bg-foreground/[0.025]"
              key={match.id}
            >
              <TableCell className="px-5 py-5">
                <span
                  className={`text-xl font-black ${
                    match.rank === 1 ? "text-primary" : "text-foreground"
                  }`}
                >
                  #{match.rank}
                </span>
              </TableCell>
              <TableCell>
                <p className="text-sm font-black">{match.map}</p>
                <p className="mt-1 text-[9px] font-semibold text-muted-foreground">
                  {match.mode}
                </p>
              </TableCell>
              <StatCell emphasis>{match.kills}</StatCell>
              <StatCell>{match.damage.toLocaleString("ko-KR")}</StatCell>
              <StatCell>{match.dbnos}</StatCell>
              <StatCell>{match.revives}</StatCell>
              <TableCell className="px-5 text-right text-[10px] font-semibold text-muted-foreground">
                {match.playedAt}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StatHead({ children }: { children: ReactNode }) {
  return (
    <TableHead className="text-[8px] font-black tracking-[0.14em] text-muted-foreground">
      {children}
    </TableHead>
  );
}

function StatCell({
  children,
  emphasis = false,
}: {
  children: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <TableCell
      className={`text-sm font-black ${emphasis ? "text-primary" : ""}`}
    >
      {children}
    </TableCell>
  );
}
