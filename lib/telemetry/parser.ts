import { combatHandlers, parseCombatEvent } from "./handlers/combat";
import { parseMovementEvent } from "./handlers/movement";
import { object } from "./handlers/values";
import { TELEMETRY_PARSER_VERSION, type ParsedTelemetry } from "./types";

/** Pure parser: unsupported events are counted; malformed supported events fail the job. */
export function parseTelemetry(source: unknown, options: { includeMovement?: boolean } = {}): ParsedTelemetry {
  if (!Array.isArray(source)) throw new Error("Telemetry must be an event array");
  const result: ParsedTelemetry = {
    parserVersion: TELEMETRY_PARSER_VERSION, events: [], sourceEventCount: source.length, ignoredEventCounts: {},
  };
  const ignoredCounts = new Map<string, number>();
  for (const [eventIndex, value] of source.entries()) {
    const event = object(value);
    if (!event || typeof event._T !== "string") throw new Error(`Invalid telemetry event at index ${eventIndex}`);
    const type = event._T;
    const isMovement = type === "LogPlayerPosition" && options.includeMovement !== false;
    if (!isMovement && !Object.hasOwn(combatHandlers, type)) {
      ignoredCounts.set(type, (ignoredCounts.get(type) ?? 0) + 1);
      continue;
    }
    try {
      const occurredAt = typeof event._D === "string" ? new Date(event._D) : new Date(NaN);
      if (!Number.isFinite(occurredAt.getTime())) throw new Error("Invalid timestamp");
      result.events.push({ eventIndex, eventType: type, occurredAt, payload: isMovement ? parseMovementEvent(event) : parseCombatEvent(type, event) });
    } catch {
      throw new Error(`Invalid ${type} at index ${eventIndex}`);
    }
  }
  result.events.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime() || a.eventIndex - b.eventIndex);
  result.ignoredEventCounts = Object.fromEntries(ignoredCounts);
  return result;
}
