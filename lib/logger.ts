import "server-only";

import pino from "pino";
import pinoPretty from "pino-pretty";

const globalForLogger = globalThis as unknown as {
  logger?: pino.Logger;
};

const DISABLED_VALUES = new Set(["false", "0", "off", "no"]);

const loggerOptions: pino.LoggerOptions = {
  name: "project-bobo",
  level: process.env.LOG_LEVEL ?? "info",
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: "project-bobo",
    environment: process.env.NODE_ENV ?? "development",
  },
  serializers: {
    err: pino.stdSerializers.err,
  },
  redact: {
    paths: [
      "password",
      "*.password",
      "authorization",
      "*.authorization",
      "headers.authorization",
      "req.headers.authorization",
      "apiKey",
      "*.apiKey",
      "env.DATABASE_URL",
      "env.PUBG_API_KEY",
      "env.DISCORD_BOT_TOKEN",
    ],
    censor: "[REDACTED]",
  },
};

function createLogger() {
  if (process.env.LOG_PRETTY?.toLowerCase() !== "true") {
    return pino(loggerOptions);
  }

  return pino(
    loggerOptions,
    pinoPretty({
      colorize: Boolean(process.stdout.isTTY),
      levelFirst: true,
      translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
      ignore: "pid,hostname,name,service,environment",
    }),
  );
}

export const logger =
  globalForLogger.logger ??
  createLogger();

function createCategoryLogger(category: string, enabledValue?: string) {
  const enabled = !DISABLED_VALUES.has(enabledValue?.trim().toLowerCase() ?? "");

  return logger.child(
    { logCategory: category },
    { level: enabled ? logger.level : "silent" },
  );
}

/** Next.js 애플리케이션 시작 및 API 요청 처리 로그다. */
export const webLogger = createCategoryLogger(
  "web",
  process.env.LOG_WEB_ENABLED,
);

/** Cron 등록 및 매치 동기화 작업 로그다. */
export const schedulerLogger = createCategoryLogger(
  "scheduler",
  process.env.LOG_SCHEDULER_ENABLED,
);

/** Discord Gateway 연결 및 명령 처리 로그다. */
export const discordLogger = createCategoryLogger(
  "discord",
  process.env.LOG_DISCORD_ENABLED,
);

if (process.env.NODE_ENV !== "production") {
  globalForLogger.logger = logger;
}
