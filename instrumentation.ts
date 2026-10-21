export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const [
    { webLogger },
    { bootstrapDiscord },
    { default: clanMatchSyncJob },
    { default: schedulerCronJob },
  ] = await Promise.all([
    import("./lib/logger"),
    import("./lib/discord/bootstrap"),
    import("./lib/sync/match/match-sync-job"),
    import("./lib/sync/scheduler"),
  ]);

  webLogger.info(
    { event: "application.instrumentation_registered" },
    "Application instrumentation registered",
  );

  void clanMatchSyncJob();
  
  schedulerCronJob();

  
  void bootstrapDiscord();
}
