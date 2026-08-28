"use client";
import { Clock3, Gamepad2, Users } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { useRouter } from "next/navigation";

export type ClanMembersTableItem = {
  memberId: string;
  playerId: string;
  nickname: string;
  displayName: string | null;
  platform: string;
  profileRegistered: boolean;
  status: string;
  lastSyncedAt: Date;
};

export function ClanMembersTable({
  members,
}: {
  members: ClanMembersTableItem[];
}) {
  const router = useRouter();
  return (
    <div className="overflow-hidden rounded-sm border border-border/60 bg-card">
      <Table className="min-w-190">
        <TableHeader className="bg-muted/20">
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead className="w-[34%] px-6 text-[9px] font-black tracking-[0.14em] text-muted-foreground">
              PLAYER
            </TableHead>
            <TableHead className="w-32 text-[9px] font-black tracking-[0.14em] text-muted-foreground">
              PLATFORM
            </TableHead>
            <TableHead className="w-36 text-[9px] font-black tracking-[0.14em] text-muted-foreground">
              PROFILE
            </TableHead>
            <TableHead className="w-28 text-[9px] font-black tracking-[0.14em] text-muted-foreground">
              STATUS
            </TableHead>
            <TableHead className="w-44 px-6 text-right text-[9px] font-black tracking-[0.14em] text-muted-foreground">
              LAST SYNC
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {members.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell className="h-64 text-center" colSpan={5}>
                <Users className="mx-auto size-8 text-primary/70" />
                <p className="mt-4 text-sm font-black">
                  확인된 클랜원이 없습니다.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  매치 동기화에서 발견된 클랜원이 여기에 표시됩니다.
                </p>
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => (
              <TableRow
                onClick={()=>router.push(`/members/${member.playerId}`)}
                className="border-border/50 hover:bg-foreground/[0.025] cusor-pointer"
                key={member.memberId}
              >
                <TableCell className="px-6 py-5">
                    <p className="truncate text-sm font-black transition-colors group-hover/player:text-primary">
                      {member.nickname}
                    </p>
                    <p className="mt-1 truncate text-[10px] font-bold tracking-[0.12em] text-muted-foreground">
                      {member.displayName ?? "UNREGISTERED"}
                    </p>
                </TableCell>

                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-xs font-black">
                    <Gamepad2 className="size-3.5 text-primary" />
                    {member.platform.toUpperCase()}
                  </span>
                </TableCell>

                <TableCell>
                  <span
                    className={`inline-flex rounded-sm border px-2 py-1 text-[8px] font-black tracking-[0.12em] ${
                      member.profileRegistered
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-info/30 bg-info/10 text-info"
                    }`}
                  >
                    {member.profileRegistered ? "REGISTERED" : "DISCOVERED"}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-success">
                    <span className="size-1.5 rounded-full bg-success" />
                    {member.status.toUpperCase()}
                  </span>
                </TableCell>

                <TableCell className="px-6 text-right">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                    <Clock3 className="size-3 text-primary" />
                    {formatDateTime(member.lastSyncedAt)}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
