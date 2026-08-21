import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const globalForDatabase = globalThis as unknown as {
  postgresPool?: Pool;
};

export const pool =
  globalForDatabase.postgresPool ??
  new Pool({
    connectionString: databaseUrl,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.postgresPool = pool;
}

export const db = drizzle({ client: pool });
