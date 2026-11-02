# Discord 등록 정보 이관

`0008_move_clan_profiles_to_discord.sql`은 기존 테이블을 `player_discord_accounts`로 변경하고
`clan_members.player_id`를 통해 PUBG 계정에 직접 연결합니다.

## 변경 내용

- `clan_member_id` → `player_id` (기존 ID 값을 이름만 바꾸지 않고 조인하여 채움)
- `clan_members.display_name`, `birth_year` → 연동 행의 `name`, `birth_year`
- 기존 `discord_display_name`과 계정 ID, 사용자명, 생성·수정 시각은 유지
- `clan_members`의 `display_name`, `birth_year`, `profile_registered` 제거
- 등록 여부는 Discord 연동 행의 존재로 판단
- 플레이어 ID와 기존 경기·클랜 소속 데이터는 유지
- Discord 미연동 회원의 기존 이름·출생연도·등록 상태는 이관하지 않고 컬럼 제거 시 버림

`name`은 사용자가 입력한 이름이고, `discord_display_name`은 Discord 서버에서
확인한 표시 이름입니다. 프로필 동기화가 사용자 입력 이름을 덮어쓰지 않도록 구분합니다.

## 적용 전 확인

아래 데이터가 있으면 SQL이 예외를 발생시키고 이관을 중단합니다.

1. Discord 연동은 있지만 이름·출생연도 또는 플레이어 연결이 불완전한 회원
2. 같은 플레이어·서버에 여러 Discord 계정이 연결된 경우

미연동 회원의 기존 이름·출생연도는 버리는 정책으로 이관을 진행합니다.
미연동 회원도 `clan_members`와 `players` 행은 유지하며, Discord 연동 행은 만들지 않습니다.
SQL은 Discord 사용자 ID나 출생연도를 임의로 만들어 채우지 않습니다.
여러 클랜 이력의 연동 충돌도 임의 병합하거나 삭제하지 않습니다.

## 적용

변경된 코드와 DB 스키마는 함께 배포해야 합니다. 기존 봇·동기화 프로세스를 종료한 뒤
DB 백업과 대상 `DATABASE_URL`을 확인하고 실행합니다.

```sh
npm run db:migration-check
npm run db:migrate
```

Drizzle migrator의 트랜잭션 안에서 실행해야 합니다. 데이터를 검사하는 동안 기존 두
테이블에 쓰기가 섞이지 않도록 잠금을 사용합니다. SQL을 문장별로 자동 커밋하지 마세요.
이 파일 작성 작업에서는 실제 애플리케이션 DB에 `db:migrate`를 실행하지 않습니다.

## 애플리케이션 변경

- Discord 등록은 `players`와 `player_discord_accounts`만 저장합니다.
- 클랜 가입·탈퇴 동기화는 실제 소속을 관리하고 Discord 등록 정보를 변경하지 않습니다.
- 클랜원 화면은 `DISCORD_GUILD_ID`의 등록 프로필을 읽습니다. 미설정 시 플레이어별로
  가장 최근 수정된 연동 행을 선택해 서버가 여러 개여도 목록이 중복되지 않게 합니다.
- 봇 등록 명령에 사용자 입력 이름 옵션이 추가되었습니다. 다음 봇 초기화에서 명령 등록이 필요합니다.
- 인증 링크·세션 연결은 별도 작업입니다. 현재는 임시로 본인 확인 조건을 주석 처리하여 폼의 Discord ID로 등록을 진행합니다.
- 웹·봇 등록에서 DB 저장이 완료되면 봇 토큰으로 서버 닉네임을 `이름 출생연도 두 자리 / PUBG닉네임` 형식으로 변경합니다.
  닉네임은 32자 이내여야 하며, 봇의 닉네임 관리 권한과 대상보다 높은 역할이 필요합니다. 서버 소유자는 변경할 수 없습니다.
  실패해도 등록 정보는 유지하고 `discordNicknameUpdate` 결과로 화면·봇 응답에 안내합니다. 같은 계정으로 다시 등록하면 재시도합니다.

### Discord에서 등록 페이지로 ID 전달

`createDiscordRegistrationUrl(member.id, member.guild.id)`로 링크를 생성합니다.

```text
/join/discord?discordUserId=123456789012345678&discordGuildId=234567890123456789
```

페이지는 두 값을 문자열로 읽어 폼에 전달하고, 폼은 등록 요청 JSON에 함께 넣습니다.
누락·중복·잘못된 ID 형식은 사용하지 않습니다. 이 파라미터는 전달용이며 본인 인증이 아닙니다.
현재 서버의 401 본인 확인 조건은 임시로 주석 처리되어 있습니다. ID 형식 검사와 PUBG 계정 검증은 유지합니다. 신규 웹 등록의 Discord 이름은 최초 저장 시 빈 값이며, 닉네임 변경 성공 시 Discord API 응답의 표시 이름·사용자명으로 갱신합니다. 기존 이름은 변경 실패 시 보존합니다. 본인 확인을 도입할 때 서명된 링크 또는 검증된 세션과 함께 조건을 다시 활성화해야 합니다.
서버에서 `/시작하기`(기본 이름 `/start`)를 실행하면 본인만 보는 응답에 등록 페이지 링크 버튼이 표시됩니다.
사용자·서버 ID는 명령을 실행한 interaction에서 가져옵니다. 기존 `/아이디등록`은 Discord 안에서 직접 입력하는 방식으로 유지합니다.
명령 목록 반영에는 앱 프로세스 재시작이 필요하며, 개발 모드는 localhost, 운영 모드는 `APP_BASE_URL`을 사용합니다.
사용자 입장 시 환영 메시지로 링크를 발송하는 이벤트는 별도 연결이 필요합니다.

## 검증

테스트는 연결 로컬 임시 테이블을 사용하며 운영 데이터에 이관 SQL을 적용하지 않습니다.

```sh
node --import tsx --test tests/discord-profile-migration.test.ts tests/member-registration-api.test.ts
```

PostgreSQL 이관 테스트에는 별도의 테스트 DB를 가리키는 `TEST_DATABASE_URL`이 필요합니다.
