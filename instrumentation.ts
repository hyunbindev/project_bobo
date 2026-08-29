export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const [
    { logger },
    { startDiscordBot },
    { default: clanMatchSyncJob },
    { default: schedulerCronJob },
  ] = await Promise.all([
    import("./lib/logger"),
    import("./lib/discord/runtime/discord-client"),
    import("./lib/sync/match/match-sync-job"),
    import("./lib/sync/scheduler"),
  ]);

  logger.info(
    { event: "application.instrumentation_registered" },
    "Application instrumentation registered",
  );

  void clanMatchSyncJob();
  schedulerCronJob();
  // 로그인 실패는 Discord runtime에서 기록한다. 여기서는 실패가 Next 서버의
  // 시작까지 중단시키지 않도록 background task로 실행한다.
  void startDiscordBot().catch(() => undefined);
}
