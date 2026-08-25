import {
  PlayerTrendChart,
} from "@/components/clan-dashboard/player-trend-chart";
import type { PlayerTrendMetric } from "@/lib/player-stat-types";

export type { PlayerTrendMetric } from "@/lib/player-stat-types";

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
