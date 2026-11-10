import assert from "node:assert/strict";
import test from "node:test";
import { compactTeamSnapshots } from "../lib/telemetry/ai-input";
import { extractTeamSnapshots } from "../lib/telemetry/team-snapshots";

test("AI export deduplicates events and game state while retaining snapshot references and observation times", () => {
  const ours = { accountId: "account.ours", name: "ours", teamId: 1, location: { x: -12345, y: 1000, z: 0 }, zone: ["yulin"] };
  const enemy = { ...ours, accountId: "account.enemy", name: "enemy", teamId: 2 };
  const at = (second: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, second)).toISOString();
  const source = extractTeamSnapshots([
    { _T: "LogMatchStart", _D: at(0), characters: [{ character: ours }, { character: enemy }] },
    { _T: "LogGameStatePeriodic", _D: at(1), gameState: { safetyZonePosition: { x: -10000, y: 0, z: 0 }, safetyZoneRadius: 100000 } },
    { _T: "LogPlayerTakeDamage", _D: at(2), attacker: ours, victim: enemy, damage: 30, distance: 12345 },
    { _T: "LogPlayerMakeGroggy", _D: at(3), attacker: ours, victim: enemy, distance: 12345 },
    { _T: "LogPlayerKillV2", _D: at(4), killer: ours, victim: enemy, killerDamageInfo: { distance: -1 } },
  ], 1);
  const result = compactTeamSnapshots(source);
  assert.equal(result.events.length, 3);
  assert.equal(result.snapshots.length, source.snapshots.length);
  assert.equal(result.gameStates.length, 1);
  assert.equal(Object.keys(result.players).length, 2);
  for (const snapshot of result.snapshots) {
    assert.ok(result.events.some(event => event.id === snapshot.eventId));
    for (const id of snapshot.precedingEventIds) assert.ok(result.events.some(event => event.id === id));
  }
  const encoded = JSON.stringify(result);
  assert.ok(!encoded.includes("account."));
  assert.ok(encoded.includes('"x":-123.4'));
  assert.ok(encoded.includes('"distance":-1'));
  assert.ok(encoded.includes('"observedAt":3'));
  assert.ok(encoded.includes('"zone":["yulin"]'));
});
