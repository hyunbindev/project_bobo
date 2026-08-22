CREATE TYPE "public"."pubg_platform" AS ENUM('steam', 'kakao', 'psn', 'xbox');--> statement-breakpoint
CREATE TABLE "match_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"pubg_participant_id" text NOT NULL,
	"pubg_roster_id" text,
	"team_id" integer,
	"team_rank" integer,
	"kills" integer NOT NULL,
	"assists" integer NOT NULL,
	"dbnos" integer NOT NULL,
	"headshot_kills" integer NOT NULL,
	"revives" integer NOT NULL,
	"damage_dealt" double precision NOT NULL,
	"time_survived" double precision NOT NULL,
	"win_place" integer NOT NULL,
	"death_type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pubg_match_id" text NOT NULL,
	"platform" "pubg_platform" NOT NULL,
	"map_name" text NOT NULL,
	"game_mode" text NOT NULL,
	"match_type" text NOT NULL,
	"duration" integer NOT NULL,
	"is_custom_match" boolean NOT NULL,
	"patch_version" text,
	"played_at" timestamp with time zone NOT NULL,
	"telemetry_url" text,
	"raw_response" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pubg_account_id" text NOT NULL,
	"name" text NOT NULL,
	"platform" "pubg_platform" NOT NULL,
	"pubg_clan_id" text,
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "match_participants_match_pubg_participant_unique" ON "match_participants" USING btree ("match_id","pubg_participant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "match_participants_match_player_unique" ON "match_participants" USING btree ("match_id","player_id");--> statement-breakpoint
CREATE INDEX "match_participants_player_id_idx" ON "match_participants" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "match_participants_match_id_idx" ON "match_participants" USING btree ("match_id");--> statement-breakpoint
CREATE UNIQUE INDEX "matches_pubg_match_id_unique" ON "matches" USING btree ("pubg_match_id");--> statement-breakpoint
CREATE INDEX "matches_played_at_idx" ON "matches" USING btree ("played_at");--> statement-breakpoint
CREATE INDEX "matches_platform_game_mode_idx" ON "matches" USING btree ("platform","game_mode");--> statement-breakpoint
CREATE UNIQUE INDEX "players_platform_account_id_unique" ON "players" USING btree ("platform","pubg_account_id");--> statement-breakpoint
CREATE INDEX "players_name_index" ON "players" USING btree ("name");--> statement-breakpoint
CREATE INDEX "players_pubg_clan_id_idx" ON "players" USING btree ("pubg_clan_id");