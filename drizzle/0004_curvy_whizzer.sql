ALTER TABLE "match_participants" ADD COLUMN "boosts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "match_participants" ADD COLUMN "heals" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "match_participants" ADD COLUMN "kill_place" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "match_participants" ADD COLUMN "kill_streaks" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "match_participants" ADD COLUMN "road_kills" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "match_participants" ADD COLUMN "team_kills" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "match_participants" ADD COLUMN "vehicle_destroys" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "match_participants" ADD COLUMN "weapons_acquired" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "match_participants" ADD COLUMN "longest_kill" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "match_participants" ADD COLUMN "ride_distance" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "match_participants" ADD COLUMN "swim_distance" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "match_participants" ADD COLUMN "walk_distance" double precision DEFAULT 0 NOT NULL;