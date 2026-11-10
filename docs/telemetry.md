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

## AI input export

Team extraction also writes team-ID.ai.json and its gzip copy. This format defines
players once using short IDs, stores combat events once, references preceding
events by source event index and shares game states across snapshots. Pairwise
distances are omitted because they can be computed from the retained positions.
Coordinates and damage distances are converted to metres. Times become seconds
relative to matchStartedAt. Numeric measurements are rounded to one decimal place;
negative unavailable damage distances remain negative. Player status, zones,
observation times, lifecycle events and match results are retained.

This compact format still retains individual damage events. It does not aggregate
combat into encounters. Local tokenizer measurements are reference counts and
may differ from a specific model's API token count.
