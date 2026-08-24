import { Clock3 } from "lucide-react";

import type { RecentWonMatch } from "@/lib/services/match-service";
import Link from "next/link";

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

export function RecentClanMatches({
  matches,
}: {
  matches: RecentWonMatch[];
}) {
  return (
    <div className="mt-10 grid gap-4 lg:grid-cols-3">
      {matches.map((match) => {
        const href = `/matches/${encodeURIComponent(match.matchId)}/rosters/${encodeURIComponent(match.rosterId)}`;
        return(
        <Link className="block h-full" href={href} key={match.id}>
          <article
            className="h-full match-card group relative h-full overflow-hidden rounded-sm border border-border/60 bg-card p-6 transition-all hover:-translate-y-1 hover:border-border"
          >
            <div
              aria-hidden="true"
              className="match-glow match-glow-primary"
            />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground">
                    {formatMode(match.matchType, match.gameMode)}
                  </span>
                  <h3 className="mt-2 text-2xl font-black tracking-tight">
                    {formatMapName(match.mapName)}
                  </h3>
                </div>
                <span className="rank rank-primary">#{match.rank}</span>
              </div>

              <div className="mt-10 border-t border-border/50 pt-5">
                <p className="mb-3 text-[9px] font-black tracking-[0.18em] text-muted-foreground">
                  CLAN SQUAD
                </p>
                <ul className="grid grid-cols-2 gap-2">
                  {match.members.map((member) => (
                    <li
                      className="flex min-w-0 items-center gap-2 rounded-sm bg-foreground/[0.035] px-2.5 py-2"
                      key={member.id}
                    >
                      <span className="min-w-0 flex-1 truncate text-[10px] font-bold">
                        {member.name}
                      </span>
                      <span className="shrink-0 text-[9px] font-black text-muted-foreground">
                        {member.kills}K
                      </span>
                      <span className="w-14 shrink-0 text-right text-[9px] font-black text-primary">
                        {Math.round(member.damage).toLocaleString("ko-KR")} DMG
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border/50 pt-5">
                <MiniStat label="TEAM KILLS" value={String(match.kills)} />
                <MiniStat
                  label="DAMAGE"
                  value={Math.round(match.damage).toLocaleString("ko-KR")}
                />
              </div>

              <div className="mt-6 flex items-center justify-between text-[11px] font-semibold">
                <span className="status status-primary">WINNER WINNER</span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock3 className="size-3" />
                  {formatPlayedAt(match.playedAt)}
                </span>
              </div>
            </div>
          </article>
        </Link>
      )})}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-black tracking-tight">{value}</p>
      <p className="mt-1 text-[9px] font-bold tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function formatMapName(mapName: string) {
  return mapLabels[mapName] ?? mapName.replace(/_Main$/i, "").toUpperCase();
}

function formatMode(matchType: string, gameMode: string) {
  const matchTypeLabel =
    matchType === "competitive"
      ? "경쟁전"
      : matchType === "custom"
        ? "커스텀"
        : "일반전";

  return `${matchTypeLabel} · ${gameMode.replaceAll("-", " ").toUpperCase()}`;
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
