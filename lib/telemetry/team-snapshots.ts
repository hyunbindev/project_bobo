import { object, character, number, type ObjectValue } from "./handlers/values";
import { parseTelemetry } from "./parser";
import type { TelemetryCharacter } from "./types";

type PlayerState = TelemetryCharacter & {
  observedAt: string;
  health: number | null;
  healthObservedAt: string;
  status: "alive" | "knocked" | "dead";
  zone: string[] | null;
};

/** Positions are in PUBG centimetres. Snapshots use only observations at or before the event. */
export function extractTeamSnapshots(source: unknown, teamId: number) {
  if (!Number.isInteger(teamId) || teamId < 0) throw new Error("Invalid team ID");
  if (!Array.isArray(source)) throw new Error("Telemetry must be an event array");
  const combat = parseTelemetry(source, { includeMovement: false });
  const combatByIndex = new Map(combat.events.map(event => [event.eventIndex, event]));
  const timeline = source.map((value, index) => {
    const event = object(value);
    const time = typeof event?._D === "string" ? Date.parse(event._D) : NaN;
    if (!event || !Number.isFinite(time)) throw new Error(`Invalid timestamp at ${index}`);
    return { event, index, time };
  }).sort((a, b) => a.time - b.time || a.index - b.index);
  const start = timeline.find(item => item.event._T === "LogMatchStart");
  if (!start) throw new Error("Missing LogMatchStart");
  const players = new Map<string, PlayerState>();
  const returningPlayers = new Set<string>();
  const landedPlayers = new Set<string>();
  let gameState: { observedAt: string; ageSeconds?: number; data: ObjectValue } | null = null;
  let phase: { observedAt: string; phase: number | null; isBlueZone: unknown } | null = null;

  function observe(value: unknown, time: number) {
    const raw = object(value);
    const parsed = character(value);
    if (!raw || !parsed?.accountId) return;
    const previous = players.get(parsed.accountId);
    const health = number(raw.health);
    let status = previous?.status ?? "alive";
    if (raw.isDBNO === true && status !== "dead") status = "knocked";
    if (health !== null && health > 0 && raw.isDBNO === false) status = "alive";
    players.set(parsed.accountId, {
      ...parsed, location: parsed.location ?? previous?.location ?? null,
      zone: parsed.location
        ? Array.isArray(raw.zone) ? raw.zone.filter((zone): zone is string => typeof zone === "string") : null
        : previous?.zone ?? null,
      observedAt: parsed.location ? new Date(time).toISOString() : previous?.observedAt ?? new Date(time).toISOString(),
      health,
      healthObservedAt: new Date(time).toISOString(),
      status,
    });
  }

  const roster = Array.isArray(start.event.characters) ? start.event.characters : [];
  for (const entry of roster) observe(object(entry)?.character, start.time);
  if (![...players.values()].some(player => player.teamId === teamId)) throw new Error(`Team ${teamId} not found in match roster`);
  const snapshots = [];
  let recentCombat: typeof combat.events = [];
  for (const { event, index, time } of timeline) {
    if (time < start.time) continue;
    // Kill attribution can describe an earlier attack, so it is not a current player observation.
    const observationKeys = event._T === "LogPlayerKillV2" || event._T === "LogPlayerKill"
      ? ["victim"] : ["character", "attacker", "victim", "reviver"];
    for (const key of observationKeys) observe(event[key], time);
    const vehicle = object(event.vehicle);
    const returningCharacter = character(event.character);
    const isReturnAircraft = typeof vehicle?.vehicleId === "string" && vehicle.vehicleId.startsWith("RedeployAircraft_");
    let returnStage: "redeployed" | "comeback_started" | "aircraft_boarded" | "aircraft_left" | "landed" | "initial_landed" | null = null;
    let returnCharacters: TelemetryCharacter[] = [];
    if (event._T === "LogPlayerRedeployBRStart") {
      const characters = Array.isArray(event.characters) ? event.characters : [];
      for (const value of characters) observe(value, time);
      returnCharacters = characters.map(character).filter(value => value !== null);
      returnStage = "comeback_started";
    } else if (returningCharacter) {
      if (event._T === "LogPlayerRedeploy") returnStage = "redeployed";
      if (event._T === "LogVehicleRide" && isReturnAircraft) returnStage = "aircraft_boarded";
      if (event._T === "LogVehicleLeave" && isReturnAircraft) returnStage = "aircraft_left";
      if (event._T === "LogParachuteLanding" && returningCharacter.accountId && returningPlayers.has(returningCharacter.accountId)) returnStage = "landed";
      if (event._T === "LogParachuteLanding" && returningCharacter.accountId) {
        if (!returnStage && !landedPlayers.has(returningCharacter.accountId)) returnStage = "initial_landed";
        landedPlayers.add(returningCharacter.accountId);
      }
      if (returnStage) {
        returnCharacters = [returningCharacter];
        if (returningCharacter.accountId) {
          if (returnStage === "landed" || returnStage === "initial_landed") returningPlayers.delete(returningCharacter.accountId);
          else returningPlayers.add(returningCharacter.accountId);
          const state = players.get(returningCharacter.accountId);
          if (state) state.status = "alive";
        }
      }
    }
    if (event._T === "LogGameStatePeriodic") {
      const data = object(event.gameState);
      if (data) gameState = { observedAt: new Date(time).toISOString(), data };
    }
    if (event._T === "LogPhaseChange") phase = { observedAt: new Date(time).toISOString(), phase: number(event.phase), isBlueZone: event.isBlueZone ?? null };
    const parsed = combatByIndex.get(index);
    const isMatchEnd = event._T === "LogMatchEnd";
    if (!parsed && !returnStage && !isMatchEnd) continue;
    const victim = parsed && "victim" in parsed.payload ? parsed.payload.victim : null;
    const state = victim?.accountId ? players.get(victim.accountId) : undefined;
    if (state) {
      if (event._T === "LogPlayerMakeGroggy") state.status = "knocked";
      if (event._T === "LogPlayerRevive") state.status = "alive";
      if (event._T === "LogPlayerKillV2" || event._T === "LogPlayerKill") state.status = "dead";
      if (state.status === "dead" && victim?.accountId) returningPlayers.delete(victim.accountId);
    }
    recentCombat = recentCombat.filter(item => time - item.occurredAt.getTime() <= 20_000);
    const involved = parsed ? Object.values(parsed.payload).map(value => character(value)).filter(value => value !== null) : returnCharacters;
    const finalCharacters = isMatchEnd && Array.isArray(event.characters)
      ? event.characters.map(entry => object(object(entry)?.character)).filter(entry => entry?.teamId === teamId) : [];
    const results = object(event.gameResultOnFinished)?.results;
    const teamResults = Array.isArray(results) ? results.map(object).filter(result => result?.teamId === teamId) : [];
    const rank = number(finalCharacters[0]?.ranking) ?? number(teamResults[0]?.rank);
    const payload = isMatchEnd
      ? { result: rank === 1 ? "match_won" : "match_finished", rank,
        players: finalCharacters.map(value => ({ ...character(value), rank: number(value?.ranking) })) }
      : parsed?.payload ?? { stage: returnStage, characters: returnCharacters, vehicleId: vehicle?.vehicleId ?? null };
    const teamIds = new Set(involved.map(player => player.teamId).filter(value => value !== null));
    if (isMatchEnd) teamIds.add(teamId);
    if (event._T !== "LogPlayerTakeDamage" && teamIds.has(teamId)) {
      const teams = [...teamIds].map(id => ({
        teamId: id,
        players: [...players.values()].filter(player => player.teamId === id).map(player => ({
          ...player, ageSeconds: (time - Date.parse(player.observedAt)) / 1000,
        })),
      }));
      const participants = teams.flatMap(team => team.players).filter(player => player.status !== "dead" && player.location);
      const distances = participants.flatMap((from, position) => participants.slice(position + 1).map(to => ({
        fromAccountId: from.accountId, toAccountId: to.accountId,
        sameTeam: from.teamId === to.teamId,
        horizontalMetres: Math.hypot(from.location!.x - to.location!.x, from.location!.y - to.location!.y) / 100,
        fromPositionAgeSeconds: from.ageSeconds, toPositionAgeSeconds: to.ageSeconds,
      })));
      snapshots.push({
        eventIndex: index, eventType: event._T, occurredAt: new Date(time).toISOString(),
        elapsedSeconds: (time - start.time) / 1000, payload, teams, distances,
        gameState: gameState ? { ...gameState, ageSeconds: (time - Date.parse(gameState.observedAt)) / 1000 } : null,
        phase,
        precedingCombat: recentCombat.filter(item => Object.values(item.payload).some(value => {
          const participant = character(value);
          return participant?.teamId !== null && participant?.teamId !== undefined && teamIds.has(participant.teamId);
        })),
      });
    }
    if (parsed) recentCombat.push(parsed);
  }
  return {
    teamId, mapName: start.event.mapName ?? null, matchStartedAt: new Date(start.time).toISOString(),
    coordinateUnit: "centimetres", snapshotTiming: "after event", historySeconds: 20,
    roster: [...players.values()].map(({ accountId, name, teamId: id }) => ({ accountId, name, teamId: id })),
    snapshots,
  };
}
