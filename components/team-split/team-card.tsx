import { getTeamPresentation, teamStyles } from "./team-presentation";
import { TeamMemberRow } from "./team-member-row";
import { TeamMetric } from "./team-metric";
import type { TeamSplitTeam } from "./types";

type TeamCardProps = {
  index: number;
  team: TeamSplitTeam;
};

export function TeamCard({ index, team }: TeamCardProps) {
  const presentation = getTeamPresentation(index);
  const style = teamStyles[presentation.color];

  return (
    <article
      className={`group relative overflow-hidden border ${style.border} bg-card transition-transform duration-300 hover:-translate-y-1`}
    >
      <div
        aria-hidden="true"
        className={`absolute -right-16 -top-16 size-40 rounded-full ${style.glow} opacity-8 blur-3xl transition-opacity group-hover:opacity-18`}
      />
      <div className={`h-1 w-full ${style.line}`} />
      <div className="relative p-5 sm:p-6">
        <div className="border-b border-border/50 pb-5">
          <h3 className="flex items-baseline gap-2 text-2xl font-black tracking-[-0.045em]">
            <span className={`font-mono text-3xl tracking-[-0.06em] ${style.text}`}>
              {presentation.number}
            </span>
            <span className="text-muted-foreground text-sm">UNIT</span>
          </h3>
        </div>

        <div className="grid grid-cols-2 border-b border-border/50">
          <TeamMetric
            label="AVG DMG"
            value={
              team.averageDamage === null
                ? "-"
                : Math.round(team.averageDamage).toLocaleString("ko-KR")
            }
          />
          <TeamMetric
            label="AVG RANK"
            value={
              team.averageRank === null
                ? "-"
                : `#${team.averageRank.toFixed(1)}`
            }
          />
        </div>

        <ol className="mt-2">
          {team.members.map((member, memberIndex) => (
            <TeamMemberRow
              accentClassName={style.text}
              index={memberIndex}
              key={member.discordUserId}
              member={member}
            />
          ))}
        </ol>

        <div className="mt-3 flex items-center justify-between text-[8px] font-bold tracking-[0.18em] text-muted-foreground">
          <span>{team.members.length}/4 DEPLOYED</span>
          <span className={`flex items-center gap-1.5 ${style.text}`}>
            <span className={`size-1.5 rounded-full ${style.line}`} /> READY
          </span>
        </div>
      </div>
    </article>
  );
}
