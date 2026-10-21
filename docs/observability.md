# BOBO 로그 수집

기존 앱과 별도 Compose 프로젝트로 Alloy, Loki, Grafana를 실행한다.
기존 `compose.yaml`과 GitHub Actions 배포 워크플로는 변경하지 않는다.

```text
project-bobo 컨테이너 stdout/stderr
  -> Alloy (Docker API로 수집)
  -> Loki (로컬 볼륨에 저장, 7일 보관)
  -> Grafana (Loki 연결 및 BOBO 운영 로그 대시보드 자동 등록)
```

이 구성은 기존 로그를 수집한다. 웹 요청별 상태 코드, 처리 시간, requestId를
생성하는 앱 계측과 CPU/메모리 메트릭 수집은 포함하지 않는다.
앱의 `LOG_PRETTY=false` 설정을 유지해야 Pino JSON 집계가 동작한다.

## 서버에 복사

프로젝트 루트 기준으로 아래 파일과 폴더를 함께 복사한다.

```text
compose.observability.yaml
.env.observability.example
observability/
```

예시:

```bash
scp compose.observability.yaml .env.observability.example USER@SERVER:/srv/project-bobo/
scp -r observability USER@SERVER:/srv/project-bobo/
```

Git으로 전송해도 된다. 현재 master push는 기존 앱 배포를 실행하며,
이 별도 Compose를 자동 실행하지 않는다. 이번 커밋의 자동 배포를 생략하려면
커밋 메시지에 `[skip ci]`를 넣는다.

## 최초 실행

서버에서:

```bash
cd /srv/project-bobo
cp .env.observability.example .env.observability
chmod 600 .env.observability
nano .env.observability
```

`GRAFANA_ADMIN_PASSWORD`를 반드시 입력한다. 실제 환경파일은 Git에서 제외된다.
비밀번호에 `$` 등이 포함되면 dotenv의 작은따옴표로 감싸 리터럴로 지정한다.

기존 앱의 Compose 프로젝트 이름도 확인한다.

```bash
docker inspect project-bobo-app-1 --format '{{ index .Config.Labels "com.docker.compose.project" }}'
```

출력이 `project-bobo`가 아니면 `TARGET_COMPOSE_PROJECT`를 맞춘다.
컨테이너 이름을 바꿔 실행했다면 위 명령의 컨테이너 이름도 변경한다.
앱 프로젝트만 수집하므로 로그 시스템 자신의 로그는 재수집하지 않는다.
Alloy는 Docker 소켓으로 수집하므로 앱 네트워크에 연결하지 않는다.
Grafana만 기존 앱의 frontend 네트워크에도 연결해 기존 cloudflared에서 접근하게 한다.
Loki와 Alloy는 관측용 내부 네트워크에만 둔다.

기존 앱이 먼저 실행되어 frontend 네트워크가 존재해야 한다.
기본값은 `project-bobo_bobo_frontend`이며 실제 이름이 다르면
`APP_FRONTEND_NETWORK`를 변경한다.

```bash
docker network ls
```

```bash
docker compose --env-file .env.observability -f compose.observability.yaml config --quiet
docker compose --env-file .env.observability -f compose.observability.yaml up -d
docker compose --env-file .env.observability -f compose.observability.yaml ps
docker compose --env-file .env.observability -f compose.observability.yaml logs --tail=100 alloy loki grafana
```

기존 앱을 실행하거나 재시작하는 명령은 포함하지 않는다.
Alloy는 실행 중인 컨테이너를 탐색하며 수집 위치를 볼륨에 보관한다.
최초 실행 시 Docker에 남아 있는 로그도 읽을 수 있지만, 이미 회전되어 삭제된
로그는 복구할 수 없다. Loki는 7일보다 오래된 로그를 거절하도록 설정했다.

## Grafana 접속

기본 바인딩은 서버의 `127.0.0.1:3001`이다. 로컬 PC에서 SSH 포워딩한다.

```bash
ssh -N -L 3001:127.0.0.1:3001 USER@SERVER
```

브라우저에서 `http://127.0.0.1:3001`로 접속한다.
사용자와 비밀번호는 `.env.observability`에 설정한 값을 사용한다.
LAN 직접 접속이 필요하면 `GRAFANA_BIND_ADDRESS`를 서버의 LAN IP로 설정한다.
Loki와 Alloy 포트는 호스트에 공개하지 않는다.

### 기존 Cloudflare Tunnel로 접속

1. `.env.observability`의 `GRAFANA_ROOT_URL`에 사용할 외부 주소를 지정한다.
   예: `https://grafana.example.com`.
2. Cloudflare 대시보드에서 기존 Tunnel에 공개 호스트명을 추가한다.
   Service는 **HTTP**, URL은 **`bobo-grafana:3000`**으로 지정한다.
3. Compose를 다시 적용한 뒤 외부 HTTPS 주소에서 Grafana 계정으로 로그인한다.

기존 Tunnel 컨테이너와 Grafana는 `APP_FRONTEND_NETWORK`를 공유한다.
앱 프로젝트와 관측 프로젝트의 이름은 다르므로 앱 재배포의
`--remove-orphans`가 관측 컨테이너를 제거하지 않는다.
Cloudflare Access 추가 인증은 구성하지 않는다. Grafana의 자체 로그인을 사용한다.
이 파일을 복사하거나 Compose를 실행하는 것만으로 Cloudflare 공개 경로가 생성되지는 않는다.

Grafana의 **Dashboards -> BOBO -> BOBO 운영 로그**를 연다.
프로젝트 이름을 변경했다면 대시보드의 `Compose project` 입력도 맞춘다.
서비스별 로그 수, 앱 오류, 동기화 처리 시간, 치킨 알림 발송 수, 원문 로그가 있다.
치킨 알림 수는 우승 경기 수가 아니라 채널별 발송 성공 건수다.
해당 이벤트가 없는 기간에는 패널에 No data가 표시될 수 있다.

Explore에서 사용하는 예시 LogQL:

```logql
{project="project-bobo", service_name="app"}
```

```logql
{project="project-bobo", service_name="app"} | json | event="match_sync.completed"
```

```logql
{project="project-bobo", service_name="app"} | json | runId="검색할-runId"
```

`requestId`, `runId`, `playerId`, `matchId`는 인덱스 라벨로 추출하지 않는다.
원문 JSON에서 검색한다. 카테고리는 기존 `logCategory`를 `category` 라벨로 추출한다.
PostgreSQL과 cloudflared의 일반 텍스트 로그도 원문 그대로 보관한다.

## 보관 및 자원

- Loki `limits_config.retention_period: 168h`와 Compactor로 7일 보관한다.
  삭제는 비동기로 이루어져 만료 직후 바로 디스크가 줄지는 않는다.
- Loki, Grafana, Alloy의 데이터는 각각 named volume에 저장한다.
  컨테이너 재생성이나 일반 `down`으로 없어지지 않는다. `down -v`는 데이터를 삭제한다.
- 초기 메모리 상한은 Loki 1536MiB, Alloy 384MiB, Grafana 512MiB다.
  실제 사용량 예약이나 충분한 용량의 보장이 아니며 수집량과 조회에 따라 조정한다.
- Docker 자체 로그 회전은 Loki 보관 정책과 별개다. 기존 앱은 이미 회전을 설정했고,
  새 세 컨테이너도 각 10MB 파일 3개로 제한한다.
- Alloy의 Docker 소켓 마운트는 컨테이너 로그 조회를 위한 것이다.
  `:ro`는 Docker API를 읽기 전용으로 제한하는 보안 경계가 아니므로,
  이 수집 컨테이너는 호스트 Docker 접근 권한을 가진 서비스로 취급한다.
- 로컬 파일시스템 기반 단일 인스턴스 구성으로, 서버 디스크 장애에 대한 복제는 없다.

## 설정 변경

이미지 버전은 Compose에 고정했다. 설정 파일 수정 후에는 해당 서비스를 재시작한다.
`up -d`만으로 bind mount 파일의 내용 변경이 컨테이너 재생성을 유발하지는 않는다.

```bash
docker compose --env-file .env.observability -f compose.observability.yaml up -d
docker compose --env-file .env.observability -f compose.observability.yaml restart alloy loki grafana
```

Grafana 관리자 환경변수는 최초 DB 초기화에 사용된다. 볼륨 생성 후 관리자 비밀번호
변경은 Grafana UI에서 처리한다. 프로비저닝된 대시보드는 저장소의 JSON을 수정한다.

## 공식 참고 문서

- [Alloy Docker 로그 수집](https://grafana.com/docs/alloy/latest/monitor/monitor-docker-containers/)
- [Loki 보관 정책](https://grafana.com/docs/loki/latest/operations/storage/retention/)
- [Grafana 데이터 소스와 대시보드 프로비저닝](https://grafana.com/docs/grafana/latest/administration/provisioning/)
