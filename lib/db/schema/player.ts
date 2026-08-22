import {
    index,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";

export const pubgPlatformEnum = pgEnum("pubg_platform",
    [
        "steam",
        "kakao",
        "psn",
        "xbox"
    ],
);

export const players = pgTable("players",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        
        pubgAccountId: text("pubg_account_id").notNull(),

        name: text("name").notNull(),

        platform: pubgPlatformEnum("platform").notNull(),

        pubgClanId: text("pubg_clan_id"),

        lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).notNull().defaultNow(),

        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    },
    (table)=>[
        uniqueIndex("players_platform_account_id_unique").on(
            table.platform,
            table.pubgAccountId,
        ),
        index("players_name_index").on(table.name),
        index("players_pubg_clan_id_idx").on(table.pubgClanId),
    ]
)