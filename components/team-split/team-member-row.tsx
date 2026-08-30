import type { TeamMember } from "./types";

type TeamMemberRowProps = {
  accentClassName: string;
  index: number;
  member: TeamMember;
};

export function TeamMemberRow({
  accentClassName,
  index,
  member,
}: TeamMemberRowProps) {
  const player = member.player;

  return (
    <li className="grid min-w-0 grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/35 py-4 last:border-b-0">
      <span className="font-mono text-[9px] font-bold text-foreground/30">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="min-w-0">
        <p className="truncate text-sm font-black">
          {member.discordDisplayName}
        </p>
        {player ? (
          <p className="mt-1 truncate font-mono text-[8px] font-bold tracking-[0.1em] text-muted-foreground">
            PUBG · {player.pubgName}
          </p>
        ) : (
          <p className="mt-1 text-[8px] font-bold tracking-[0.12em] text-muted-foreground">
            DISCORD ONLY
          </p>
        )}
      </div>

      {player && (
        <div className="text-right">
          <p className={`font-mono text-sm font-black ${accentClassName}`}>
            {player.averageDamage === null
              ? "-"
              : Math.round(player.averageDamage).toLocaleString("ko-KR")}
          </p>
          <p className="mt-0.5 text-[7px] font-black tracking-[0.14em] text-muted-foreground">
            AVG DMG
          </p>
        </div>
      )}
    </li>
  );
}
