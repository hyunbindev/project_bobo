"use client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MatchRosterDetailParticipant } from "@/lib/repositories/match-repository";
import { useRouter } from "next/navigation";



type RosterParticipant = MatchRosterDetailParticipant & {
  clanMember: boolean;
};

export function RosterParticipantsTable({
  participants,
}: {
  participants: RosterParticipant[];
}) {
  const router = useRouter();
  return (
    <div className="overflow-hidden rounded-sm border border-border/60 bg-card">
      <Table className="min-w-215">
        <TableHeader className="bg-muted/20">
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
            <TableRow
              onClick={()=>router.push(`/members/${member.playerId}`)}
              className="border-border/50 hover:bg-foreground/[0.025]"
              key={member.id}
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
