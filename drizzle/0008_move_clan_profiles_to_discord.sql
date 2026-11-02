-- Run with the Drizzle migrator: all statements must share one transaction.
-- Transfer linked profiles only. Unlinked name/birth-year data is intentionally discarded.
-- Keep rejecting incomplete or ambiguous Discord links.
LOCK TABLE "clan_members", "clan_member_discord_accounts" IN ACCESS EXCLUSIVE MODE;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "clan_member_discord_accounts" d
    LEFT JOIN "clan_members" m ON m."id" = d."clan_member_id"
    WHERE m."player_id" IS NULL OR m."display_name" IS NULL
      OR length(trim(m."display_name")) = 0 OR m."birth_year" IS NULL
      OR m."birth_year" NOT BETWEEN 1900 AND 2100
  ) THEN
    RAISE EXCEPTION 'Discord links have missing or invalid player/profile data. Resolve them before migration.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "clan_member_discord_accounts" d
    JOIN "clan_members" m ON m."id" = d."clan_member_id"
    GROUP BY m."player_id", d."discord_guild_id" HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Multiple Discord links exist for one player in the same guild. Resolve the conflict before migration.';
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "clan_member_discord_accounts" RENAME TO "player_discord_accounts";
--> statement-breakpoint
ALTER TABLE "player_discord_accounts" ADD COLUMN "player_id" uuid;
--> statement-breakpoint
ALTER TABLE "player_discord_accounts" ADD COLUMN "name" text;
--> statement-breakpoint
ALTER TABLE "player_discord_accounts" ADD COLUMN "birth_year" integer;
--> statement-breakpoint
UPDATE "player_discord_accounts" d
SET "player_id" = m."player_id", "name" = m."display_name", "birth_year" = m."birth_year"
FROM "clan_members" m WHERE d."clan_member_id" = m."id";
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "player_discord_accounts" d
    LEFT JOIN "clan_members" m ON m."id" = d."clan_member_id"
    WHERE m."id" IS NULL OR d."player_id" IS DISTINCT FROM m."player_id"
      OR d."name" IS DISTINCT FROM m."display_name"
      OR d."birth_year" IS DISTINCT FROM m."birth_year"
  ) THEN
    RAISE EXCEPTION 'Discord profile backfill verification failed.';
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "player_discord_accounts" ALTER COLUMN "player_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "player_discord_accounts" ALTER COLUMN "name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "player_discord_accounts" ALTER COLUMN "birth_year" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "player_discord_accounts" ADD CONSTRAINT "player_discord_accounts_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "player_discord_accounts" DROP CONSTRAINT "clan_member_discord_accounts_clan_member_id_clan_members_id_fk";
--> statement-breakpoint
DROP INDEX "clan_member_discord_guild_user_unique";
--> statement-breakpoint
DROP INDEX "clan_member_discord_member_guild_unique";
--> statement-breakpoint
DROP INDEX "clan_member_discord_member_idx";
--> statement-breakpoint
CREATE UNIQUE INDEX "player_discord_guild_user_unique" ON "player_discord_accounts" ("discord_guild_id", "discord_user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "player_discord_player_guild_unique" ON "player_discord_accounts" ("player_id", "discord_guild_id");
--> statement-breakpoint
CREATE INDEX "player_discord_player_idx" ON "player_discord_accounts" ("player_id");
--> statement-breakpoint
ALTER TABLE "player_discord_accounts" DROP CONSTRAINT "clan_member_discord_guild_id_not_blank";
--> statement-breakpoint
ALTER TABLE "player_discord_accounts" DROP CONSTRAINT "clan_member_discord_user_id_not_blank";
--> statement-breakpoint
ALTER TABLE "player_discord_accounts" ADD CONSTRAINT "player_discord_guild_id_not_blank" CHECK (length(trim("discord_guild_id")) > 0);
--> statement-breakpoint
ALTER TABLE "player_discord_accounts" ADD CONSTRAINT "player_discord_user_id_not_blank" CHECK (length(trim("discord_user_id")) > 0);
--> statement-breakpoint
ALTER TABLE "player_discord_accounts" ADD CONSTRAINT "player_discord_name_not_blank" CHECK (length(trim("name")) > 0);
--> statement-breakpoint
ALTER TABLE "player_discord_accounts" ADD CONSTRAINT "player_discord_birth_year_range" CHECK ("birth_year" BETWEEN 1900 AND 2100);
--> statement-breakpoint
ALTER TABLE "clan_members" DROP CONSTRAINT "clan_members_birth_year_range";
--> statement-breakpoint
ALTER TABLE "clan_members" DROP CONSTRAINT "clan_members_registered_profile_fields";
--> statement-breakpoint
ALTER TABLE "player_discord_accounts" DROP COLUMN "clan_member_id";
--> statement-breakpoint
ALTER TABLE "clan_members" DROP COLUMN "display_name";
--> statement-breakpoint
ALTER TABLE "clan_members" DROP COLUMN "birth_year";
--> statement-breakpoint
ALTER TABLE "clan_members" DROP COLUMN "profile_registered";
