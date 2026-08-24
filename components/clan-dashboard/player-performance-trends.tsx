import {
  PlayerTrendChart,
  type PlayerTrendMetric,
} from "@/components/clan-dashboard/player-trend-chart";

export type { PlayerTrendMetric } from "@/components/clan-dashboard/player-trend-chart";

export function PlayerPerformanceTrends({
  metrics,
}: {
  metrics: PlayerTrendMetric[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {metrics.map((metric) => (
        <PlayerTrendChart key={metric.label} metric={metric} />
      ))}
    </div>
  );
}
