# 로그 수집과 대시보드

## 출력과 수집

- 운영 앱은 `LOG_PRETTY` 값과 관계없이 Pino JSON을 한 이벤트당 한 행으로 출력한다. Compose에서도 `LOG_PRETTY=false`를 고정한다.
- 개발 환경의 `LOG_PRETTY=true`는 계속 사용할 수 있다.
- Alloy는 Docker 타임스탬프가 167시간보다 오래된 행을 전송 전에 제외한다. Loki의 168시간 수집 제한보다 여유를 두어 오래된 행이 같은 묶음의 정상 전송을 방해하지 않게 한다.
- 앱의 기존 pretty 출력과 들여쓴 스택은 multiline 단계에서 합친다. JSON 행은 각각 독립된 이벤트로 유지한다.
- 인덱스 라벨은 프로젝트·서비스·컨테이너·카테고리·등급으로 제한한다. 사용자 ID, 경기 ID, runId, 오류 코드는 본문에 둔다.
- JSON의 숫자 `level`은 문자열 `severity` 라벨로 정규화한다. 두 이름을 달리하여 LogQL의 `| json`과 충돌하지 않게 한다.
- PostgreSQL과 Cloudflare 로그는 기존 본문을 보존한다.
- Loki는 수집한 로그를 90일(`2160h`) 보관하며 한 번의 조회도 최대 90일까지 허용한다. 신규 유입 로그의 허용 나이 7일은 보관 기간과 별개이며, 오래된 Docker 로그의 재전송을 제한하는 설정으로 유지한다.

수집기를 고쳐도 이미 Loki에 분리되어 저장된 로그는 합쳐지지 않는다. 수정 이후 들어오는 로그부터 적용된다.
보관 기간을 늘려도 이미 삭제되었거나 수집하지 않은 과거 로그는 복원되지 않는다.
대시보드 기본 조회 범위는 최근 1시간이다. 최근 24시간·7일·90일 등은 우측 상단 시간 선택기에서 바꾼다.

## BOBO 운영 로그

대시보드 UID는 기존과 동일한 `bobo-logs`이다. Grafana의 BOBO 폴더에서 연다.

- 프로젝트·서비스·카테고리·등급·정규식 검색 필터
- 수집 로그 수, 오류·경고, 채널별 치킨 알림 성공, 별명 적용 실패
- 서비스 및 카테고리별 로그 흐름
- 경기 동기화 시간과 처리 경기 수, PUBG API 호출 제한, 실패 이벤트 추이
- 오류 스택, Discord 이벤트, 동기화 이벤트, 전체 로그 상세

이 값들은 수집된 로그에 대한 집계다. HTTP 요청 수나 서비스 가동 여부를 대신하지 않는다.
스택은 여러 줄로 보여주되 한 로그 항목으로 유지하며, 항목을 펼치면 파싱된 원본 필드를 볼 수 있다.

## 반영과 확인

이 변경은 앱과 관제 파일을 모두 포함하므로 두 배포가 모두 필요하다. 기존 Actions가 해당 변경 경로를 각각 처리한다.

```bash
bash scripts/deploy.sh app
bash scripts/deploy.sh observability
```

다음 LogQL로 새 라벨과 구조화 로그를 확인한다.

```logql
sum by (category, severity) (
  count_over_time({project="project-bobo",service_name="app"}[5m])
)
```

```logql
{project="project-bobo",service_name="app"} | json | __error__=""
```

## 2026-11-03 운영 임시 반영

진행 중인 다른 앱 변경을 배포하지 않도록 기존 운영 이미지는 유지하고 JSON 출력 환경변수와 수집·대시보드 설정만 반영했다.
서버 저장소의 추적 파일은 수정하지 않았으며 기존 설정은 아래 경로의 `backup`에 보관했다.

```text
/home/hyunbin/.local/state/project-bobo-observability/20261103-logs-fix/
```

초기 복구에서는 Alloy와 Grafana가 해당 디렉터리의 설정을 마운트했다. 동일한 수정이 저장소에 반영된 뒤 일반 앱·관제 배포를 실행하면 저장소의 정식 경로로 돌아간다.
임시 파일을 수정하는 대신 이 문서와 함께 커밋된 정식 설정을 유지한다.

이전 설정으로 되돌릴 필요가 있으면 기존 저장소 상태에서 `bash scripts/compose.sh up -d --no-deps --wait app alloy grafana`를 사용한다. 볼륨과 저장된 로그는 삭제하지 않는다.
