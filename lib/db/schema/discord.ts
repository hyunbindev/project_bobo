import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { clanMembers } from "./clan";

export const clanMemberDiscordAccounts = pgTable(
  "clan_member_discord_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clanMemberId: uuid("clan_member_id")
      .notNull()
      .references(() => clanMembers.id, { onDelete: "cascade" }),
    discordGuildId: text("discord_guild_id").notNull(),
    discordUserId: text("discord_user_id").notNull(),
    discordDisplayName: text("discord_display_name").notNull(),
    discordUsername: text("discord_username").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("clan_member_discord_guild_user_unique").on(
      table.discordGuildId,
      table.discordUserId,
    ),
    uniqueIndex("clan_member_discord_member_guild_unique").on(
      table.clanMemberId,
      table.discordGuildId,
    ),
    index("clan_member_discord_member_idx").on(table.clanMemberId),
    check(
      "clan_member_discord_guild_id_not_blank",
      sql`length(trim(${table.discordGuildId})) > 0`,
    ),
    check(
      "clan_member_discord_user_id_not_blank",
      sql`length(trim(${table.discordUserId})) > 0`,
    ),
  ],
);

export type ClanMemberDiscordAccount =
  typeof clanMemberDiscordAccounts.$inferSelect;
export type NewClanMemberDiscordAccount =
  typeof clanMemberDiscordAccounts.$inferInsert;

