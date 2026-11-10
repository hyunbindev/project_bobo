import type { extractTeamSnapshots } from "./team-snapshots";

type TeamSnapshots = ReturnType<typeof extractTeamSnapshots>;
type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** AI export uses metre coordinates and relative seconds rounded to one decimal place. */
export function compactTeamSnapshots(source: TeamSnapshots) {
  const startedAt = Date.parse(source.matchStartedAt);
  const players: Record<string, { name: string | null; teamId: number | null }> = {};
  const playerIds = new Map<string, string>();
  const roster = new Map(source.roster.map(player => [player.accountId, player]));
  const round = (value: number) => Math.round(value * 10) / 10;

  function playerId(accountId: string) {
    let id = playerIds.get(accountId);
    if (!id) {
      id = `P${playerIds.size + 1}`;
      playerIds.set(accountId, id);
      const player = roster.get(accountId);
      players[id] = { name: player?.name ?? null, teamId: player?.teamId ?? null };
    }
    return id;
  }

  function compact(value: unknown, key = ""): Json {
    if (value === undefined || value === null) return null;
    if (value instanceof Date) return round((value.getTime() - startedAt) / 1000);
    if (typeof value === "number") {
      const centimetres = ["x", "y", "z", "distance", "safetyZoneRadius", "poisonGasWarningRadius", "redZoneRadius", "blackZoneRadius"].includes(key);
      return round(centimetres && !(key === "distance" && value < 0) ? value / 100 : value);
    }
    if (typeof value === "string") {
      if (value.startsWith("account.")) return playerId(value);
      if (["occurredAt", "observedAt", "healthObservedAt"].includes(key)) return round((Date.parse(value) - startedAt) / 1000);
      return value;
    }
    if (typeof value === "boolean") return value;
    if (Array.isArray(value)) return value.map(item => compact(item, key));
    const object = value as Record<string, unknown>;
    const output: Record<string, Json> = {};
    if (typeof object.accountId === "string") output.playerId = playerId(object.accountId);
    for (const [field, item] of Object.entries(object)) {
      if (typeof object.accountId === "string" && ["accountId", "name", "teamId"].includes(field)) continue;
      if (item !== undefined) output[field] = compact(item, field);
    }
    return output;
  }

  const events = new Map<number, { id: number; time: number; type: string; payload: Json }>();
  const gameStates: Json[] = [];
  const gameStateIds = new Map<string, number>();
  const snapshots = source.snapshots.map(snapshot => {
    for (const event of snapshot.precedingCombat) {
      events.set(event.eventIndex, {
        id: event.eventIndex, time: round((new Date(event.occurredAt).getTime() - startedAt) / 1000),
        type: event.eventType, payload: compact(event.payload),
      });
    }
    events.set(snapshot.eventIndex, {
      id: snapshot.eventIndex, time: round(snapshot.elapsedSeconds), type: String(snapshot.eventType), payload: compact(snapshot.payload),
    });
    let gameStateId: number | null = null;
    if (snapshot.gameState) {
      const state = compact({ observedAt: snapshot.gameState.observedAt, data: snapshot.gameState.data });
      const signature = JSON.stringify(state);
      const existing = gameStateIds.get(signature);
      gameStateId = existing ?? gameStates.length;
      if (existing === undefined) {
        gameStateIds.set(signature, gameStateId);
        gameStates.push(state);
      }
    }
    return {
      eventId: snapshot.eventIndex, teams: compact(snapshot.teams), gameStateId,
      phase: compact(snapshot.phase), precedingEventIds: snapshot.precedingCombat.map(event => event.eventIndex),
    };
  });

  return {
    formatVersion: 1, teamId: source.teamId, mapName: source.mapName, matchStartedAt: source.matchStartedAt,
    units: { coordinates: "metres", distances: "metres; negative values indicate unavailable", times: "seconds relative to matchStartedAt", precision: "0.1" },
    snapshotTiming: source.snapshotTiming, historySeconds: source.historySeconds,
    players, events: [...events.values()].sort((a, b) => a.time - b.time || a.id - b.id), gameStates, snapshots,
  };
}
