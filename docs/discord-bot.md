# Discord bot setup

## 현재 구조

Discord 봇은 별도 서버가 아니라 Next.js의 Node 프로세스에서 실행된다.
`instrumentation.ts`가 애플리케이션 시작 시 Gateway 연결을 한 번 생성하고,
명령 이벤트는 `lib/discord/commands`의 registry로 전달한다.

현재 등록된 명령은 연결 상태를 확인하는 `/ping`과 이번 주 종합 순위를 조회하는
`/boboking`이다. 계정 연동 명령을 추가할 때는
command handler에서 DB를 직접 호출하지 않고 기존 service를 호출한다.

## 1. Discord Application 생성

Discord Developer Portal에서 Application과 Bot을 만든다. 설치 설정에는 다음
scope를 추가한다.

- `bot`
- `applications.commands`

기본 `/ping` 명령은 `Guilds` intent만 사용하므로 privileged intent는 켜지 않아도
된다.

## 2. 환경변수

`.env.local` 또는 `.env.production`에 다음 값을 추가한다.

```dotenv
DISCORD_BOT_TOKEN=...
DISCORD_APPLICATION_ID=...
```

Bot Token은 저장소에 커밋하거나 로그로 출력하지 않는다.

## 3. 글로벌 명령 등록

개발 서버에 명령을 등록한다.

```bash
npm run discord:register
```

운영 환경 파일을 사용할 때는 다음처럼 직접 실행한다.

```bash
node --env-file=.env.production scripts/register-discord-commands.mjs
```

이 스크립트는 애플리케이션의 글로벌 Application Command 목록을 현재 정의로
덮어쓴다. 따라서 봇이 설치된 모든 Discord 서버에서 명령을 사용할 수 있다.
명령 정의가 변경됐을 때만 실행하며 애플리케이션 시작 때마다 실행하지 않는다.

## 4. 실행 확인

애플리케이션 로그에 `discord.ready`가 나타난 뒤 Discord 서버에서 `/핑` 또는
`/ping`을 실행한다. 정상 연결이면 Gateway 지연 시간이 비공개 응답으로 표시된다.
