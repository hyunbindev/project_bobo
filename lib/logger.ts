import "server-only";

import pino from "pino";

const globalForLogger = globalThis as unknown as {
  logger?: pino.Logger;
};

export const logger =
  globalForLogger.logger ??
  pino({
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
      ],
      censor: "[REDACTED]",
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForLogger.logger = logger;
}
