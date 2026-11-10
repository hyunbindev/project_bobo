import assert from "node:assert/strict";
import test from "node:test";
import { extractTeamSnapshots } from "../lib/telemetry/team-snapshots";

test("team snapshots use preceding observations and retain earlier snapshot state", () => {
  const player = (id: string, teamId: number, x: number) => ({ accountId: id, name: id, teamId, health: 100, location: { x, y: 0, z: 0 } });
  const ours = player("ours", 1, 100);
  const enemy = player("enemy", 2, 300);
  const at = (seconds: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, seconds)).toISOString();
  const source = [
    { _T: "LogMatchStart", _D: at(0), characters: [{ character: ours }, { character: enemy }] },
    { _T: "LogGameStatePeriodic", _D: at(1), gameState: { numAlivePlayers: 2 } },
    { _T: "LogPlayerMakeGroggy", _D: at(2), attacker: enemy, victim: ours },
    { _T: "LogPlayerPosition", _D: at(3), character: player("enemy", 2, 900), elapsedTime: 3 },
    { _T: "LogPlayerRevive", _D: at(4), reviver: ours, victim: ours },
  ];
  const result = extractTeamSnapshots(source, 1);
  assert.equal(result.snapshots.length, 2);
  assert.equal(result.snapshots[0].teams.find(team => team.teamId === 1)?.players[0].status, "knocked");
  assert.equal(result.snapshots[0].teams.find(team => team.teamId === 2)?.players[0].location?.x, 300);
  assert.equal(result.snapshots[0].distances[0].horizontalMetres, 2);
  assert.equal(result.snapshots[1].teams[0].players[0].status, "alive");
  assert.equal(result.snapshots[0].gameState?.ageSeconds, 1);
  assert.throws(() => extractTeamSnapshots(source, 999), /not found/);
});

test("live observations recover death while historical kill attribution cannot resurrect or move players", () => {
  const player = (id: string, teamId: number, health: number, isDBNO = false) => ({
    accountId: id, name: id, teamId, health, isDBNO, location: { x: 100, y: 0, z: 0 },
  });
  const ours = player("ours", 1, 100);
  const enemy = player("enemy", 2, 100);
  const at = (seconds: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, seconds)).toISOString();
  const source = [
    { _T: "LogMatchStart", _D: at(0), characters: [{ character: ours }, { character: enemy }] },
    { _T: "LogPlayerKillV2", _D: at(1), killer: enemy, victim: player("ours", 1, 0) },
    { _T: "LogPlayerKillV2", _D: at(2), killer: ours, victim: player("enemy", 2, 0) },
    { _T: "LogPlayerPosition", _D: at(3), character: ours },
    { _T: "LogPlayerKillV2", _D: at(4), killer: player("ours", 1, 0, true), victim: player("enemy", 2, 0) },
    { _T: "LogPlayerMakeGroggy", _D: at(5), attacker: enemy, victim: player("ours", 1, 0, true) },
    { _T: "LogPlayerPosition", _D: at(6), character: ours },
    { _T: "LogPlayerMakeGroggy", _D: at(7), attacker: ours, victim: player("enemy", 2, 0, true) },
  ];
  const snapshots = extractTeamSnapshots(source, 1).snapshots;
  const ownState = (index: number) => snapshots[index].teams.find(team => team.teamId === 1)!.players[0];
  assert.equal(ownState(0).status, "dead");
  assert.equal(ownState(1).status, "dead");
  assert.equal(ownState(2).status, "alive");
  assert.equal(ownState(2).observedAt, at(3));
  assert.equal(ownState(2).health, 100);
  assert.equal(ownState(3).status, "knocked");
  assert.equal(ownState(4).status, "alive");
});

test("return snapshots include zone, aircraft stages, and explicit redeploy events", () => {
  const ours = { accountId: "ours", name: "ours", teamId: 1, health: 100, isDBNO: false, location: { x: 100, y: 0, z: 0 }, zone: ["hatinh"] };
  const at = (seconds: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, seconds)).toISOString();
  const vehicle = { vehicleId: "RedeployAircraft_Tiger_C" };
  const source = [
    { _T: "LogMatchStart", _D: at(0), characters: [{ character: ours }] },
    { _T: "LogParachuteLanding", _D: at(1), character: ours },
    { _T: "LogPlayerRedeployBRStart", _D: at(2), characters: [ours] },
    { _T: "LogPlayerRedeploy", _D: at(3), character: ours },
    { _T: "LogVehicleRide", _D: at(4), character: { ...ours, zone: [] }, vehicle },
    { _T: "LogVehicleLeave", _D: at(5), character: { ...ours, zone: [] }, vehicle },
    { _T: "LogParachuteLanding", _D: at(6), character: ours },
    { _T: "LogParachuteLanding", _D: at(7), character: ours },
  ];
  const snapshots = extractTeamSnapshots(source, 1).snapshots;
  assert.equal(snapshots.length, 6);
  assert.deepEqual(snapshots.map(snapshot => "stage" in snapshot.payload ? snapshot.payload.stage : null), ["initial_landed", "comeback_started", "redeployed", "aircraft_boarded", "aircraft_left", "landed"]);
  assert.deepEqual(snapshots[0].teams[0].players[0].zone, ["hatinh"]);
  assert.deepEqual(snapshots[3].teams[0].players[0].zone, []);
  assert.deepEqual(snapshots[5].teams[0].players[0].zone, ["hatinh"]);
});

test("match end records victory and placement without replacing locations with result coordinates", () => {
  const ours = { accountId: "ours", name: "ours", teamId: 1, location: { x: 100, y: 20, z: 0 }, zone: ["yulin"] };
  for (const rank of [1, 3]) {
    const result = extractTeamSnapshots([
      { _T: "LogMatchStart", _D: "2026-01-01T00:00:00Z", characters: [{ character: ours }] },
      { _T: "LogParachuteLanding", _D: "2026-01-01T00:01:00Z", character: ours },
      { _T: "LogMatchEnd", _D: "2026-01-01T00:10:00Z", characters: [{ character: { ...ours, ranking: rank, location: { x: 0, y: 0, z: 0 } } }] },
    ], 1);
    assert.equal(result.snapshots.length, 2);
    assert.equal(result.snapshots[1].eventType, "LogMatchEnd");
    assert.equal("result" in result.snapshots[1].payload && result.snapshots[1].payload.result, rank === 1 ? "match_won" : "match_finished");
    assert.equal(result.snapshots[1].teams[0].players[0].location?.x, 100);
    assert.deepEqual(result.snapshots[0].teams[0].players[0].zone, ["yulin"]);
  }
});
