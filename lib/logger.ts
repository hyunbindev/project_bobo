import "server-only";

import pino from "pino";
import pinoPretty from "pino-pretty";

const globalForLogger = globalThis as unknown as {
  logger?: pino.Logger;
};

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

if (process.env.NODE_ENV !== "production") {
  globalForLogger.logger = logger;
}
