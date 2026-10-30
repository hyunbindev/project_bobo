import {
  PlayerTrendChart,
} from "@/components/player-stats/player-trend-chart";
import type { PlayerTrendMetric } from "@/lib/player-stats/types";

export type { PlayerTrendMetric } from "@/lib/player-stats/types";

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
