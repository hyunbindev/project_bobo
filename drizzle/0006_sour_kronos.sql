CREATE TABLE "clan_member_discord_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clan_member_id" uuid NOT NULL,
	"discord_guild_id" text NOT NULL,
	"discord_user_id" text NOT NULL,
	"discord_display_name" text NOT NULL,
	"discord_username" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clan_member_discord_guild_id_not_blank" CHECK (length(trim("clan_member_discord_accounts"."discord_guild_id")) > 0),
	CONSTRAINT "clan_member_discord_user_id_not_blank" CHECK (length(trim("clan_member_discord_accounts"."discord_user_id")) > 0)
);
--> statement-breakpoint
ALTER TABLE "clan_members" RENAME COLUMN "age" TO "birth_year";--> statement-breakpoint
ALTER TABLE "clan_members" DROP CONSTRAINT "clan_members_age_range";--> statement-breakpoint
UPDATE "clan_members"
SET "birth_year" = extract(year from current_date)::integer - "birth_year"
WHERE "birth_year" BETWEEN 1 AND 120;--> statement-breakpoint
ALTER TABLE "clan_members" DROP CONSTRAINT "clan_members_registered_profile_fields";--> statement-breakpoint
ALTER TABLE "clan_member_discord_accounts" ADD CONSTRAINT "clan_member_discord_accounts_clan_member_id_clan_members_id_fk" FOREIGN KEY ("clan_member_id") REFERENCES "public"."clan_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clan_member_discord_guild_user_unique" ON "clan_member_discord_accounts" USING btree ("discord_guild_id","discord_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "clan_member_discord_member_guild_unique" ON "clan_member_discord_accounts" USING btree ("clan_member_id","discord_guild_id");--> statement-breakpoint
CREATE INDEX "clan_member_discord_member_idx" ON "clan_member_discord_accounts" USING btree ("clan_member_id");--> statement-breakpoint
ALTER TABLE "clan_members" ADD CONSTRAINT "clan_members_birth_year_range" CHECK ("clan_members"."birth_year" BETWEEN 1900 AND 2100);--> statement-breakpoint
ALTER TABLE "clan_members" ADD CONSTRAINT "clan_members_registered_profile_fields" CHECK (NOT "clan_members"."profile_registered" OR ("clan_members"."display_name" IS NOT NULL AND "clan_members"."birth_year" IS NOT NULL));
