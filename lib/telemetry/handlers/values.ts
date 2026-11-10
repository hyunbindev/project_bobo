import type { TelemetryCharacter } from "../types";

export type ObjectValue = Record<string, unknown>;
export function object(value: unknown): ObjectValue | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as ObjectValue : null;
}
export function text(value: unknown) { return typeof value === "string" && value.length ? value : null; }
export function number(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : null; }

export function character(value: unknown): TelemetryCharacter | null {
  const data = object(value);
  if (!data) return null;
  const point = object(data.location);
  const x = number(point?.x), y = number(point?.y), z = number(point?.z);
  return {
    accountId: text(data.accountId), name: text(data.name), teamId: number(data.teamId),
    location: x !== null && y !== null && z !== null ? { x, y, z } : null,
  };
}
