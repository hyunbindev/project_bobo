import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

// Docker 호출을 기록해 실제 컨테이너나 운영 서버를 변경하지 않고 배포 경계를 검증한다.
function deploy(target: string, failure?: "migration" | "app") {
  const root = mkdtempSync(join(tmpdir(), "bobo-deploy-"));
  try {
    mkdirSync(join(root, "scripts"));
    mkdirSync(join(root, "mock-bin"));
    for (const script of ["compose.sh", "deploy.sh"]) {
      copyFileSync(join("scripts", script), join(root, "scripts", script));
    }
    const docker = join(root, "mock-bin", "docker");
    writeFileSync(docker, `#!/usr/bin/env bash
set -eu
printf '%s\\n' "$*" >> "$PWD/calls.log"
if [[ "$MOCK_FAILURE" == migration && "$*" == *"run --rm --no-deps migrate"* ]]; then
  exit 17
fi
if [[ "$MOCK_FAILURE" == app && "$*" == *"up -d --no-deps --wait --wait-timeout 120 app"* ]]; then
  exit 18
fi
`);
    chmodSync(docker, 0o755);
    const bash = process.env.TEST_BASH
      ?? (process.platform === "win32" ? "C:/Program Files/Git/bin/bash.exe" : "bash");
    const result = spawnSync(bash, [
      "-c", 'export PATH="$PWD/mock-bin:$PATH"; bash scripts/deploy.sh "$1"', "test", target,
    ], {
      cwd: root,
      env: { ...process.env, MOCK_FAILURE: failure ?? "" },
      encoding: "utf8",
      timeout: 15_000,
    });
    assert.ifError(result.error);
    return {
      status: result.status,
      stderr: result.stderr,
      calls: target === "invalid" ? [] : readFileSync(join(root, "calls.log"), "utf8")
        .trim().split("\n").map((call) => {
          assert.ok(call.startsWith("compose --project-name project-bobo --env-file .env.production -f compose.yaml -f compose.observability.yaml "));
          return call.slice(call.indexOf("compose.observability.yaml ") + "compose.observability.yaml ".length);
        }),
    };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("app deployment migrates before replacement and leaves DB, Tunnel and observability running", () => {
  const result = deploy("app");
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.calls, [
    "config --quiet",
    'exec -T postgres sh -c pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"',
    "build migrate app",
    "run --rm --no-deps migrate",
    "up -d --no-deps --wait --wait-timeout 120 app",
  ]);
});

test("migration failure prevents app replacement", () => {
  const result = deploy("app", "migration");
  assert.equal(result.status, 17, result.stderr);
  assert.equal(result.calls.at(-1), "run --rm --no-deps migrate");
  assert.ok(!result.calls.some((call) => call.startsWith("up ")));
});

test("app health failure fails deployment and prints app logs", () => {
  const result = deploy("app", "app");
  assert.equal(result.status, 1, result.stderr);
  assert.equal(result.calls.at(-1), "logs --tail=100 app");
});

test("observability deployment validates its configuration without touching app or migrations", () => {
  const result = deploy("observability");
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.calls, [
    "config --quiet",
    "pull loki alloy grafana",
    "run --rm --no-deps loki -config.file=/etc/loki/config.yaml -verify-config=true",
    "run --rm --no-deps alloy validate /etc/alloy/config.alloy",
    "up -d --no-deps --force-recreate --wait --wait-timeout 120 loki alloy grafana",
    "exec -T grafana wget -q -O /dev/null http://loki:3100/ready",
  ]);
});

test("unknown deployment target exits before invoking Docker", () => {
  const result = deploy("invalid");
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage:/);
  assert.deepEqual(result.calls, []);
});
