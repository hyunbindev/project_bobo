import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js와 Drizzle Kit이 동일한 로컬 환경 변수를 사용하게 한다.
config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
