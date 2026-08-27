"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MatchRosterDetailParticipant } from "@/lib/repositories/match-repository";

type RosterParticipant = MatchRosterDetailParticipant & {
  clanMember: boolean;
};

export function RosterParticipantsTable({
  participants,
}: {
  participants: RosterParticipant[];
}) {
  const router = useRouter();

  const openMemberDetail = (playerId: string) => {
    router.push(`/members/${playerId}`);
  };

  return (
    <div className="overflow-hidden rounded-sm border border-border/60 bg-card">
      <Table className="min-w-0 2xl:min-w-215">
        <TableHeader className="hidden bg-muted/20 2xl:table-header-group">
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead className="w-20 px-5 text-[8px] font-black tracking-[0.14em] text-muted-foreground">
              RANK
            </TableHead>
            <TableHead className="w-[32%] text-[8px] font-black tracking-[0.14em] text-muted-foreground">
              PLAYER
            </TableHead>
            <StatHead>KILLS</StatHead>
            <StatHead>ASSISTS</StatHead>
            <StatHead>DAMAGE</StatHead>
            <StatHead>DBNO</StatHead>
            <StatHead>REVIVE</StatHead>
            <StatHead>SURVIVED</StatHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {participants.map((member, index) => (
            <Fragment key={member.id}>
              <TableRow
                onClick={() => openMemberDetail(member.playerId)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") openMemberDetail(member.playerId);
                }}
                className="cursor-pointer border-border/50 hover:bg-foreground/[0.025] 2xl:hidden"
                role="link"
                tabIndex={0}
              >
                <TableCell className="px-4 py-4" colSpan={8}>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`shrink-0 text-lg font-black tracking-[-0.05em] ${
                          index === 0 ? "text-primary" : "text-foreground"
                        }`}
                      >
                        #{index + 1}
                      </span>
                      <span className="truncate text-sm font-black">
                        {member.name}
                      </span>
                      <span className="shrink-0 text-[8px] font-bold tracking-[0.12em] text-muted-foreground">
                        {member.clanMember ? "BOBO" : "SQUAD"}
                      </span>
                    </div>
                    <span className="text-xs font-black text-muted-foreground">
                      생존 {formatDuration(member.timeSurvived)}
                    </span>

                    <div className="min-w-0 truncate text-[10px] font-bold text-muted-foreground">
                      <span className="font-black text-primary">{member.kills}킬</span>
                      <span> · {member.assists}어시 · </span>
                      <span className="text-foreground">
                        {Math.round(member.damageDealt).toLocaleString("ko-KR")}딜
                      </span>
                    </div>
                    <span className="text-right text-[10px] font-bold text-muted-foreground">
                      {member.dbnos}기절 · {member.revives}부활
                    </span>
                  </div>
                </TableCell>
              </TableRow>

              <TableRow
                onClick={() => openMemberDetail(member.playerId)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") openMemberDetail(member.playerId);
                }}
                className="hidden cursor-pointer border-border/50 hover:bg-foreground/[0.025] 2xl:table-row"
                role="link"
                tabIndex={0}
              >
                <TableCell className="px-5 py-5">
                  <span
                    className={`text-2xl font-black tracking-[-0.05em] ${
                      index === 0 ? "text-primary" : "text-foreground"
                    }`}
                  >
                    #{index + 1}
                  </span>
                </TableCell>
                <StatCell>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{member.name}</p>
                      <p className="mt-1 text-[8px] font-bold tracking-[0.15em] text-muted-foreground">
                        {member.clanMember ? "BOBO CLAN" : "SQUAD MATE"}
                      </p>
                    </div>
                  </div>
                </StatCell>
                <StatCell emphasis>{member.kills}</StatCell>
                <StatCell>{member.assists}</StatCell>
                <StatCell>
                  {Math.round(member.damageDealt).toLocaleString("ko-KR")}
                </StatCell>
                <StatCell>{member.dbnos}</StatCell>
                <StatCell>{member.revives}</StatCell>
                <StatCell>{formatDuration(member.timeSurvived)}</StatCell>
              </TableRow>
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StatHead({ children }: { children: React.ReactNode }) {
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
  children: React.ReactNode;
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

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(Math.round(totalSeconds), 0);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
