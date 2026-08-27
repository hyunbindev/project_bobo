export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const [{ logger }, { default: clanMatchSyncJob }, { default: schedulerCronJob }] =
    await Promise.all([
      import("./lib/logger"),
      import("./lib/sync/match/match-sync-job"),
      import("./lib/sync/scheduler"),
    ]);

  logger.info(
    { event: "application.instrumentation_registered" },
    "Application instrumentation registered",
  );

  void clanMatchSyncJob();
  schedulerCronJob();
}
