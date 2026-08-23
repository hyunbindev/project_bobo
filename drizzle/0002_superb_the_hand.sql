ALTER TABLE "clan_members" ALTER COLUMN "display_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "clan_members" ALTER COLUMN "age" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "clan_members" ADD COLUMN "profile_registered" boolean DEFAULT false NOT NULL;