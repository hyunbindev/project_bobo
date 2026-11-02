import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { players } from "./player";

export const playerDiscordAccounts = pgTable(
  "player_discord_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    discordGuildId: text("discord_guild_id").notNull(),
    discordUserId: text("discord_user_id").notNull(),
    discordDisplayName: text("discord_display_name").notNull(),
    discordUsername: text("discord_username").notNull(),
    // 사용자가 등록한 이름과 Discord에서 조회한 현재 표시 이름은 별도로 관리한다.
    name: text("name").notNull(),
    birthYear: integer("birth_year").notNull(),
    nicknameStatus: text("nickname_status", { enum: ["pending", "completed", "failed"] })
      .default("pending")
      .notNull(),
    lastAppliedNickname: text("last_applied_nickname"),
    nicknameError: text("nickname_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("player_discord_guild_user_unique").on(
      table.discordGuildId,
      table.discordUserId,
    ),
    uniqueIndex("player_discord_player_guild_unique").on(
      table.playerId,
      table.discordGuildId,
    ),
    index("player_discord_player_idx").on(table.playerId),
    check(
      "player_discord_guild_id_not_blank",
      sql`length(trim(${table.discordGuildId})) > 0`,
    ),
    check(
      "player_discord_user_id_not_blank",
      sql`length(trim(${table.discordUserId})) > 0`,
    ),
    check("player_discord_name_not_blank", sql`length(trim(${table.name})) > 0`),
    check("player_discord_birth_year_range", sql`${table.birthYear} BETWEEN 1900 AND 2100`),
    check("player_discord_nickname_status", sql`${table.nicknameStatus} IN ('pending', 'completed', 'failed')`),
  ],
);

export type PlayerDiscordAccount = typeof playerDiscordAccounts.$inferSelect;
export type NewPlayerDiscordAccount = typeof playerDiscordAccounts.$inferInsert;

