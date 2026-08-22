import { Clock3 } from "lucide-react";

export type RecentClanMatch = {
  id: string;
  map: string;
  mode: string;
  rank: string;
  status: string;
  kills: number;
  damage: string;
  time: string;
  accent: string;
  members: Array<{
    id: string;
    name: string;
    kills: number;
    damage: number;
  }>;
};

type RecentClanMatchesProps = {
  matches: RecentClanMatch[];
};

export function RecentClanMatches({ matches }: RecentClanMatchesProps) {
  return (
    <div className="mt-10 grid gap-4 lg:grid-cols-3">
      {matches.map((match) => (
        <article
          className="match-card group relative overflow-hidden rounded-sm border border-border/60 bg-card p-6 transition-all hover:-translate-y-1 hover:border-border"
          key={match.id}
        >
          <div
            aria-hidden="true"
            className={`match-glow match-glow-${match.accent}`}
          />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground">
                  {match.mode}
                </span>
                <h3 className="mt-2 text-2xl font-black tracking-tight">
                  {match.map}
                </h3>
              </div>
              <span className={`rank rank-${match.accent}`}>{match.rank}</span>
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
                      {member.damage} DMG
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border/50 pt-5">
              <MiniStat label="TEAM KILLS" value={String(match.kills)} />
              <MiniStat label="DAMAGE" value={match.damage} />
            </div>

            <div className="mt-6 flex items-center justify-between text-[11px] font-semibold">
              <span className={`status status-${match.accent}`}>
                {match.status}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock3 className="size-3" />
                {match.time}
              </span>
            </div>
          </div>
        </article>
      ))}
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
