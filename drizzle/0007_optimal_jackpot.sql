CREATE TABLE "team_split_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"share_token" text NOT NULL,
	"discord_guild_id" text NOT NULL,
	"discord_voice_channel_id" text NOT NULL,
	"discord_voice_channel_name" text NOT NULL,
	"requested_by_discord_user_id" text NOT NULL,
	"requested_by_display_name" text NOT NULL,
	"members_per_team" integer NOT NULL,
	"team_count" integer NOT NULL,
	"member_count" integer NOT NULL,
	"result" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_split_results_members_per_team_positive" CHECK ("team_split_results"."members_per_team" > 0),
	CONSTRAINT "team_split_results_team_count_positive" CHECK ("team_split_results"."team_count" > 0),
	CONSTRAINT "team_split_results_member_count_positive" CHECK ("team_split_results"."member_count" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "team_split_results_share_token_unique" ON "team_split_results" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "team_split_results_expires_at_idx" ON "team_split_results" USING btree ("expires_at");