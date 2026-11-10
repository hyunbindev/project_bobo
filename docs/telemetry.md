# Telemetry parsing tests

The telemetry module downloads and parses PUBG events and extracts team snapshots
for local inspection. Database persistence and production scheduling remain pending
design.

## Inspect events

```sh
npm run telemetry:inspect -- --file /path/to/telemetry.json
npm run telemetry:inspect -- https://telemetry-cdn.pubg.com/path/to/telemetry.json
npm run telemetry:inspect -- --file /path/to/telemetry.json --combat-only
```

The parser supports damage, knocks, kills, revives and optional player positions.
Unknown event types are counted. Invalid supported events fail parsing.
Inspection reports JSON and gzip sizes. Database size estimates are hypothetical
and exclude WAL, backups and bloat. See telemetry-sample.md for a sample measurement.

## Extract team snapshots

```sh
npm run telemetry:team -- /path/to/telemetry.json 6
npm run telemetry:team -- https://telemetry-cdn.pubg.com/path/to/telemetry.json 6 /path/to/output
```

The numeric argument is the telemetry teamId. Outputs are team-ID.json and
team-ID.json.gz, with the actual numeric ID substituted for ID. The default
directory is dist/telemetry-exports/team-snapshots and is ignored by Git.

Snapshots include initial landings, combat, revives, redeploy events, return-aircraft
boarding and leaving, return landings and match results. Player observations retain
location, zone, health and state. Positions and distances retain observation ages.
Snapshots include the preceding 20 seconds of related combat and the latest game
state. Missing zone data is null and an observed empty zone list remains empty.
Positive-health observations can restore alive state after death. Historical kill
attribution does not update current player state. Match results preserve the last
observed positions separately from result characters.

Downloads allow only HTTPS telemetry-cdn.pubg.com URLs, with a 60-second timeout
and a 32 MiB decoded-size limit. They require no PUBG API key.
