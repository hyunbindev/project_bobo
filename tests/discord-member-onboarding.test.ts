import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { test } from "node:test";
import { ButtonStyle, type GuildMember } from "discord.js";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";

test("서버 입장 DM은 기존 개인 등록 흐름을 안전하게 재사용한다", async (context) => {
  process.env.DATABASE_URL ??= "postgresql://unused:unused@127.0.0.1:1/unused";
  const names = ["DISCORD_GUILD_ID", "APP_BASE_URL", "DISCORD_REGISTRATION_ENCRYPTION_KEY"] as const;
  const saved = names.map((name) => process.env[name]);
  process.env.DISCORD_GUILD_ID = "1543197573429465188";
  process.env.APP_BASE_URL = "https://bobo.example";
  process.env.DISCORD_REGISTRATION_ENCRYPTION_KEY = Buffer.alloc(32, 17).toString("base64");
  const resolver = Module as unknown as { _resolveFilename(request: string, ...args: unknown[]): string };
  const original = resolver._resolveFilename;
  const require = createRequire(`${process.cwd()}/package.json`);
  const alias = context.mock.method(resolver, "_resolveFilename", function (
    this: typeof resolver, request: string, ...args: unknown[]
  ) {
    return request === "server-only" ? require.resolve("next/dist/compiled/server-only/empty.js") : original.call(this, request, ...args);
  });

  try {
    const { handleGuildMemberAdd } = await import("../lib/discord/members/handle-guild-member-add");
    const { decryptRegistrationToken } = await import("../lib/discord-accounts/registration-token");
    const { db } = await import("../lib/db");
    const { discordLogger } = await import("../lib/logger");
    alias.mock.restore();
    const warnings: unknown[][] = [];
    context.mock.method(discordLogger, "warn", (...args: unknown[]) => warnings.push(args));
    context.mock.method(discordLogger, "info", () => undefined);
    let registered = false;
    let lookupFails = false;
    let expectedGuildId = "1543197573429465188";
    const select = context.mock.method(db, "select", () => ({
      from: () => ({ where: (condition: SQL) => ({ limit: async () => {
        assert.deepEqual(new PgDialect().sqlToQuery(condition).params,
          [expectedGuildId, "348806182779224065"]);
        if (lookupFails) throw new Error("private database details");
        return registered ? [{ id: "existing-account" }] : [];
      } }) }),
    }));
    type Payload = {
      content: string;
      components: { toJSON(): { components: { style: number; url: string }[] } }[];
    };
    const send = context.mock.fn(async (_payload: Payload) => { void _payload; });
    const member = {
      id: "348806182779224065", guild: { id: "1543197573429465188" },
      user: { bot: false }, send,
    } as unknown as GuildMember;

    await context.test("unregistered member receives an encrypted user/guild-specific link once for concurrent events", async () => {
      await Promise.all([handleGuildMemberAdd(member), handleGuildMemberAdd(member)]);
      assert.equal(send.mock.calls.length, 1);
      const message = send.mock.calls[0].arguments[0];
      assert.match(message.content, /환영합니다/);
      const button = message.components[0].toJSON().components[0];
      assert.equal(button.style, ButtonStyle.Link);
      const url = new URL(button.url);
      assert.equal(url.pathname, "/join/discord");
      assert.equal(url.origin, "https://bobo.example");
      assert.equal(url.searchParams.has("discordUserId"), false);
      assert.deepEqual(decryptRegistrationToken(url.searchParams.get("token")), {
        discordGuildId: member.guild.id, discordUserId: member.id,
      });
    });

    await context.test("registered members and bots do not receive DMs", async () => {
      registered = true;
      await handleGuildMemberAdd(member);
      registered = false;
      const lookups = select.mock.calls.length;
      await handleGuildMemberAdd({ ...member, user: { bot: true } } as GuildMember);
      assert.equal(select.mock.calls.length, lookups);
      assert.equal(send.mock.calls.length, 1);
    });

    await context.test("DM denial is contained and raw errors/tokens never enter logs", async () => {
      const deny = context.mock.method(member, "send", async () => {
        throw Object.assign(new Error("secret registration-token"), { code: 50007, requestBody: "secret token" });
      });
      await handleGuildMemberAdd(member);
      assert.equal(deny.mock.calls.length, 1);
      assert.deepEqual(warnings.at(-1)?.[0], {
        event: "discord.registration_dm_failed", discordGuildId: member.guild.id,
        discordUserId: member.id, stage: "dm_send", code: 50007,
      });
      assert.doesNotMatch(JSON.stringify(warnings), /secret/);
      deny.mock.restore();
      // Failure releases the in-flight guard so a subsequent join can be handled.
      await handleGuildMemberAdd(member);
      assert.equal(send.mock.calls.length, 2);
    });

    await context.test("event guild ID is used with a missing or different configured guild ID", async () => {
      process.env.APP_BASE_URL = "https://bobo.example";
      expectedGuildId = "1543197575690063880";
      const otherMember = { ...member, guild: { id: expectedGuildId } } as GuildMember;
      const previousSends = send.mock.calls.length;
      for (const configuredGuild of [undefined, "1543197573429465188"]) {
        if (configuredGuild === undefined) delete process.env.DISCORD_GUILD_ID;
        else process.env.DISCORD_GUILD_ID = configuredGuild;
        await handleGuildMemberAdd(otherMember);
        const payload = send.mock.calls.at(-1)!.arguments[0];
        const url = new URL(payload.components[0].toJSON().components[0].url);
        assert.deepEqual(decryptRegistrationToken(url.searchParams.get("token")), {
          discordGuildId: expectedGuildId, discordUserId: member.id,
        });
      }
      assert.equal(send.mock.calls.length, previousSends + 2);
      expectedGuildId = member.guild.id;
    });

    await context.test("lookup/config failures do not send a DM or escape the event handler", async () => {
      const previousSends = send.mock.calls.length;
      lookupFails = true;
      await handleGuildMemberAdd(member);
      assert.equal((warnings.at(-1)?.[0] as { stage: string }).stage, "registration_lookup");
      lookupFails = false;
      delete process.env.APP_BASE_URL;
      await handleGuildMemberAdd(member);
      assert.equal((warnings.at(-1)?.[0] as { event: string }).event, "discord.registration_dm_unavailable");
      assert.equal(send.mock.calls.length, previousSends);
    });
  } finally {
    alias.mock.restore();
    names.forEach((name, index) => {
      if (saved[index] === undefined) delete process.env[name];
      else process.env[name] = saved[index];
    });
  }
});
