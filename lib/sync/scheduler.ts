import cron from "node-cron";
import clanMatchSyncJob from "./match/match-sync-job";

export default function schedulerCronJob(){
    cron.schedule("* * * * *", async () => {
        console.log("매분 실행");
        clanMatchSyncJob()
    });
}
