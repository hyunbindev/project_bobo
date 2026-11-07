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

### 음성채널의 기존 회원 수집

`voiceStateUpdate`에서 음성채널 입장·이동이 발생하면, 해당 서버의 `player_discord_accounts`에
연동되지 않은 회원의 표시 이름을 `현빈 98 / Nopanty_B_cup` 형식으로 파싱한다. 띄어쓰기는 선택 사항이며
이름·출생연도 두 자리·배그 닉네임이 있어야 한다. 연도 뒤 두 자리가 50보다 크면 1900년대, 나머지는
2000년대로 변환하며 미래 연도는 제외한다. 서버 ID는 이벤트에서 받는다.

`lib/members/player-service.ts`의 `resolvePubgPlayer`로 카카오 계정을 확인한다. 기존 Discord 등록 명령과
같은 플랫폼이며, DB에 계정이 있으면 재사용하고 없으면 PUBG API를 조회한다. 계정 없음·호출 제한·API 오류를
기존 등록 흐름과 동일한 오류 코드로 구분한다. 이 공통 함수는 조회·검증만 하고 저장이나 Discord 수정은 하지 않는다.

검증 성공 시 기존 `player_discord_accounts`에 서버 ID·사용자 ID·사용자명·표시 이름·이름·출생연도와
검증한 PUBG 계정을 저장한다. 수집만 된 기존 행도 같은 ID로 갱신하지만 다른 계정의 기존 연결은 덮어쓰지 않는다.

`0011_discord_collected_accounts.sql`까지 마이그레이션을 적용하고 봇을 완전히 재시작해야 한다.
이 마이그레이션은 기존 테이블의 세 컬럼만 nullable로 변경하며 별도 테이블을 생성하지 않는다.
전체 회원을 봇 시작 시 수집하거나 DM을 발송하지 않는다. 음성채널 퇴장·음소거 변경·봇 계정은 제외한다.
연동 완료된 같은 서버·사용자는 다시 수집하지 않는다. 수집 행은 최신 서버 재적·온라인 상태를 나타내지 않는다.
정식 등록 여부는 배그 계정·이름·출생연도가 모두 있는지로 판단한다. 음성 수집으로 신규 생성하거나 미등록 행을
완성할 때는 `is_auto_sync=false`로 저장한다. 이미 등록 완료된 계정은 수집 대상에서 제외해 설정을 유지한다.
직접 등록은 신규 계정의 기본값 `true`를 사용하고, 기존 계정의 설정은 변경하지 않는다.

형식 오류나 계정 검증 실패 시 저장하지 않으며 다음 음성채널 입장·이동에서 다시 시도한다.
수집 과정에서 DM 발송·서버 닉네임 변경은 실행하지 않는다. 직접 등록은 같은 검증·저장 함수 호출 후 닉네임을 적용한다.
기존 신규 서버 가입자 환영 DM 흐름과는 별도 처리다.

수집 성공은 `discord.voice_member_collected`, 실패는 `discord.voice_member_collection_failed` 로그로 확인한다.

등록하지 않은 테스트 계정으로 지정 서버에 입장해 DM 버튼의 등록 페이지를 확인한다. 해당 계정 등록 후 재입장하면 DM이 생략되는지, DM을 차단한 계정에서는 실패 로그만 남고 `/시작하기`로 등록 가능한지 확인한다.

참고: [Gateway privileged intents](https://discord.com/developers/docs/events/gateway#privileged-intents), [Discord 오류 코드](https://discord.com/developers/docs/topics/opcodes-and-status-codes#json-json-error-codes).
