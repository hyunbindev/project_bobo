import type { MovementPayload } from "../types";
import { character, number, type ObjectValue } from "./values";

export function parseMovementEvent(event: ObjectValue): MovementPayload {
  const player = character(event.character);
  const elapsedTime = number(event.elapsedTime);
  const numAlivePlayers = number(event.numAlivePlayers);
  if (!player?.location || elapsedTime === null || elapsedTime < 0) throw new Error("Invalid player position");
  if (numAlivePlayers !== null && (!Number.isInteger(numAlivePlayers) || numAlivePlayers < 0)) throw new Error("Invalid alive player count");
  return { character: player, elapsedTime, numAlivePlayers };
}
