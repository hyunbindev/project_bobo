import pg from "pg";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not configured.");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

try {
  const result = await pool.query(
    "select current_database() as database, current_user as username, version() as version",
  );
  const connection = result.rows[0];

  console.log(`PostgreSQL connected: ${connection.database} (${connection.username})`);
  console.log(connection.version);
} catch (error) {
  console.error("PostgreSQL connection failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
