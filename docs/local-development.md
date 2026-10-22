# Local database

Copy `.env.example` to `.env.local` and keep `POSTGRES_PASSWORD` and the password in `DATABASE_URL` identical. Next.js and Drizzle Kit both load `.env.local`.

```sh
npm run db:up
npm run db:migrate
npm run db:ping
npm run dev
```

The development database is PostgreSQL 17 at `127.0.0.1:5433`. Use the database name, username, and password from `.env.local` in your database client.

`compose.local.yaml` uses the separate `project-bobo-local` Compose project and its own persistent volume. It runs only PostgreSQL; the web application runs on the host with `npm run dev`.

```sh
npm run db:stop
npm run db:up
npm run db:logs
```

Stopping the container keeps its data. Database initialization does not import production data. Discord credentials are optional for web development.

For initial PUBG synchronization, set `PUBG_API_KEY` and `PUBG_CLAN_MASTER_ID` (the master's `account.…` ID) in `.env.local`, then start or restart the web application. If the main clan is missing, the sync job looks up the master on the configured match-sync platform (currently Kakao), fetches their clan, and saves the clan, player, and membership in one transaction. The profile remains unregistered until the user fills it in. If `PUBG_CLAN_ID` is supplied, the master's clan must match it. A failed lookup or save is retried on the next scheduled run. Once the main clan exists, this initialization does not call the PUBG API again.

If port 5433 is occupied, update both `POSTGRES_PORT` and the port in `DATABASE_URL` before starting the database. Changing initialization credentials after the volume has been created does not change existing database users or passwords.
