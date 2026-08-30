# Discord bot setup

## 현재 구조

Discord 봇은 별도 서버가 아니라 Next.js의 Node 프로세스에서 실행된다.
`instrumentation.ts`가 애플리케이션 시작 시 Gateway 연결을 한 번 생성하고,
명령 이벤트는 `lib/discord/commands`의 registry로 전달한다.

현재 등록된 명령은 연결 상태를 확인하는 `/ping`, 이번 주 종합 순위를 조회하는
`/boboking`, 음성 채널 인원을 무작위로 나누는 `/team-split`, 최근 치킨 기록을
표시하는 `/recent-win`, Discord 계정과 PUBG 계정을 연결하는 `/register-player`이다.
계정 연동 명령을 추가할 때는
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
DISCORD_GUILD_ID=...
APP_BASE_URL=https://www.boboclan.win
```

Bot Token은 저장소에 커밋하거나 로그로 출력하지 않는다.
`DISCORD_GUILD_ID`는 신규 치킨 경기 자동 알림을 받을 서버를 지정한다. 알림은
해당 서버의 시스템 채널에 전송한다.

## 3. 글로벌 명령 등록

애플리케이션의 Node.js 프로세스가 시작될 때 현재 명령 목록을 글로벌 명령으로
한 번 등록한 뒤 Discord Gateway에 연결한다.

```bash
npm run dev
```

운영 환경에서도 별도 등록 명령 없이 애플리케이션을 실행하면 된다.

```bash
npm run start
```

시작 등록은 애플리케이션의 글로벌 Application Command 목록을 현재 정의로
덮어쓴다. 단일 프로세스 내부에서는 개발 모드의 모듈 재로딩이 발생해도
`globalThis` 상태를 사용하여 한 번만 실행한다.

## 4. 실행 확인

애플리케이션 로그에 `discord.ready`가 나타난 뒤 Discord 서버에서 `/핑` 또는
`/ping`을 실행한다. 정상 연결이면 Gateway 지연 시간이 비공개 응답으로 표시된다.
