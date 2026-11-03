#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root"

exec docker compose \
  --project-name project-bobo \
  --env-file .env.production \
  -f compose.yaml \
  -f compose.observability.yaml \
  "$@"
