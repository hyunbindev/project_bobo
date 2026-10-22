import assert from "node:assert/strict";
import { test } from "node:test";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import Module, { createRequire } from "node:module";

// Run against a development database; all writes are confined to connection-local tables.
test("main clan bootstrap initializes once, validates upstream data, and rolls back failed saves", {
  skip: !process.env.TEST_DATABASE_URL,
}, async (context) => {
  process.env.DATABASE_URL ??= process.env.TEST_DATABASE_URL;
  const envKeys = ["PUBG_API_KEY", "PUBG_CLAN_ID", "PUBG_CLAN_MASTER_ID"] as const;
  const savedEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  // Match Next.js's server-only alias when importing server modules in Node tests.
  const resolver = Module as unknown as {
    _resolveFilename(request: string, ...args: unknown[]): string;
  };
  const originalResolve = resolver._resolveFilename;
  const require = createRequire(`${process.cwd()}/package.json`);
  const alias = context.mock.method(resolver, "_resolveFilename", function (this: typeof resolver, request: string, ...args: unknown[]) {
    if (request === "server-only") return require.resolve("next/dist/compiled/server-only/empty.js");
    return originalResolve.call(this, request, ...args);
  });
  const { db } = await import("../lib/db");
  const { prepareMatchSyncTask } = await import("../lib/sync/match/tasks/prepare-match-sync-task");
  alias.mock.restore();
  const client = new Client({ connectionString: process.env.TEST_DATABASE_URL });
  await client.connect();
  const database = drizzle({ client });
  context.mock.method(db, "select", database.select.bind(database));
  context.mock.method(db, "transaction", database.transaction.bind(database));

  const accountId = "account.test-master";
  const clanId = "clan.test-main";
  const playerResponse = (playerClanId: string | null = clanId, id = accountId) => ({
    data: [{ type: "player", id, attributes: { name: "Master", shardId: "kakao", clanId: playerClanId },
      relationships: { matches: { data: [{ type: "match", id: "recent-match" }] } } }],
  });
  const clanResponse = {
    data: { type: "clan", id: clanId, attributes: {
      clanName: "Test Clan", clanTag: "TEST", clanLevel: 5, clanMemberCount: 20,
    } },
  };
  const counts = async () => (await client.query(
    "select (select count(*)::int from clans) as clans, (select count(*)::int from players) as players, (select count(*)::int from clan_members) as members",
  )).rows[0];
  const reset = async () => {
    await client.query("truncate clan_members, players, clans");
    process.env.PUBG_API_KEY = "test-api-key";
    process.env.PUBG_CLAN_MASTER_ID = ` ${accountId} `;
    delete process.env.PUBG_CLAN_ID;
  };

  try {
    await client.query(`
      create temp table clans (
        id uuid primary key default gen_random_uuid(), pubg_clan_id text not null,
        platform text not null, name text not null, tag text not null,
        level integer not null, member_count integer not null,
        last_synced_at timestamptz not null default now(),
        created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
        unique(platform, pubg_clan_id)
      );
      create temp table players (
        id uuid primary key default gen_random_uuid(), pubg_account_id text not null,
        name text not null, platform text not null, pubg_clan_id text,
        last_synced_at timestamptz not null default now(), created_at timestamptz not null default now(),
        unique(platform, pubg_account_id)
      );
      create temp table clan_members (
        id uuid primary key default gen_random_uuid(), clan_id uuid not null references clans(id),
        player_id uuid not null references players(id), display_name text, birth_year integer,
        status text not null default 'active', profile_registered boolean not null default false,
        joined_at timestamptz not null default now(), left_at timestamptz,
        created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
        unique(clan_id, player_id),
        check (not profile_registered or (display_name is not null and birth_year is not null))
      );
    `);

    await context.test("empty database is initialized and the master participates in the same sync cycle", async (subtest) => {
      await reset();
      process.env.PUBG_CLAN_ID = ` ${clanId} `;
      const requests: URL[] = [];
      subtest.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
        const url = new URL(String(input));
        requests.push(url);
        return Response.json(url.pathname.endsWith("/players") ? playerResponse() : clanResponse);
      });
      const result = await prepareMatchSyncTask();
      assert.equal(result.targetClanId, clanId);
      assert.equal(result.targetClan.name, "Test Clan");
      assert.equal(result.targetClan.memberCount, 20);
      assert.deepEqual(result.memberAccountIds, [accountId]);
      assert.ok(result.clanPubgAccountIds.has(accountId));
      assert.deepEqual(await counts(), { clans: 1, players: 1, members: 1 });
      assert.equal(requests.length, 2);
      assert.equal(requests[0].pathname, "/shards/kakao/players");
      assert.equal(requests[0].searchParams.get("filter[playerIds]"), accountId);
      assert.equal(requests[1].pathname, `/shards/kakao/clans/${clanId}`);
      const member = (await client.query("select status, profile_registered, display_name, birth_year from clan_members")).rows[0];
      assert.deepEqual(member, { status: "active", profile_registered: false, display_name: null, birth_year: null });

      delete process.env.PUBG_CLAN_MASTER_ID;
      delete process.env.PUBG_API_KEY;
      await prepareMatchSyncTask();
      assert.equal(requests.length, 2);
      assert.deepEqual(await counts(), { clans: 1, players: 1, members: 1 });
    });

    await context.test("master account is required only when the main clan is absent", async (subtest) => {
      await reset();
      delete process.env.PUBG_CLAN_MASTER_ID;
      const fetchMock = subtest.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected API request"); });
      await assert.rejects(prepareMatchSyncTask(), /Set PUBG_CLAN_MASTER_ID/);
      assert.equal(fetchMock.mock.calls.length, 0);
      assert.deepEqual(await counts(), { clans: 0, players: 0, members: 0 });
    });

    for (const scenario of [
      { name: "missing player", response: { data: [] }, expected: /master was not found/ },
      { name: "unexpected player", response: playerResponse(clanId, "account.other"), expected: /master was not found/ },
      { name: "clanless master", response: playerResponse(null), expected: /does not belong to a PUBG clan/ },
      { name: "different configured clan", response: playerResponse(), configuredClan: "clan.other", expected: /does not belong to PUBG_CLAN_ID/ },
    ]) {
      await context.test(scenario.name, async (subtest) => {
        await reset();
        if (scenario.configuredClan) process.env.PUBG_CLAN_ID = scenario.configuredClan;
        const fetchMock = subtest.mock.method(globalThis, "fetch", async () => Response.json(scenario.response));
        await assert.rejects(prepareMatchSyncTask(), scenario.expected);
        assert.equal(fetchMock.mock.calls.length, 1);
        assert.deepEqual(await counts(), { clans: 0, players: 0, members: 0 });
      });
    }

    await context.test("API failure leaves the database empty and the next call retries successfully", async (subtest) => {
      await reset();
      let fail = true;
      subtest.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
        if (String(input).includes("/players?")) return Response.json(playerResponse());
        return fail ? new Response(null, { status: 429, headers: { "Retry-After": "1" } }) : Response.json(clanResponse);
      });
      await assert.rejects(prepareMatchSyncTask(), { status: 429, retryAfter: "1" });
      assert.deepEqual(await counts(), { clans: 0, players: 0, members: 0 });
      fail = false;
      assert.equal((await prepareMatchSyncTask()).targetClanId, clanId);
      assert.deepEqual(await counts(), { clans: 1, players: 1, members: 1 });
    });

    await context.test("membership insert failure rolls back the clan and player too", async (subtest) => {
      await reset();
      subtest.mock.method(globalThis, "fetch", async (input: string | URL | Request) => Response.json(String(input).includes("/players?") ? playerResponse() : clanResponse));
      await client.query(`
        create function pg_temp.reject_bootstrap() returns trigger language plpgsql as $$
        begin raise exception 'test membership failure'; end $$;
        create trigger reject_bootstrap before insert on clan_members
          for each row execute function pg_temp.reject_bootstrap();
      `);
      await assert.rejects(prepareMatchSyncTask());
      assert.deepEqual(await counts(), { clans: 0, players: 0, members: 0 });
      await client.query("drop trigger reject_bootstrap on clan_members");
      assert.equal((await prepareMatchSyncTask()).targetClanId, clanId);
    });
  } finally {
    await client.end();
    for (const key of envKeys) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
  }
});
