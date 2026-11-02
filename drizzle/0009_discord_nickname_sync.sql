ALTER TABLE "player_discord_accounts" ADD COLUMN "nickname_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "player_discord_accounts" ADD COLUMN "last_applied_nickname" text;--> statement-breakpoint
ALTER TABLE "player_discord_accounts" ADD COLUMN "nickname_error" text;--> statement-breakpoint
ALTER TABLE "player_discord_accounts" ADD CONSTRAINT "player_discord_nickname_status" CHECK ("player_discord_accounts"."nickname_status" IN ('pending', 'completed', 'failed'));