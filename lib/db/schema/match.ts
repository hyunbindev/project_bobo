import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { players, pubgPlatformEnum } from "./player";

export const matches = pgTable(
  "matches",
  {
    // PUBG ID와 분리된 우리 서비스 내부 PK다.
    id: uuid("id").defaultRandom().primaryKey(),

    // 같은 매치를 여러 클랜원이 가지고 있어도 한 번만 저장한다.
    pubgMatchId: text("pubg_match_id").notNull(),

    platform: pubgPlatformEnum("platform").notNull(),

    mapName: text("map_name").notNull(),
    
    gameMode: text("game_mode").notNull(),
    
    matchType: text("match_type").notNull(),
    
    duration: integer("duration").notNull(),
    
    isCustomMatch: boolean("is_custom_match").notNull(),
    
    patchVersion: text("patch_version"),

    playedAt: timestamp("played_at", {
      withTimezone: true,
    }).notNull(),

    telemetryUrl: text("telemetry_url"),

    // 전체 참가자 데이터는 나중에 다시 가공할 수 있도록 원본 그대로 보관한다.
    rawResponse: jsonb("raw_response").notNull(),

    fetchedAt: timestamp("fetched_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("matches_pubg_match_id_unique").on(table.pubgMatchId),
    index("matches_played_at_idx").on(table.playedAt),
    index("matches_platform_game_mode_idx").on(
      table.platform,
      table.gameMode,
    ),
  ],
);

export const matchParticipants = pgTable(
  "match_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),

    // 이 테이블에는 관리 대상 클랜원만 저장하므로 player 연결은 필수다.
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),

    // Match 응답 안에서 Roster와 Participant를 연결하는 외부 ID다.
    pubgParticipantId: text("pubg_participant_id").notNull(),

    pubgRosterId: text("pubg_roster_id"),
    
    teamId: integer("team_id"),
    
    teamRank: integer("team_rank"),

    kills: integer("kills").notNull(),
    assists: integer("assists").notNull(),
    dbnos: integer("dbnos").notNull(),
    headshotKills: integer("headshot_kills").notNull(),
    revives: integer("revives").notNull(),

    // PUBG가 소수 값을 내려주므로 integer가 아닌 double precision으로 저장한다.
    damageDealt: doublePrecision("damage_dealt").notNull(),
    timeSurvived: doublePrecision("time_survived").notNull(),

    winPlace: integer("win_place").notNull(),
    deathType: text("death_type").notNull(),
  },
  (table) => [
    // 같은 Match 응답을 다시 처리해도 참가자 행이 중복되지 않게 한다.
    uniqueIndex("match_participants_match_pubg_participant_unique").on(
      table.matchId,
      table.pubgParticipantId,
    ),
    uniqueIndex("match_participants_match_player_unique").on(
      table.matchId,
      table.playerId,
    ),
    index("match_participants_player_id_idx").on(table.playerId),
    index("match_participants_match_id_idx").on(table.matchId),
  ],
);

export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type MatchParticipant = typeof matchParticipants.$inferSelect;
export type NewMatchParticipant = typeof matchParticipants.$inferInsert;
