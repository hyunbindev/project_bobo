"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type {
  PlayerTrendMetric,
  PlayerTrendPoint,
} from "@/lib/player-stat-types";

const toneClasses = {
  primary: "text-primary",
  info: "text-info",
  support: "text-support",
};

const toneColors = {
  primary: "var(--primary)",
  info: "var(--info)",
  support: "var(--support)",
};

export function PlayerTrendChart({ metric }: { metric: PlayerTrendMetric }) {
  const chartConfig = {
    value: {
      label: "경기 기록",
      color: toneColors[metric.tone],
    },
    movingAverage: {
      label: `${metric.movingAverageSize}경기 이동평균`,
      color: toneColors[metric.tone],
    },
  } satisfies ChartConfig;

  return (
    <article className="rounded-sm border border-border/60 bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-black tracking-[0.18em] text-muted-foreground">
            {metric.label}
          </p>
          <p className="mt-2 text-3xl font-black tracking-[-0.05em]">
            {metric.currentValue}
          </p>
        </div>
        <span
          className={`rounded-sm border border-current/25 bg-current/5 px-2 py-1 text-[9px] font-black ${toneClasses[metric.tone]}`}
        >
          {metric.change}
        </span>
      </div>

      {metric.points.length === 0 ? (
        <div className="mt-6 grid h-36 place-items-center border-y border-dashed border-border/50 text-[9px] font-black tracking-[0.15em] text-muted-foreground">
          집계 가능한 경기가 없습니다
        </div>
      ) : (
        <ChartContainer
          className="mt-6 h-36 w-full aspect-auto"
          config={chartConfig}
        >
          <LineChart
            accessibilityLayer
            data={metric.points}
            margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="4 8" vertical={false} />
            <XAxis axisLine={false} dataKey="match" tickLine={false} />
            <YAxis
              axisLine={false}
              domain={["dataMin", "dataMax"]}
              hide
              reversed={metric.lowerIsBetter}
              tickLine={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(_, payload) =>
                    formatTooltipLabel(payload[0]?.payload as PlayerTrendPoint)
                  }
                />
              }
              cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
            />
            {metric.baseline !== null && (
              <ReferenceLine
                stroke="var(--muted-foreground)"
                strokeDasharray="3 5"
                strokeOpacity={0.55}
                y={metric.baseline}
              />
            )}
            <Line
              activeDot={{ r: 4 }}
              dataKey="value"
              dot={{ fill: "var(--card)", r: 2, strokeWidth: 1.5 }}
              stroke="var(--color-value)"
              strokeOpacity={0.35}
              strokeWidth={1.5}
              type="linear"
            />
            <Line
              activeDot={{ r: 5 }}
              connectNulls={false}
              dataKey="movingAverage"
              dot={false}
              stroke="var(--color-movingAverage)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              type="monotone"
            />
          </LineChart>
        </ChartContainer>
      )}

      <div className="flex items-center justify-between border-t border-border/50 pt-3 text-[8px] font-bold tracking-[0.13em] text-muted-foreground">
        <span>조회 범위 시작</span>
        <span>{metric.description}</span>
        <span>최신 경기</span>
      </div>
    </article>
  );
}

const mapLabels: Record<string, string> = {
  Baltic_Main: "ERANGEL",
  Chimera_Main: "PARAMO",
  Desert_Main: "MIRAMAR",
  DihorOtok_Main: "VIKENDI",
  Heaven_Main: "HAVEN",
  Kiki_Main: "DESTON",
  Range_Main: "CAMP JACKAL",
  Savage_Main: "SANHOK",
  Summerland_Main: "KARAKIN",
  Tiger_Main: "TAEGO",
};

function formatTooltipLabel(point: PlayerTrendPoint | undefined) {
  if (!point) {
    return "";
  }

  const date = new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(point.playedAt));
  const mapName =
    mapLabels[point.mapName] ??
    point.mapName.replace(/_Main$/i, "").toUpperCase();
  const gameMode = point.gameMode.replaceAll("-", " ").toUpperCase();

  return `${date} · ${mapName} · ${gameMode}`;
}
