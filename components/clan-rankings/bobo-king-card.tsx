import { Crown } from "lucide-react";

import { AnimatedRankingValue } from "@/components/clan-rankings/animated-ranking-value";
import type { RankingResult } from "@/lib/rankings/types";
import { cn } from "@/lib/utils";

export function BoboKingCard({ ranking }: { ranking: RankingResult }) {
  return (
    <article className="group relative mx-auto mb-8 w-full max-w-5xl overflow-hidden rounded-sm border border-primary/35 bg-card shadow-[0_0_50px_-25px_var(--primary)] transition-colors hover:border-primary/60">
      <div className="pointer-events-none absolute left-1/2 top-0 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-10" />

      <div className="relative flex flex-col items-center border-b border-border/50 px-6 py-8 text-center sm:px-10">
        <span className="grid size-14 place-items-center rounded-full border border-primary/35 bg-primary/10 text-primary">
          <Crown className="size-7" />
        </span>
        <p className="mt-5 text-[10px] font-black tracking-[0.32em] text-primary">
          {ranking.title}
        </p>
        <p className="mt-4 text-xs leading-5 text-muted-foreground sm:text-sm">
          {ranking.description}
        </p>
      </div>

      <ol className="relative divide-y divide-border/45 px-5 sm:px-8">
        {ranking.rankings.length === 0 && (
          <li className="py-10 text-center text-[10px] font-bold text-muted-foreground">
            아직 경기 결과가 없습니다.
          </li>
        )}
        {ranking.rankings.map((ranker, index) => (
          <li
            className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-4 py-4 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:px-4"
            key={ranker.playerId}
          >
            <span
              className={cn(
                "font-mono font-black text-foreground/30",
                index === 0 && "text-2xl text-primary",
              )}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex min-w-0 items-center gap-3">
              {index === 0 && (
                <Crown className="size-5 shrink-0 text-primary" />
              )}
              <p
                className={cn(
                  "truncate font-black",
                  index === 0 ? "text-2xl text-primary" : "text-sm",
                )}
              >
                {ranker.playerName}
              </p>
              <p className="mt-0.5 truncate text-[9px] font-semibold text-muted-foreground">
                {ranker.matchCount}경기
              </p>
            </div>
            <strong
              className={cn(
                "text-sm font-black",
                index === 0 && "text-lg text-primary",
              )}
            >
              <AnimatedRankingValue unit={ranking.unit} value={ranker.value} />
              <span className="ml-1 text-[10px]">{ranking.unit}</span>
            </strong>
          </li>
        ))}
      </ol>
    </article>
  );
}
