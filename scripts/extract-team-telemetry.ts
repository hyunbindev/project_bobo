import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { downloadTelemetry } from "../lib/telemetry/download";
import { extractTeamSnapshots } from "../lib/telemetry/team-snapshots";
import { compactTeamSnapshots } from "../lib/telemetry/ai-input";

async function main() {
  const [source, team, output = "dist/telemetry-exports/team-snapshots"] = process.argv.slice(2);
  if (!source || !team || !/^\d+$/.test(team)) throw new Error("Usage: npm run telemetry:team -- <url-or-json-path> <teamId> [output-directory]");
  const text = source.startsWith("https://") ? (await downloadTelemetry(source)).text : await readFile(source, "utf8");
  const result = extractTeamSnapshots(JSON.parse(text), Number(team));
  const directory = resolve(output);
  await mkdir(directory, { recursive: true });
  const json = JSON.stringify(result);
  await writeFile(resolve(directory, `team-${team}.json`), json);
  await writeFile(resolve(directory, `team-${team}.json.gz`), gzipSync(json));
  const aiJson = JSON.stringify(compactTeamSnapshots(result));
  await writeFile(resolve(directory, `team-${team}.ai.json`), aiJson);
  await writeFile(resolve(directory, `team-${team}.ai.json.gz`), gzipSync(aiJson));
  console.log(JSON.stringify({ directory, teamId: result.teamId, snapshots: result.snapshots.length, jsonBytes: Buffer.byteLength(json), aiJsonBytes: Buffer.byteLength(aiJson) }));
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Extraction failed");
  process.exitCode = 1;
});
