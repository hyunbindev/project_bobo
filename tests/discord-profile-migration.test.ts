import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import Module, { createRequire } from "node:module";
import { test } from "node:test";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

test("Discord 프로필 이관은 데이터와 연동을 보존하고 불명확한 데이터에서는 중단한다", {
  skip: !process.env.TEST_DATABASE_URL,
}, async (context) => {
  process.env.DATABASE_URL ??= process.env.TEST_DATABASE_URL;
  const resolver = Module as unknown as { _resolveFilename(request: string, ...args: unknown[]): string };
  const original = resolver._resolveFilename;
  const require = createRequire(`${process.cwd()}/package.json`);
  const alias = context.mock.method(resolver, "_resolveFilename", function (this: typeof resolver, request: string, ...args: unknown[]) {
    return request === "server-only" ? require.resolve("next/dist/compiled/server-only/empty.js") : original.call(this, request, ...args);
  });
  const { syncPlayersFromPubg, findActiveClanMembersByClanId, findClanMemberDetailByPlayerId } = await import("../lib/members/repository");
  const { findDiscordAccountsForPlayers, linkDiscordAccount } = await import("../lib/discord-accounts/repository");
  alias.mock.restore();
  const statements = (await readFile("drizzle/0008_move_clan_profiles_to_discord.sql", "utf8")
    + "\n--> statement-breakpoint\n"
    + await readFile("drizzle/0009_discord_nickname_sync.sql", "utf8"))
    .split("--> statement-breakpoint").filter((statement) => statement.trim());
  const client = new Client({ connectionString: process.env.TEST_DATABASE_URL });
  await client.connect();
  const database = drizzle({ client });
  const savedGuildId = process.env.DISCORD_GUILD_ID;
  process.env.DISCORD_GUILD_ID = "guild-a";

  // SQL은 연결 로컬 임시 테이블에만 실행한다.
  async function setup() {
    await client.query(`
      create temp table players (
        id uuid primary key default gen_random_uuid(), pubg_account_id text not null,
        name text not null, platform text not null, pubg_clan_id text,
        last_synced_at timestamptz not null default now(), created_at timestamptz not null default now(),
        unique(platform, pubg_account_id)
      ) on commit drop;
      create temp table clans (
        id uuid primary key, pubg_clan_id text not null,
        name text not null default 'BOBO', tag text not null default 'BOBO', level integer not null default 1
      ) on commit drop;
      create temp table clan_members (
        id uuid primary key, clan_id uuid not null references clans(id), player_id uuid not null references players(id),
        display_name text, birth_year integer, profile_registered boolean not null default false,
        status text not null default 'active', left_at timestamptz,
        joined_at timestamptz not null default now(), created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(), unique(clan_id,player_id),
        constraint clan_members_birth_year_range check(birth_year between 1900 and 2100),
        constraint clan_members_registered_profile_fields check(not profile_registered or (display_name is not null and birth_year is not null))
      ) on commit drop;
      create temp table clan_member_discord_accounts (
        id uuid primary key default gen_random_uuid(), clan_member_id uuid not null,
        discord_guild_id text not null, discord_user_id text not null,
        discord_display_name text not null, discord_username text not null,
        created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
        constraint clan_member_discord_accounts_clan_member_id_clan_members_id_fk
          foreign key(clan_member_id) references clan_members(id) on delete cascade,
        constraint clan_member_discord_guild_id_not_blank check(length(trim(discord_guild_id))>0),
        constraint clan_member_discord_user_id_not_blank check(length(trim(discord_user_id))>0)
      ) on commit drop;
      create unique index clan_member_discord_guild_user_unique on clan_member_discord_accounts(discord_guild_id,discord_user_id);
      create unique index clan_member_discord_member_guild_unique on clan_member_discord_accounts(clan_member_id,discord_guild_id);
      create index clan_member_discord_member_idx on clan_member_discord_accounts(clan_member_id);
    `);
    await client.query("insert into players(id,pubg_account_id,name,platform) values($1,'account.one','PUBG_ONE','kakao'),($2,'account.two','PUBG_TWO','kakao')", [uuid(1), uuid(2)]);
    await client.query("insert into clans(id,pubg_clan_id) values($1,'clan.bobo'),($2,'clan.other')", [uuid(100), uuid(101)]);
    await client.query("insert into clan_members(id,clan_id,player_id,display_name,birth_year,profile_registered) values($1,$2,$3,'Human Name',1998,true)", [uuid(10), uuid(100), uuid(1)]);
    await client.query("insert into clan_members(id,clan_id,player_id) values($1,$2,$3)", [uuid(11), uuid(100), uuid(2)]);
    await client.query("insert into clan_member_discord_accounts values($1,$2,'guild-a','discord-one','Server Nick','username','2025-01-01Z','2025-02-01Z')", [uuid(20), uuid(10)]);
  }
  async function migrate() { for (const statement of statements) await client.query(statement); }
  async function withFixture(check: (transaction: NonNullable<Parameters<typeof linkDiscordAccount>[1]>) => Promise<void>) {
    const rollbackFixture = new Error("Rollback test fixture");
    try {
      await database.transaction(async (transaction) => {
        await setup();
        await check(transaction);
        throw rollbackFixture;
      });
    } catch (error) {
      if (error !== rollbackFixture) throw error;
    }
  }

  try {
    await context.test("프로필 이관 후 탈퇴 처리·소속 행 삭제에도 Discord 연동은 유지된다", async () => {
      await withFixture(async (transaction) => {
        await migrate();
        const row = (await client.query("select * from player_discord_accounts")).rows[0];
        assert.equal(row.id, uuid(20));
        assert.equal(row.player_id, uuid(1));
        assert.equal(row.name, "Human Name");
        assert.equal(row.discord_display_name, "Server Nick");
        assert.equal(row.birth_year, 1998);
        assert.equal(row.nickname_status, "pending");
        assert.equal(row.last_applied_nickname, null);
        assert.equal(row.nickname_error, null);
        assert.equal(row.created_at.toISOString(), "2025-01-01T00:00:00.000Z");
        assert.equal(row.updated_at.toISOString(), "2025-02-01T00:00:00.000Z");
        const columns = (await client.query("select attname from pg_attribute where attrelid='clan_members'::regclass and attnum>0 and not attisdropped")).rows.map((row) => row.attname);
        for (const removed of ["display_name", "birth_year", "profile_registered"]) assert.ok(!columns.includes(removed));
        await client.query("insert into player_discord_accounts(id,player_id,discord_guild_id,discord_user_id,discord_display_name,discord_username,name,birth_year,created_at,updated_at) select $1,player_id,'guild-b','discord-b',discord_display_name,discord_username,'Other Guild Name',2002,created_at,now() from player_discord_accounts where id=$2", [uuid(40), uuid(20)]);
        const members = await findActiveClanMembersByClanId("clan.bobo", transaction);
        assert.equal(members.length, 2);
        assert.equal(members.find((member) => member.playerId === uuid(1))?.name, "Human Name");
        assert.equal(members.find((member) => member.playerId === uuid(1))?.profileRegistered, true);
        assert.equal(members.find((member) => member.playerId === uuid(2))?.profileRegistered, false);
        const detail = await findClanMemberDetailByPlayerId(uuid(1), transaction);
        assert.equal(detail?.birthYear, 1998);

        for (const values of [
          [uuid(30), uuid(2), "discord-one"],
          [uuid(31), uuid(1), "discord-other"],
        ]) {
          await client.query("savepoint conflict_check");
          await assert.rejects(client.query("insert into player_discord_accounts(id,player_id,discord_guild_id,discord_user_id,discord_display_name,discord_username,name,birth_year) values($1,$2,'guild-a',$3,'Server','username','Name',1998)", values), { code: "23505" });
          await client.query("rollback to savepoint conflict_check");
        }
        const newRegistration = {
          player: { accountId: "account.new", name: "NEW_PLAYER", platform: "kakao" as const, clanId: null, matchIds: [] },
          discordGuildId: "guild-a", discordUserId: "discord-new", discordDisplayName: "Server Display",
          discordUsername: "new_username", name: "Entered Name", birthYear: 2000,
        };
        const saved = await linkDiscordAccount(newRegistration, transaction);
        assert.equal(saved.account.name, "Entered Name");
        assert.equal(saved.account.discordDisplayName, "Server Display");
        assert.equal(saved.player.pubgClanId, null);
        assert.equal((await client.query("select count(*)::int as count from clan_members where player_id=$1", [saved.player.id])).rows[0].count, 0);
        await assert.rejects(linkDiscordAccount({ ...newRegistration, discordUserId: "discord-one", player: {
          ...newRegistration.player, accountId: "account.rollback", name: "ROLLBACK_PLAYER",
        } }, transaction), { status: 409 });
        assert.equal((await client.query("select count(*)::int as count from players where pubg_account_id='account.rollback'")).rows[0].count, 0);
        await assert.rejects(linkDiscordAccount({ ...newRegistration, discordUserId: "discord-other" }, transaction), { status: 409 });
        await syncPlayersFromPubg([{ accountId: "account.one", name: "PUBG_ONE", platform: "kakao", clanId: null, matchIds: [] }], transaction);
        assert.equal((await client.query("select status from clan_members where id=$1", [uuid(10)])).rows[0].status, "left");
        const linked = await findDiscordAccountsForPlayers(["account.one"], "kakao", "guild-a", transaction);
        assert.equal(linked[0].discordUserId, "discord-one");
        await client.query("delete from clan_members where id=$1", [uuid(10)]);
        assert.equal((await client.query("select count(*)::int as count from player_discord_accounts where id=$1", [uuid(20)])).rows[0].count, 1);
      });
    });

    for (const scenario of [
      { name: "미연동 프로필", prepare: "delete from clan_member_discord_accounts", error: /Unlinked clan member profiles/ },
      { name: "불완전한 프로필", prepare: "update clan_members set profile_registered=false, birth_year=null", error: /missing or invalid/ },
      { name: "플레이어·서버 중복 연동", prepare: `
        insert into clan_members(id,clan_id,player_id,display_name,birth_year,profile_registered)
          select '${uuid(12)}','${uuid(101)}',player_id,display_name,birth_year,true from clan_members where id='${uuid(10)}';
        insert into clan_member_discord_accounts
          select '${uuid(21)}','${uuid(12)}',discord_guild_id,'discord-two',discord_display_name,discord_username,created_at,updated_at from clan_member_discord_accounts;
      `, error: /Multiple Discord links/ },
    ]) await context.test(`${scenario.name} 데이터가 있으면 삭제 전에 중단한다`, async () => {
      await withFixture(async () => {
        await client.query(scenario.prepare);
        await client.query("savepoint before_migration");
        await assert.rejects(migrate(), scenario.error);
        await client.query("rollback to savepoint before_migration");
        assert.ok((await client.query("select to_regclass('pg_temp.clan_member_discord_accounts') as name")).rows[0].name);
        assert.equal((await client.query("select count(*)::int as count from clan_members")).rows[0].count, scenario.name === "플레이어·서버 중복 연동" ? 3 : 2);
        assert.ok((await client.query("select display_name from clan_members where id=$1", [uuid(10)])).rows[0]);
      });
    });
  } finally {
    await client.end();
    if (savedGuildId === undefined) delete process.env.DISCORD_GUILD_ID;
    else process.env.DISCORD_GUILD_ID = savedGuildId;
  }
});
