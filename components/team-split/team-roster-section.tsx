import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { TeamCard } from "./team-card";
import type { TeamSplitTeam } from "./types";

type TeamRosterSectionProps = {
  teams: TeamSplitTeam[];
};

export function TeamRosterSection({ teams }: TeamRosterSectionProps) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:32px_32px]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-360 px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-black tracking-[0.26em] text-primary">
              TOURNAMENT ROSTER
            </p>
            <h2 className="text-3xl font-black tracking-[-0.045em] sm:text-4xl">
              BOBO 대진표
            </h2>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {teams.map((team, index) => (
            <TeamCard index={index} key={team.id} team={team} />
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/50 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground">
            BOBO CLAN TOURNAMENT CONTROL
          </p>
          <div className="flex flex-wrap gap-5">
            <Link
              className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
              href="/members"
            >
              클랜원 보기 <ArrowUpRight className="size-3.5" />
            </Link>
            <Link
              className="inline-flex items-center gap-2 text-xs font-bold text-primary transition-colors hover:text-primary-hover"
              href="/matches"
            >
              최근 전적 보기 <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

