import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import type { MatchRosterDetailParticipant } from "@/lib/repositories/match-repository";

type RosterParticipant = MatchRosterDetailParticipant & { clanMember: boolean };

const columns = "lg:grid-cols-[minmax(0,1fr)_64px_110px_64px_64px_64px_24px]";

export function RosterParticipantsTable({ participants }: { participants: RosterParticipant[] }) {
  const totalDamage = participants.reduce((sum, member) => sum + member.damageDealt, 0);
  return (
    <div className="overflow-hidden rounded-sm border border-border/60 bg-card">
      <div aria-hidden="true" className={`hidden items-center gap-5 border-b border-border/60 bg-muted/20 px-6 py-3 text-right text-[11px] font-bold text-muted-foreground lg:grid ${columns}`}>
        <span className="text-left">참여자</span><span>킬</span><span>딜 / 기여도</span><span>기절</span><span>도움</span><span>소생</span><span />
      </div>
      <ul>
        {participants.map((member) => {
          const share = totalDamage > 0 ? Math.round(member.damageDealt / totalDamage * 100) : 0;
          return (
            <li key={member.id} className="border-b border-border/50 last:border-b-0">
              <Collapsible className="group">
                <CollapsibleTrigger className={`grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-4 px-4 py-5 text-left hover:bg-foreground/[0.025] focus-visible:outline-2 focus-visible:outline-primary sm:px-6 lg:gap-5 ${columns}`}>
                  <span className="min-w-0">
                    <span title={member.name} className="block truncate text-sm font-black">{member.name}</span>
                    <span className="mt-1 block text-[10px] text-muted-foreground">{member.clanMember ? "클랜원" : "외부 팀원"}</span>
                  </span>
                  <ChevronDown aria-hidden="true" className="col-start-2 row-start-1 size-4 justify-self-end text-muted-foreground transition-transform duration-300 group-data-[open]:rotate-180 motion-reduce:transition-none lg:col-start-7" />
                  <span className="col-span-2 grid grid-cols-5 items-start gap-3 lg:contents">
                    <span className="text-right"><span className="mb-1 block text-left text-[10px] text-muted-foreground lg:sr-only">킬</span><span className="block text-left text-sm font-black tabular-nums text-primary lg:text-right">{member.kills}</span></span>
                    <span className="min-w-0 text-right">
                      <span className="mb-1 block text-left text-[10px] text-muted-foreground lg:sr-only">딜 / 기여도</span>
                      <span className="block text-left text-sm font-black tabular-nums lg:text-right">{Math.round(member.damageDealt).toLocaleString("ko-KR")}</span>
                      <span className="mt-1.5 flex items-center gap-1.5" title={`팀 딜 기여도 ${share}%`}>
                        <span aria-hidden="true" className="h-1 min-w-2 flex-1 overflow-hidden rounded-full bg-foreground/8"><span className="block h-full rounded-full bg-primary/80" style={{ width: `${share}%` }} /></span>
                        <span className="text-[9px] tabular-nums text-muted-foreground">{share}%</span>
                      </span>
                    </span>
                    {[["기절", member.dbnos], ["도움", member.assists], ["소생", member.revives]].map(([label, value]) => (
                      <span key={label} className="text-right"><span className="mb-1 block text-left text-[10px] text-muted-foreground lg:sr-only">{label}</span><span className="block text-left text-sm font-bold tabular-nums lg:text-right">{value}</span></span>
                    ))}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                <div className="border-t border-border/40 bg-background/35 px-4 py-5 sm:px-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-bold">개인 상세 기록</p>
                    <Link href={`/members/${member.playerId}`} className="inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-primary hover:underline">플레이어 전적 <ArrowUpRight aria-hidden="true" className="size-3.5" /></Link>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
                    {[
                      ["생존 시간", formatDuration(member.timeSurvived)],
                      ["헤드샷 킬", member.headshotKills],
                      ["최장거리 킬", `${Math.round(member.longestKill)}m`],
                      ["회복 아이템", member.heals],
                      ["부스트 아이템", member.boosts],
                      ["도보 이동", formatDistance(member.walkDistance)],
                      ["차량 이동", formatDistance(member.rideDistance)],
                      ["수영 이동", formatDistance(member.swimDistance)],
                      ["획득 무기", member.weaponsAcquired],
                      ["팀킬", member.teamKills],
                    ].map(([label, value]) => (
                      <div key={label}><dt className="text-[11px] text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-bold tabular-nums">{value}</dd></div>
                    ))}
                  </dl>
                </div>
                </CollapsibleContent>
              </Collapsible>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatDuration(value: number) {
  const seconds = Math.max(Math.round(value), 0);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
function formatDistance(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}km` : `${Math.round(value)}m`;
}
