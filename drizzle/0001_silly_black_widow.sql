CREATE TYPE "public"."clan_member_status" AS ENUM('active', 'inactive', 'left');--> statement-breakpoint
CREATE TABLE "clan_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clan_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"age" integer NOT NULL,
	"status" "clan_member_status" DEFAULT 'active' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clan_members_age_range" CHECK ("clan_members"."age" BETWEEN 1 AND 120)
);
--> statement-breakpoint
CREATE TABLE "clans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pubg_clan_id" text NOT NULL,
	"platform" "pubg_platform" NOT NULL,
	"name" text NOT NULL,
	"tag" text NOT NULL,
	"level" integer NOT NULL,
	"member_count" integer NOT NULL,
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clans_level_non_negative" CHECK ("clans"."level" >= 0),
	CONSTRAINT "clans_member_count_non_negative" CHECK ("clans"."member_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "clan_members" ADD CONSTRAINT "clan_members_clan_id_clans_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clan_members" ADD CONSTRAINT "clan_members_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clan_members_clan_player_unique" ON "clan_members" USING btree ("clan_id","player_id");--> statement-breakpoint
CREATE INDEX "clan_members_clan_status_idx" ON "clan_members" USING btree ("clan_id","status");--> statement-breakpoint
CREATE INDEX "clan_members_player_id_idx" ON "clan_members" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "clans_platform_pubg_clan_id_unique" ON "clans" USING btree ("platform","pubg_clan_id");--> statement-breakpoint
CREATE INDEX "clans_name_idx" ON "clans" USING btree ("name");