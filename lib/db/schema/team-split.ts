import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { TeamSplitSnapshot } from "@/lib/team-split/types";

export const teamSplitResults = pgTable(
  "team_split_results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shareToken: text("share_token").notNull(),
    discordGuildId: text("discord_guild_id").notNull(),
    discordVoiceChannelId: text("discord_voice_channel_id").notNull(),
    discordVoiceChannelName: text("discord_voice_channel_name").notNull(),
    requestedByDiscordUserId: text("requested_by_discord_user_id").notNull(),
    requestedByDisplayName: text("requested_by_display_name").notNull(),
    membersPerTeam: integer("members_per_team").notNull(),
    teamCount: integer("team_count").notNull(),
    memberCount: integer("member_count").notNull(),
    result: jsonb("result").$type<TeamSplitSnapshot>().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("team_split_results_share_token_unique").on(table.shareToken),
    index("team_split_results_expires_at_idx").on(table.expiresAt),
    check(
      "team_split_results_members_per_team_positive",
      sql`${table.membersPerTeam} > 0`,
    ),
    check("team_split_results_team_count_positive", sql`${table.teamCount} > 0`),
    check(
      "team_split_results_member_count_positive",
      sql`${table.memberCount} > 0`,
    ),
  ],
);

export type TeamSplitResult = typeof teamSplitResults.$inferSelect;
export type NewTeamSplitResult = typeof teamSplitResults.$inferInsert;

