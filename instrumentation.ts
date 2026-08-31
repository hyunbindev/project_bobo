export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const [
    { discordLogger, webLogger },
    { registerDiscordCommands },
    { startDiscordBot },
    { sendDiscordStartupMessage },
    { default: clanMatchSyncJob },
    { default: schedulerCronJob },
  ] = await Promise.all([
    import("./lib/logger"),
    import("./lib/discord/runtime/register-discord-commands"),
    import("./lib/discord/runtime/discord-client"),
    import("./lib/discord/messages/send-discord-startup-message"),
    import("./lib/sync/match/match-sync-job"),
    import("./lib/sync/scheduler"),
  ]);

  webLogger.info(
    { event: "application.instrumentation_registered" },
    "Application instrumentation registered",
  );

  void clanMatchSyncJob();
  schedulerCronJob();
  // 단일 인스턴스 시작 시 명령 명세를 먼저 갱신한 뒤 Gateway에 연결한다.
  // Discord 실패가 웹 서버 시작을 중단시키지 않도록 background task로 실행한다.
  void registerDiscordCommands()
    .then(async () => {
      await startDiscordBot();
      //개발 테스트용 메세지 전송
      //await sendDiscordStartupMessage();
    })
    .catch((error: unknown) => {
      discordLogger.error(
        {
          err: error,
          event: "discord.initialization_failed",
        },
        "Failed to initialize Discord",
      );
    });
}
