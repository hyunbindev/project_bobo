import cron from "node-cron";

import { schedulerLogger } from "@/lib/logger";
import clanMatchSyncJob from "./match/match-sync-job";

const MATCH_SYNC_SCHEDULE = "* * * * *";

export default function schedulerCronJob() {
  cron.schedule(MATCH_SYNC_SCHEDULE, () => {
    void clanMatchSyncJob();
  });

  schedulerLogger.info(
    {
      event: "match_sync.scheduler_registered",
      schedule: MATCH_SYNC_SCHEDULE,
    },
    "Match sync scheduler registered",
  );
}
