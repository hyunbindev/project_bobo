import cron from "node-cron";

import { logger } from "@/lib/logger";
import clanMatchSyncJob from "./match/match-sync-job";

const MATCH_SYNC_SCHEDULE = "* * * * *";

export default function schedulerCronJob() {
  cron.schedule(MATCH_SYNC_SCHEDULE, () => {
    void clanMatchSyncJob();
  });

  logger.info(
    {
      event: "match_sync.scheduler_registered",
      schedule: MATCH_SYNC_SCHEDULE,
    },
    "Match sync scheduler registered",
  );
}
