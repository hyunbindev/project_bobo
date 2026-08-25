import type { LucideIcon } from "lucide-react";

import type { AwardResult, AwardUnit } from "@/lib/awards/types";
import { cn } from "@/lib/utils";

export type AwardTheme = {
  icon: LucideIcon;
  accent: string;
  glow: string;
  hoverBorder: string;
};

export function AwardCard({
  award,
  theme,
}: {
  award: AwardResult;
  theme: AwardTheme;
}) {
  const Icon = theme.icon;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-sm border border-border/60 bg-card transition-colors",
        theme.hoverBorder,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-14 -top-14 size-40 rounded-full blur-3xl",
          theme.glow,
        )}
      />
      <div className="relative border-b border-border/50 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[8px] font-black tracking-[0.22em] text-muted-foreground">
              {award.label}
            </p>
            <h3
              className={cn(
                "mt-2 flex items-center gap-2 text-2xl font-black tracking-[-0.04em]",
                theme.accent,
              )}
            >
              <Icon className="inline size-6" />
              <span>{award.title}</span>
            </h3>
          </div>
        </div>
        <p className="mt-4 min-h-10 text-[11px] leading-5 text-muted-foreground">
          {award.description}
        </p>
      </div>

      <ol className="relative divide-y divide-border/45 px-5 sm:px-6">
        {award.rankings.length === 0 && (
          <li className="py-8 text-center text-[10px] font-bold text-muted-foreground">
            집계 조건을 충족한 기록이 없어
          </li>
        )}
        {award.rankings.map((ranker, index) => (
          <li
            className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 py-3.5"
            key={ranker.playerId}
          >
            <span
              className={cn(
                "font-mono font-black text-foreground/30",
                index === 0 && `text-xl ${theme.accent}`,
              )}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p
                className={cn(
                  "truncate font-black",
                  index === 0 ? "text-xl" : "text-sm",
                  index === 0 && theme.accent,
                )}
              >
                {ranker.playerName}
              </p>
              <p className="mt-0.5 truncate text-[9px] font-semibold text-muted-foreground">
                {ranker.matchCount}경기
              </p>
            </div>
            <strong
              className={cn("text-sm font-black", index === 0 && theme.accent)}
            >
              {formatAwardValue(ranker.value, award.unit)}
              <span className="ml-0.5 text-[10px]">{award.unit}</span>
            </strong>
          </li>
        ))}
      </ol>
    </article>
  );
}

function formatAwardValue(value: number, unit: AwardUnit) {
  if (unit === "킬" || unit === "P") {
    return Math.round(value).toLocaleString("ko-KR");
  }

  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}
