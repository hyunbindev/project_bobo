# Discord 입장 등록 안내

서버 입장 → 개인 DM의 **아이디 등록하기** → 기존 `/join/discord?token=...` 페이지 → 계정 저장 및 서버 닉네임 적용 흐름이다. 기존 등록 API와 암호화 토큰을 재사용하며 DB 마이그레이션은 필요하지 않다.

## 운영 설정

1. [Discord Developer Portal](https://discord.com/developers/applications)에서 앱을 선택한다.
2. **Bot → Privileged Gateway Intents → Server Members Intent**를 켠다. 코드에서도 `GatewayIntentBits.GuildMembers`를 요청하므로, 이 설정 없이 재시작하면 Gateway 연결이 거부될 수 있다.
3. 입장 DM의 서버 ID는 이벤트의 `member.guild.id`를 사용한다. `DISCORD_GUILD_ID` 설정 여부와 관계없이 봇이 참여한 서버의 신규 입장자를 처리한다. 해당 환경변수는 기존 치킨 알림 등에서 계속 사용한다.
4. 기존 `APP_BASE_URL`, `DISCORD_REGISTRATION_ENCRYPTION_KEY`, `DISCORD_BOT_TOKEN`, DB 연결 설정을 유지하고 봇을 재시작한다.

## 처리 규칙

- 새 `guildMemberAdd` 이벤트만 처리한다. 기존 서버 회원에게 일괄 DM을 보내지 않는다.
- 봇 계정과 해당 서버에 이미 등록된 사용자는 제외한다. 기존 등록자의 닉네임 재적용은 기존 동기화·재시도 절차를 사용한다.
- DM에는 서버·사용자 ID를 담은 기존 암호화 토큰 링크를 사용한다. 로그에 링크나 오류 원본을 기록하지 않는다.
- DM 차단 등으로 전송에 실패하면 `discord.registration_dm_failed`에 서버·사용자 ID, 처리 단계, 오류 코드만 기록한다. 자동 반복 전송이나 공개 채널로의 개인 링크 전송은 하지 않는다.
- DM을 받지 못한 사용자는 서버에서 `/시작하기`(`/start`)로 개인 등록 링크를 다시 받을 수 있다.
- 회원 심사가 있는 서버에서는 심사 완료 전에도 입장 이벤트가 발생할 수 있다. 이 DM은 서버의 심사·역할 조건을 변경하지 않는다.

## 닉네임 자동 동기화

`0010_discord_auto_sync.sql`은 `player_discord_accounts.is_auto_sync`를 추가한다.
기본값은 `true`이며 기존 계정도 자동 동기화를 유지한다. 주기적 PUBG 닉네임 동기화는
이 값이 `true`인 연동 계정만 조회하므로 `false`인 계정은 닉네임과 동기화 상태를 변경하지 않는다.
직접 등록·수동 재시도는 계속 허용하며 재등록 시 저장된 `is_auto_sync` 값을 덮어쓰지 않는다.
설정 UI는 추가하지 않았으며 계정의 DB 값을 변경해 관리한다. 코드 실행 전에 `npm run db:migrate`로 적용한다.

## 확인

등록하지 않은 테스트 계정으로 지정 서버에 입장해 DM 버튼의 등록 페이지를 확인한다. 해당 계정 등록 후 재입장하면 DM이 생략되는지, DM을 차단한 계정에서는 실패 로그만 남고 `/시작하기`로 등록 가능한지 확인한다.

참고: [Gateway privileged intents](https://discord.com/developers/docs/events/gateway#privileged-intents), [Discord 오류 코드](https://discord.com/developers/docs/topics/opcodes-and-status-codes#json-json-error-codes).
