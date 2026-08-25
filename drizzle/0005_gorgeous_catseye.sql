CREATE TABLE "award_definitions" (
	"code" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "award_definitions_code_format" CHECK ("award_definitions"."code" ~ '^[a-z][a-z0-9_]*$'),
	CONSTRAINT "award_definitions_title_not_blank" CHECK (length(trim("award_definitions"."title")) > 0),
	CONSTRAINT "award_definitions_description_not_blank" CHECK (length(trim("award_definitions"."description")) > 0),
	CONSTRAINT "award_definitions_sort_order_non_negative" CHECK ("award_definitions"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE INDEX "award_definitions_enabled_sort_order_idx" ON "award_definitions" USING btree ("enabled","sort_order");