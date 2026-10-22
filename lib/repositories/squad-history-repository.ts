import { sql } from "drizzle-orm";

import { db } from "@/lib/db";

export type SquadHistoryInput = {
  matchId: string;
  rosterId: string;
  clanId: string;
};

export type SquadHistorySummary = {
  members: Array<{ id: string; name: string }>;
  matchCount: number;
  winCount: number;
  averageRank: number | null;
  averageDamage: number | null;
  previousMatchCount: number;
  previousAverageKills: number | null;
  previousAverageDamage: number | null;
  previousAverageRank: number | null;
};

export type SquadHistoryMatch = {
  matchId: string;
  rosterId: string;
  mapName: string;
  gameMode: string;
  matchType: string;
  playedAt: Date;
  rank: number;
  kills: number;
  damage: number;
};

// Include rosters containing every target member and exclude later matches.
// Both current and historical metrics include only these same members.
function squadHistoryCtes(input: SquadHistoryInput) {
  return sql`
    with active_members as (
      select cm.player_id, p.name
      from clan_members cm
      join players p on p.id = cm.player_id
      where cm.clan_id = ${input.clanId}::uuid and cm.status = 'active'
    ), target as (
      select m.platform, m.match_type, m.game_mode, m.played_at as current_played_at,
        array_agg(mp.player_id order by mp.player_id) as member_ids,
        jsonb_agg(jsonb_build_object('id', mp.player_id, 'name', am.name)
          order by am.name, mp.player_id) as members
      from matches m
      join match_participants mp on mp.match_id = m.id
      join active_members am on am.player_id = mp.player_id
      where m.id = ${input.matchId}::uuid
        and mp.pubg_roster_id = ${input.rosterId}
      group by m.id
      having count(*) >= 2
    ), roster_totals as (
      select m.id as match_id, mp.pubg_roster_id as roster_id,
        m.map_name, m.played_at, m.game_mode, m.match_type,
        min(coalesce(mp.team_rank, mp.win_place))::integer as rank,
        (sum(mp.kills) filter (where mp.player_id = any(t.member_ids)))::integer as kills,
        (sum(mp.damage_dealt) filter (where mp.player_id = any(t.member_ids)))::double precision as damage,
        array_agg(mp.player_id order by mp.player_id) as member_ids
      from target t
      join matches m on m.platform = t.platform
        and m.match_type = t.match_type and m.game_mode = t.game_mode
        and m.played_at <= t.current_played_at
      join match_participants mp on mp.match_id = m.id
      join active_members am on am.player_id = mp.player_id
      where mp.pubg_roster_id is not null
        -- 먼저 대상 조합의 한 명이 참여한 로스터로 후보를 줄인다.
        and exists (
          select 1 from match_participants anchor
          where anchor.match_id = m.id
            and anchor.pubg_roster_id = mp.pubg_roster_id
            and anchor.player_id = t.member_ids[1]
        )
      group by m.id, mp.pubg_roster_id
    ), squad_matches as (
      select r.* from roster_totals r
      join target t on t.member_ids <@ r.member_ids
    )
  `;
}

export async function findSquadHistorySummary(
  input: SquadHistoryInput,
  database: Pick<typeof db, "execute"> = db,
): Promise<SquadHistorySummary | null> {
  const result = await database.execute<SquadHistorySummary>(sql`
    ${squadHistoryCtes(input)}
    select t.members,
      count(s.match_id)::integer as "matchCount",
      count(s.match_id) filter (where s.rank = 1)::integer as "winCount",
      avg(s.rank)::double precision as "averageRank",
      avg(s.damage)::double precision as "averageDamage",
      count(s.match_id) filter (where s.played_at < t.current_played_at)::integer as "previousMatchCount",
      (avg(s.kills) filter (where s.played_at < t.current_played_at))::double precision as "previousAverageKills",
      (avg(s.damage) filter (where s.played_at < t.current_played_at))::double precision as "previousAverageDamage",
      (avg(s.rank) filter (where s.played_at < t.current_played_at))::double precision as "previousAverageRank"
    from target t
    left join squad_matches s on true
    group by t.members, t.current_played_at
  `);
  return result.rows[0] ?? null;
}

export async function findSquadHistoryMatches(
  input: SquadHistoryInput,
  limit: number,
  offset: number,
  database: Pick<typeof db, "execute"> = db,
): Promise<SquadHistoryMatch[]> {
  const result = await database.execute<Omit<SquadHistoryMatch, "playedAt"> & {
    playedAt: Date | string;
  }>(sql`
    ${squadHistoryCtes(input)}
    select match_id as "matchId", roster_id as "rosterId",
      map_name as "mapName", game_mode as "gameMode", match_type as "matchType",
      played_at as "playedAt", rank, kills, damage
    from squad_matches
    order by played_at desc, match_id desc, roster_id
    limit ${limit} offset ${offset}
  `);
  return result.rows.map((row) => ({ ...row, playedAt: new Date(row.playedAt) }));
}
