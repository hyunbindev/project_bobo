import assert from "node:assert/strict";
import { test } from "node:test";
import { parseTelemetry } from "../lib/telemetry/parser";
import { downloadTelemetry } from "../lib/telemetry/download";

const victim = { accountId: "account.victim", name: "Victim", teamId: 1, location: { x: 1, y: 2, z: 3 } };
const killer = { accountId: "account.killer", name: "Killer", teamId: 2 };
const at = "2026-11-10T01:00:00Z";

test("combat parser preserves source indices, orders time and separates kill/finish attribution", () => {
  const result = parseTelemetry([
    { _T: "LogPlayerPosition", _D: at, character: victim },
    { _T: "LogPlayerKillV2", _D: "2026-11-10T01:00:02Z", victim, killer, finisher: victim, dBNOMaker: killer,
      killerDamageInfo: { damageCauserName: "WeapHK416_C" }, finishDamageInfo: { damageCauserName: "BlueZone" },
      assists_AccountId: ["account.assist"], unknownHugeField: "discard" },
    { _T: "LogPlayerMakeGroggy", _D: at, victim, attacker: killer, dBNOId: 7 },
    { _T: "LogPlayerRevive", _D: at, victim, reviver: killer, dBNOId: 7 },
  ], { includeMovement: false });
  assert.equal(result.sourceEventCount, 4);
  assert.deepEqual(result.ignoredEventCounts, { LogPlayerPosition: 1 });
  assert.deepEqual(result.events.map((event) => event.eventIndex), [2, 3, 1]);
  const kill = result.events[2].payload;
  assert.ok("victim" in kill);
  assert.equal(kill.killer?.accountId, "account.killer");
  assert.equal(kill.finisher?.accountId, "account.victim");
  assert.equal(kill.damageInfo?.weapon, "WeapHK416_C");
  assert.equal(kill.finishDamageInfo?.weapon, "BlueZone");
  assert.deepEqual(kill.victim.location, victim.location);
  assert.ok(!("unknownHugeField" in kill));
});

test("environmental damage permits no attacker; bad supported events fail instead of silently disappearing", () => {
  const result = parseTelemetry([{ _T: "LogPlayerTakeDamage", _D: at, victim, attacker: null, damage: 5 }]);
  const payload = result.events[0].payload;
  assert.ok("victim" in payload);
  assert.equal(payload.attacker, null);
  for (const event of [
    { _T: "LogPlayerTakeDamage", _D: at, victim, damage: -1 },
    { _T: "LogPlayerKillV2", _D: "bad", victim },
    { _T: "LogPlayerRevive", _D: at, victim },
  ]) assert.throws(() => parseTelemetry([event]), /Invalid .* index 0/);
  assert.throws(() => parseTelemetry({}), /event array/);
});

test("download rejects non-CDN URLs and bounds the decoded body", async (context) => {
  const fetchMock = context.mock.method(globalThis, "fetch", async () => new Response("123456789"));
  await assert.rejects(downloadTelemetry("http://127.0.0.1/private"), /Unsupported/);
  assert.equal(fetchMock.mock.calls.length, 0);
  await assert.rejects(downloadTelemetry("https://telemetry-cdn.pubg.com/match.json", { maxBytes: 8 }), /size limit/);
  const downloaded = await downloadTelemetry("https://telemetry-cdn.pubg.com/match.json");
  assert.equal(downloaded.text, "123456789");
  assert.equal(downloaded.bytes, 9);
});

test("movement handler stores positions and elapsed time, and can be disabled", () => {
  const source = [{ _T: "LogPlayerPosition", _D: at, character: victim, elapsedTime: 10, numAlivePlayers: 90, vehicle: { unused: true } }];
  const result = parseTelemetry(source);
  assert.equal(result.events[0].eventType, "LogPlayerPosition");
  assert.deepEqual(result.events[0].payload, { character: victim, elapsedTime: 10, numAlivePlayers: 90 });
  const disabled = parseTelemetry(source, { includeMovement: false });
  assert.equal(disabled.events.length, 0);
  assert.equal(disabled.ignoredEventCounts.LogPlayerPosition, 1);
  for (const bad of [
    { ...source[0], elapsedTime: -1 },
    { ...source[0], character: { ...victim, location: { x: NaN, y: 1, z: 2 } } },
  ]) assert.throws(() => parseTelemetry([bad]), /Invalid LogPlayerPosition/);
});
