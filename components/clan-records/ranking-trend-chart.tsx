"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Sparkles,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type RankingTrendPlayer = {
  key: string;
  name: string;
  color: string;
};

export type RankingTrendPoint = {
  week: string;
  [playerKey: string]: number | string | null;
};

export type RankingTrend = {
  code: string;
  label: string;
  title: string;
  description: string;
  players: RankingTrendPlayer[];
  points: RankingTrendPoint[];
};

export function RankingTrendChart({
  featured = false,
  ranking,
}: {
  featured?: boolean;
  ranking: RankingTrend;
}) {
  const chartConfig = Object.fromEntries(
    ranking.players.map((player) => [
      player.key,
      { label: player.name, color: player.color },
    ]),
  ) satisfies ChartConfig;
  const maxRank = Math.max(
    4,
    ...ranking.points.flatMap((point) =>
      ranking.players.map((player) => {
        const value = point[player.key];
        return typeof value === "number" ? value : 0;
      }),
    ),
  );
  const latestPoint = ranking.points.at(-1);
  const previousPoint = ranking.points.at(-2);
  const rankedPlayers = ranking.players
    .map((player) => ({
      ...player,
      currentRank: getRank(latestPoint, player.key),
      previousRank: getRank(previousPoint, player.key),
    }))
    .sort(
      (left, right) =>
        (left.currentRank ?? Number.MAX_SAFE_INTEGER) -
        (right.currentRank ?? Number.MAX_SAFE_INTEGER),
    );

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-sm border bg-card",
        featured
          ? "border-primary/40 shadow-[0_0_60px_-30px_var(--primary)]"
          : "border-border/60",
      )}
    >
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-[0.06]" />
      <div
        className={cn(
          "pointer-events-none absolute -right-20 -top-20 size-56 rounded-full blur-3xl",
          featured ? "bg-primary/15" : "bg-primary/7",
        )}
      />

      <header className="relative border-b border-border/50 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[8px] font-black tracking-[0.24em] text-primary">
              {ranking.label}
            </p>
            <h2
              className={cn(
                "mt-2 font-black tracking-[-0.045em]",
                featured ? "text-3xl sm:text-4xl" : "text-2xl",
              )}
            >
              {ranking.title}
            </h2>
            <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
              {ranking.description}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-[8px] font-black tracking-wider text-success">
            <Sparkles className="size-3" /> 6 WEEK TREND
          </span>
        </div>
      </header>

      <div
        className="relative grid lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"
      >
        <div className="min-w-0 p-4 sm:p-6">
          <ChartContainer
            className={cn(
              "w-full aspect-auto",
              featured ? "h-96" : "h-80",
            )}
            config={chartConfig}
            initialDimension={
              featured
                ? { width: 900, height: 360 }
                : { width: 560, height: 256 }
            }
          >
            <LineChart
              accessibilityLayer
              data={ranking.points}
              margin={{ bottom: 4, left: 0, right: 12, top: 12 }}
            >
              <CartesianGrid strokeDasharray="4 8" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="week"
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                domain={[1, maxRank]}
                reversed
                tickFormatter={(value) => `#${value}`}
                tickLine={false}
                width={32}
              />
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
                cursor={{ strokeDasharray: "4 6" }}
              />
              <ChartLegend content={<ChartLegendContent />} />
              {ranking.players.map((player) => (
                <Line
                  activeDot={{ r: 5 }}
                  animationDuration={1500}
                  connectNulls={false}
                  dataKey={player.key}
                  dot={{ r: featured ? 3 : 2 }}
                  key={player.key}
                  stroke={`var(--color-${player.key})`}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={featured ? 3 : 2.5}
                  type="linear"
                />
              ))}
            </LineChart>
          </ChartContainer>
        </div>

        <aside
          className="border-t border-border/50 bg-background/20 lg:border-l lg:border-t-0"
        >
          <div className="border-b border-border/50 px-5 py-4">
            <p className="text-[8px] font-black tracking-[0.22em] text-muted-foreground">
              WEEK 35 · FINAL RANK
            </p>
            <p className="mt-1 text-xs font-black">선택 주차 순위</p>
          </div>
          <ol className="divide-y divide-border/45 px-5">
            {rankedPlayers.map((player) => (
              <li
                className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2 py-4"
                key={player.key}
              >
                <span
                  className={cn(
                    "font-mono text-base font-black text-foreground/45",
                    player.currentRank === 1 && "text-2xl text-primary",
                  )}
                >
                  {player.currentRank === null
                    ? "—"
                    : String(player.currentRank).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "truncate text-xs font-black",
                      player.currentRank === 1 && "text-base text-primary",
                    )}
                  >
                    {player.name}
                  </p>
                  <p className="mt-1 text-[8px] font-semibold text-muted-foreground">
                    PREV {player.previousRank ? `#${player.previousRank}` : "—"}
                  </p>
                </div>
                <RankDelta
                  current={player.currentRank}
                  previous={player.previousRank}
                />
              </li>
            ))}
          </ol>
          <div className="border-t border-border/50 px-5 py-3 text-[8px] font-semibold leading-4 text-muted-foreground">
            이전 확정 주차 대비 순위 변동
          </div>
        </aside>
      </div>
    </article>
  );
}

function getRank(point: RankingTrendPoint | undefined, key: string) {
  const value = point?.[key];
  return typeof value === "number" ? value : null;
}

function RankDelta({
  current,
  previous,
}: {
  current: number | null;
  previous: number | null;
}) {
  if (current === null) {
    return <span className="text-[8px] font-black text-muted-foreground">OUT</span>;
  }

  if (previous === null) {
    return <span className="text-[8px] font-black text-info">NEW</span>;
  }

  const delta = previous - current;

  if (delta > 0) {
    return <span className="inline-flex items-center text-[9px] font-black text-success"><ArrowUpRight className="size-3" />{delta}</span>;
  }

  if (delta < 0) {
    return <span className="inline-flex items-center text-[9px] font-black text-kill"><ArrowDownRight className="size-3" />{Math.abs(delta)}</span>;
  }

  return <span className="inline-flex items-center text-[9px] font-black text-muted-foreground"><Minus className="size-3" />0</span>;
}
