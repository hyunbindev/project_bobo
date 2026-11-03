# 배포와 관제 운영

`compose.yaml`과 `compose.observability.yaml`은 파일만 분리하고 `project-bobo` 프로젝트에서 관리한다.
기존 앱/DB 네트워크 구조는 유지하고 관제 서비스를 같은 네트워크에 연결한다.
외부 네트워크를 따로 생성할 필요는 없으며 저장 볼륨은 서비스별로 유지한다.

| 서비스 | 네트워크 |
| --- | --- |
| Cloudflare Tunnel | `bobo_frontend` |
| Next.js, Grafana | `bobo_frontend`, `bobo_backend` |
| 마이그레이션, Loki, Alloy | `bobo_backend` |
| PostgreSQL | `bobo_backend`, `db_access` |

`bobo_backend`는 `internal: true`로 유지한다. Grafana는 frontend에서 Tunnel 요청을 받고
backend에서 Loki에 접근한다. Alloy는 Docker 소켓으로 로그를 읽으므로 외부 네트워크가 필요 없다.
`db_access`는 기존 DB 연결을 위해 유지하며 마이그레이션 전용이 아니다.

## 서버 준비와 최초 실행

서버에는 Git, Bash, Docker Engine과 `--wait`를 지원하는 Docker Compose가 필요하다.
저장소를 `/srv/project-bobo`에 복제하고 `.env.production.example`을 `.env.production`으로
복사한 뒤 실제 값을 입력한다. Grafana 설정도 이 파일에 넣으며 `GRAFANA_ADMIN_PASSWORD`는 필수다.
`secrets/cloudflare-tunnel-token`에는 기존처럼 Tunnel 토큰 한 줄을 저장한다.

```bash
bash scripts/deploy.sh bootstrap
```

DB 준비 → 앱/마이그레이션 이미지 빌드 → 마이그레이션 → 앱 준비 확인 → Tunnel 시작 → 관제 준비 확인 순서다.
최초 실행은 서버에서 수행하며, 일반 앱 배포 워크플로는 DB나 Tunnel을 새로 시작하지 않는다.
앱과 관제 설정을 함께 읽기 때문에 앱만 배포할 때도 Grafana 환경값이 있어야 한다.

## 앱 CI/CD

`.github/workflows/ci-deploy.yml`은 master 대상 PR과 master push에서 린트, 타입 검사,
테스트, 마이그레이션 메타데이터 및 합친 Compose 설정을 검증한다.
테스트는 GitHub 실행기의 임시 PostgreSQL 17을 사용하며 운영 DB에는 접근하지 않는다.
관제 전용 파일과 문서만 변경한 경우에는 앱 파이프라인을 실행하지 않는다.

master push 또는 master에서 수동 실행한 경우에만 검증 후 SSH 배포한다.

```bash
bash scripts/deploy.sh app
```

1. 실행 중인 DB가 응답하는지 확인한다.
2. `migrate`, `app` 이미지만 서버에서 빌드한다. 빌드 중에는 기존 앱이 계속 실행된다.
3. `migrate`를 일회성 컨테이너로 실행한다. 실패하면 앱을 교체하지 않는다.
4. `app`만 `--no-deps`로 갱신하고 컨테이너의 `/api/health` 검사 성공을 기다린다.
5. 준비 실패 시 앱 로그를 출력하고 배포를 실패 처리한다. 자동 롤백은 하지 않는다.

PostgreSQL, Cloudflare Tunnel, Loki, Alloy, Grafana는 일반 앱 배포에서 갱신하지 않는다.
마이그레이션 동안 기존 앱이 실행되므로 스키마 변경은 기존 앱과 호환되도록 배포해야 한다.
앱 교체 시 잠깐의 중단이 있으며 현재 함께 실행되는 Discord 봇도 재시작된다.

## 관제 CD

`.github/workflows/deploy-observability.yml`은 관제 설정, 공통 Compose/배포 스크립트 변경 시
실행된다. PR에서는 검증만 하고 master push 또는 master의 수동 실행에서 검증 후 배포한다.
합친 Compose 설정과 Loki/Alloy 설정을 확인한 뒤 다음 작업을 수행한다.

```bash
bash scripts/deploy.sh observability
```

관제 이미지 pull → Loki/Alloy 설정 검증 → 관제 서비스만 갱신 → Grafana와 Loki 준비 확인 순서다.
설정 파일 내용만 바뀐 배포도 반영되도록 관제 컨테이너는 `--force-recreate`로 재생성한다.
앱 빌드, 앱 교체, DB 마이그레이션은 실행하지 않는다.
Alloy는 같은 프로젝트의 앱/DB/Tunnel 로그를 수집하고 수집기 자신의 로그는 제외한다.

## 공통 배포 설정

두 워크플로는 동일한 `production` environment와 배포 concurrency 그룹을 사용해
서버 변경을 직렬화한다. CI 검증은 동시에 가능하다.
Actions에는 기존과 같은 secrets가 필요하다.

- `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PASSWORD`
- `DEPLOY_PORT` (생략하면 22)
- repository variable `DEPLOY_PATH` (생략하면 `/srv/project-bobo`)

배포 시 master를 fetch한 뒤 검증한 SHA를 detached HEAD로 checkout한다.
추적 중인 서버 파일에 수정이 있으면 중단하며, 실제 환경파일과 토큰 파일은 서버에만 유지한다.
두 워크플로 모두 설정 파일 전체를 읽되 갱신할 서비스를 명시한다.
같은 커밋에 공통 파일이 바뀌면 두 파이프라인이 순차 실행될 수 있다.
CI가 실행한 마이그레이션 검증은 메타데이터 검사이며 운영 데이터에서의 성공을 보장하지 않는다.

## 수동 운영

`scripts/compose.sh`가 프로젝트명, 환경파일, 두 YAML을 항상 동일하게 지정한다.

```bash
# 전체 상태 / 서비스별 로그
bash scripts/compose.sh ps
bash scripts/compose.sh logs -f app
bash scripts/compose.sh logs -f alloy loki grafana

# Tunnel 설정을 변경했을 때만 별도로 반영
bash scripts/compose.sh up -d --no-deps cloudflared

# PostgreSQL 설정/네트워크 변경은 점검 시간에 별도로 반영
bash scripts/compose.sh up -d --no-deps --wait postgres
```

전체 `down`은 앱과 관제를 모두 중지하므로 일상 배포에는 사용하지 않는다.
`--remove-orphans`와 이미지/빌드 캐시 prune도 자동 배포에서 실행하지 않는다.
디스크 정리는 보존할 이미지와 캐시를 정한 뒤 별도 운영 작업으로 수행한다.
Grafana는 기본 `127.0.0.1:3001`에서 접근하거나 Tunnel의 `http://bobo-grafana:3000`으로 연결한다.

## 기존 독립 관제 스택에서 전환

운영에 `bobo-observability` 프로젝트가 이미 있다면 점검 시간에 다음 순서로 전환한다.

1. **기존 YAML과 기존 환경파일을 사용하는 상태에서** 관제 스택을 `down`한다. `-v`를 붙이지 않는다.
   기존 볼륨 이름은 `docker volume ls`로 확인한다.
2. 새 코드를 받고 기존 `.env.observability`의 Grafana 설정을 `.env.production`에 옮긴다.
3. 데이터 보존을 위해 아래 값을 `.env.production`에 추가한다. 실제 볼륨 이름이 다르면 확인한 이름을 사용한다.

   ```dotenv
   LOKI_DATA_VOLUME=bobo-observability_loki_data
   ALLOY_DATA_VOLUME=bobo-observability_alloy_data
   GRAFANA_DATA_VOLUME=bobo-observability_grafana_data
   ```

4. `bash scripts/deploy.sh bootstrap`으로 네트워크 변경과 관제 통합을 반영한다.
5. 앱·Grafana 접근과 Alloy 수집을 확인한다. 이전 `.env.observability`는 더 이상 읽지 않는다.

기존 `project-bobo_postgres_data`와 frontend 네트워크 이름은 유지한다.
기존 관제 볼륨을 지정하지 않으면 새 관제 볼륨을 생성하므로 과거 로그·Grafana 설정이 새 화면에 나타나지 않는다.
