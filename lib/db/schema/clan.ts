import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";

import { players, pubgPlatformEnum } from "./player";

export const clanMemberStatusEnum = pgEnum("clan_member_status", [
  "active",
  "inactive",
  "left",
]);

export const clans = pgTable(
  "clans",
  {
    // 내부 관계에는 PUBG ID 대신 변경하기 쉬운 자체 PK를 사용한다.
    id: uuid("id").defaultRandom().primaryKey(),

    pubgClanId: text("pubg_clan_id").notNull(),
    
    platform: pubgPlatformEnum("platform").notNull(),
    
    name: text("name").notNull(),
    
    tag: text("tag").notNull(),
    
    level: integer("level").notNull(),
    memberCount: integer("member_count").notNull(),

    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("clans_platform_pubg_clan_id_unique").on(
      table.platform,
      table.pubgClanId,
    ),
    index("clans_name_idx").on(table.name),

    check("clans_level_non_negative", sql`${table.level} >= 0`),

    check("clans_member_count_non_negative", sql`${table.memberCount} >= 0`),

  ],
);

export const clanMembers = pgTable(
  "clan_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clanId: uuid("clan_id")
      .notNull()
      .references(() => clans.id, { onDelete: "cascade" }),

    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "restrict" }),


    // PUBG 닉네임은 players.name에 있고, 여기에는 사용자가 입력한 이름을 저장한다.
    displayName: text("display_name"),

    age: integer("age"),

    status: clanMemberStatusEnum("status").default("active").notNull(),


    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    profileRegistered: boolean("profile_registered").default(false).notNull(),

    leftAt: timestamp("left_at", { withTimezone: true }),


    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

  },
  (table) => [
    // 같은 PUBG 계정이 같은 클랜에 중복 등록되는 것을 DB에서도 막는다.
    uniqueIndex("clan_members_clan_player_unique").on(
      table.clanId,
      table.playerId,
    ),
    index("clan_members_clan_status_idx").on(table.clanId, table.status),

    index("clan_members_player_id_idx").on(table.playerId),

    check("clan_members_age_range", sql`${table.age} BETWEEN 1 AND 120`),

    check(
      "clan_members_registered_profile_fields",
      sql`NOT ${table.profileRegistered} OR (${table.displayName} IS NOT NULL AND ${table.age} IS NOT NULL)`,
    ),
    
  ],
);

export type Clan = typeof clans.$inferSelect;
export type NewClan = typeof clans.$inferInsert;
export type ClanMember = typeof clanMembers.$inferSelect;
export type NewClanMember = typeof clanMembers.$inferInsert;
