"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type PlayerTrendMetric = {
  label: string;
  currentValue: string;
  change: string;
  description: string;
  values: number[];
  tone: "primary" | "info" | "support";
  lowerIsBetter?: boolean;
};

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
  const chartData = metric.values.map((value, index) => ({
    match: index + 1,
    value,
  }));
  const chartConfig = {
    value: {
      label: metric.label,
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

      <ChartContainer
        className="mt-6 h-36 w-full aspect-auto"
        config={chartConfig}
      >
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="4 8" vertical={false} />
          <XAxis axisLine={false} dataKey="match" hide tickLine={false} />
          <YAxis
            axisLine={false}
            domain={["dataMin", "dataMax"]}
            hide
            reversed={metric.lowerIsBetter}
            tickLine={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent hideLabel indicator="line" nameKey="value" />
            }
            cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
          />
          <Line
            activeDot={{ r: 5 }}
            dataKey="value"
            dot={{ fill: "var(--card)", r: 3, strokeWidth: 2 }}
            stroke="var(--color-value)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            type="monotone"
          />
        </LineChart>
      </ChartContainer>

      <div className="flex items-center justify-between border-t border-border/50 pt-3 text-[8px] font-bold tracking-[0.13em] text-muted-foreground">
        <span>10 MATCHES AGO</span>
        <span>{metric.description}</span>
        <span>LATEST</span>
      </div>
    </article>
  );
}
