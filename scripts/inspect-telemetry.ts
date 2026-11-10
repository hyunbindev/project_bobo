import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { gzipSync } from "node:zlib";
import { downloadTelemetry } from "../lib/telemetry/download";
import { parseTelemetry } from "../lib/telemetry/parser";
import type { ParsedTelemetryEvent } from "../lib/telemetry/types";

function measure(events: ParsedTelemetryEvent[]) {
  const json = JSON.stringify(events);
  const payloadBytes = events.reduce((total, event) => total + Buffer.byteLength(JSON.stringify(event.payload)), 0);
  return {
    eventCount: events.length, jsonBytes: Buffer.byteLength(json), gzipBytes: gzipSync(json).byteLength, payloadJsonBytes: payloadBytes,
    // Planning range only: JSONB binary overhead + heap/columns + two B-tree indexes.
    // PostgreSQL compression, page fill, WAL and backups have NOT been measured.
    estimatedDbBytes: { low: Math.ceil(payloadBytes * 1.05 + events.length * 150), high: Math.ceil(payloadBytes * 1.5 + events.length * 250) },
  };
}

async function main() {
  const args = process.argv.slice(2);
  const [source, path] = args;
  if (!source || (source === "--file" && !path)) throw new Error("Usage: npm run telemetry:inspect -- <https-url> | --file <path>");
  const start = performance.now();
  const downloaded = source === "--file"
    ? { text: await readFile(path, "utf8"), encodedBytes: null, contentEncoding: null }
    : await downloadTelemetry(source);
  const beforeParse = performance.now();
  const result = parseTelemetry(JSON.parse(downloaded.text), { includeMovement: !args.includes("--combat-only") });
  const parseMs = performance.now() - beforeParse;
  const rssAfterParse = process.memoryUsage().rss;
  const combat = result.events.filter((event) => event.eventType !== "LogPlayerPosition");
  const movement = result.events.filter((event) => event.eventType === "LogPlayerPosition");
  const previousPositions = new Map<string, number>();
  const intervals: number[] = [];
  for (const event of movement) {
    if (!("character" in event.payload)) continue;
    const playerId = event.payload.character.accountId ?? event.payload.character.name;
    if (!playerId) continue;
    const previous = previousPositions.get(playerId);
    if (previous !== undefined && event.payload.elapsedTime > previous) intervals.push(event.payload.elapsedTime - previous);
    previousPositions.set(playerId, event.payload.elapsedTime);
  }
  intervals.sort((a, b) => a - b);
  const combined = measure(result.events);
  console.log(JSON.stringify({
    parserVersion: result.parserVersion, sourceDecodedBytes: Buffer.byteLength(downloaded.text),
    sourceEncodedBytes: downloaded.encodedBytes, sourceContentEncoding: downloaded.contentEncoding,
    sourceRecompressedGzipBytes: gzipSync(downloaded.text).byteLength,
    sourceEventCount: result.sourceEventCount, combat: measure(combat), movement: measure(movement), combined,
    movementPlayerCount: previousPositions.size, medianPositionIntervalSeconds: intervals[Math.floor(intervals.length / 2)] ?? null,
    projection19480Matches: {
      jsonBytes: combined.jsonBytes * 19_480, gzipBytes: combined.gzipBytes * 19_480,
      estimatedDbBytes: { low: combined.estimatedDbBytes.low * 19_480, high: combined.estimatedDbBytes.high * 19_480 },
    },
    ignoredEventCounts: result.ignoredEventCounts, loadMs: beforeParse - start,
    parseMs, rssAfterParse, processMaxRssBytes: process.resourceUsage().maxRSS * 1024,
  }, null, 2));
}
void main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Inspection failed"); process.exitCode = 1; });
