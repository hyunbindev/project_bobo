import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { clanMembers, clans } from "@/lib/db/schema";

export async function findMainClanSummary(pubgClanId?: string) {
  const [clan] = await db
    .select({
      id: clans.id,
      pubgClanId: clans.pubgClanId,
      platform: clans.platform,
      name: clans.name,
      tag: clans.tag,
      level: clans.level,
      memberCount: clans.memberCount,
      registeredMemberCount: count(clanMembers.id),
      lastSyncedAt: clans.lastSyncedAt,
    })
    .from(clans)
    .leftJoin(
      clanMembers,
      and(
        eq(clanMembers.clanId, clans.id),
        eq(clanMembers.status, "active"),
      ),
    )
    .where(pubgClanId ? eq(clans.pubgClanId, pubgClanId) : undefined)
    .groupBy(
      clans.id,
      clans.pubgClanId,
      clans.platform,
      clans.name,
      clans.tag,
      clans.level,
      clans.memberCount,
      clans.lastSyncedAt,
    )
    .orderBy(desc(clans.lastSyncedAt))
    .limit(1);

  return clan ?? null;
}
