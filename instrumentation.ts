import clanMatchSyncJob from "./lib/sync/match/match-sync-job";
import schedulerCronJob from "./lib/sync/scheduler";

export function register(){
    clanMatchSyncJob()
    console.log("Cron job registered");
    schedulerCronJob();
}