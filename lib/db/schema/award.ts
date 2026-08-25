import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// 집계 로직과 UI 설정을 연결하는 안정적인 식별자다.
export const AWARD_CODES = [
  "bobo_king",
  "boost",
  "revive",
  "heal",
  "dbno",
  "headshot",
  "max_kills",
  "driver",
  "walker",
] as const;

export type AwardCode = (typeof AWARD_CODES)[number];

export const awardDefinitions = pgTable(
  "award_definitions",
  {
    // 칭호 결과 테이블에서 그대로 참조할 수 있도록 코드 자체를 PK로 사용한다.
    code: text("code").$type<AwardCode>().primaryKey(),

    title: text("title").notNull(),
    description: text("description").notNull(),

    enabled: boolean("enabled").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("award_definitions_enabled_sort_order_idx").on(
      table.enabled,
      table.sortOrder,
    ),

    check(
      "award_definitions_code_format",
      sql`${table.code} ~ '^[a-z][a-z0-9_]*$'`,
    ),
    check(
      "award_definitions_title_not_blank",
      sql`length(trim(${table.title})) > 0`,
    ),
    check(
      "award_definitions_description_not_blank",
      sql`length(trim(${table.description})) > 0`,
    ),
    check(
      "award_definitions_sort_order_non_negative",
      sql`${table.sortOrder} >= 0`,
    ),
  ],
);

export type AwardDefinition = typeof awardDefinitions.$inferSelect;
export type NewAwardDefinition = typeof awardDefinitions.$inferInsert;
