import { Clock3, Radio, Shield, Users } from "lucide-react";

import { TournamentStat } from "./tournament-stat";

type TeamSplitHeroProps = {
  createdAt: string;
  memberCount: number;
  teamCount: number;
};

export function TeamSplitHero({
  createdAt,
  memberCount,
  teamCount,
}: TeamSplitHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/50">
      <div className="hero-grid absolute inset-0 opacity-35" aria-hidden="true" />
      <div
        className="hero-glow absolute -left-40 top-8 size-110 rounded-full"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/70 to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-360 px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-5">
          <p className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.26em] text-primary">
            <Radio className="size-3.5 animate-pulse" /> LIVE SQUAD DRAW
          </p>
          <p className="font-mono text-[9px] font-bold tracking-[0.2em] text-muted-foreground">
            OPERATION // BOBO-{String(teamCount).padStart(2, "0")}
          </p>
        </div>

        <div className="grid gap-10 pt-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="mb-4 text-[10px] font-black tracking-[0.28em] text-muted-foreground">
              RANDOMIZED TEAM ASSIGNMENT
            </p>
            <h1 className="text-[clamp(3.25rem,8vw,7rem)] font-black leading-[0.82] tracking-[-0.075em]">
              <span className="military-glitch" data-text="BOBO">
                BOBO
              </span>
              <br />
              <span
                className="military-glitch military-glitch-primary text-primary"
                data-text="TEAM"
              >
                TEAM
              </span>
              <br />
              <span
                className="military-glitch military-glitch-primary text-primary"
                data-text="ROSTER"
              >
                ROSTER
              </span>
            </h1>
          </div>

          <div className="grid grid-cols-2 border border-border/60 bg-card/75 backdrop-blur-sm">
            <TournamentStat icon={Users} label="PLAYERS" value={memberCount} />
            <TournamentStat icon={Shield} label="SQUADS" value={teamCount} />
            <TournamentStat icon={Clock3} label="DRAW TIME" value={createdAt} wide />
          </div>
        </div>
      </div>
    </section>
  );
}

