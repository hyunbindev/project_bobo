# Home server deployment

## 1. 운영 환경 파일

```bash
cp .env.production.example .env.production
mkdir -p secrets
```

`.env.production`의 비밀번호와 PUBG 값을 실제 값으로 변경한다. PostgreSQL
비밀번호에 URL 예약 문자가 있다면 `DATABASE_URL` 안에서는 URL 인코딩해야 한다.

## 2. Cloudflare Tunnel

Cloudflare 대시보드에서 원격 관리 Tunnel을 생성하고 토큰을 아래 파일에 한 줄로
저장한다.

```text
secrets/cloudflare-tunnel-token
```

Tunnel의 Published application route는 다음 서비스 URL을 사용한다.

```text
http://app:3000
```

`app`은 Compose 내부 DNS에서 해석되는 Next.js 서비스 이름이다. 호스트의 3000번
포트는 로컬 점검용으로만 `127.0.0.1`에 바인딩된다.

## 3. 실행

```bash
docker compose --env-file .env.production config
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
```

`migrate` 서비스가 PostgreSQL 준비를 기다린 뒤 Drizzle migration을 한 번
실행한다. 성공한 다음 `app`과 `cloudflared`가 순서대로 시작된다.

## 4. 로그와 업데이트

```bash
docker compose --env-file .env.production logs -f app cloudflared
git pull
docker compose --env-file .env.production up -d --build
```

현재 전적 동기화 cron은 Next.js 프로세스의 `instrumentation.ts`에서 실행되므로
`app` 서비스는 한 개의 인스턴스만 실행한다. 여러 인스턴스로 확장하기 전에는
PostgreSQL advisory lock을 먼저 적용해야 한다.

## 5. 로컬 확인

```bash
curl http://127.0.0.1:3000/api/health
docker compose --env-file .env.production exec postgres \
  pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```
