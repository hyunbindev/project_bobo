#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root"

compose() {
  bash scripts/compose.sh "$@"
}

require_database() {
  # 일반 앱 배포에서는 DB 컨테이너를 생성하거나 교체하지 않는다.
  compose exec -T postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
}

deploy_app() {
  require_database
  compose build migrate app
  # 성공한 경우에만 앱을 교체한다. 실패한 마이그레이션 출력은 배포 로그에 남는다.
  compose run --rm --no-deps migrate
  if ! compose up -d --no-deps --wait --wait-timeout 120 app; then
    compose logs --tail=100 app
    return 1
  fi
}

deploy_observability() {
  compose pull loki alloy grafana
  compose run --rm --no-deps loki -config.file=/etc/loki/config.yaml -verify-config=true
  compose run --rm --no-deps alloy validate /etc/alloy/config.alloy
  if ! compose up -d --no-deps --wait --wait-timeout 120 loki alloy grafana; then
    compose logs --tail=100 loki alloy grafana
    return 1
  fi

  # 같은 네트워크에서 Loki의 준비 상태도 확인한다.
  for attempt in {1..12}; do
    if compose exec -T grafana wget -q -O /dev/null http://loki:3100/ready; then
      return 0
    fi
    sleep 5
  done
  compose logs --tail=100 loki
  return 1
}

case "${1:-}" in
  app)
    compose config --quiet
    deploy_app
    ;;
  observability)
    compose config --quiet
    deploy_observability
    ;;
  bootstrap)
    compose config --quiet
    compose up -d --wait --wait-timeout 120 postgres
    deploy_app
    compose up -d --no-deps cloudflared
    deploy_observability
    ;;
  *)
    echo "Usage: bash scripts/deploy.sh {app|observability|bootstrap}" >&2
    exit 2
    ;;
esac
