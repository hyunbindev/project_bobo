# PostHog Cloud 세션 리플레이

`instrumentation-client.ts`에서 브라우저 SDK를 초기화한다. 서버의 `instrumentation.ts`는 기존 앱·봇 초기화에 사용한다.

## 연결값

로컬은 `.env.local`, 운영은 서버의 `.env.production`에 프로젝트 토큰과 API 호스트를 입력한다.

```dotenv
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=your-project-token
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

토큰은 PostHog 프로젝트 설정의 공개 Project token을 사용한다. Personal API key는 사용하지 않는다.
호스트는 프로젝트 설치 안내에 표시된 주소를 그대로 사용한다. EU 프로젝트는 `https://eu.i.posthog.com`이다.
토큰 또는 호스트가 비어 있으면 SDK 초기화를 생략한다.

PostHog의 Session Replay 설정에서 녹화를 활성화하고 샘플링·URL 트리거를 지정한다.
코드의 `disable_session_recording: false`는 녹화를 허용하며, 실제 녹화 여부는 Cloud 프로젝트의 녹화 규칙도 적용받는다.

## 수집 설정

- GA는 기존대로 사용하며 PostHog 자동 클릭·폼 이벤트, 페이지뷰·페이지 이탈 이벤트 수집은 끈다.
- 세션 리플레이의 입력값 마스킹은 `maskAllInputs: false`, 일반 텍스트 마스킹은 `maskTextSelector: null`로 설정한다.
- 등록 폼의 이름·출생연도·PUBG 닉네임과 완료 화면의 이름은 리플레이에 표시된다. 추가 URL 마스킹은 구성하지 않는다.
- 비밀번호 입력의 SDK 기본 마스킹은 유지된다. 현재 등록 화면에는 비밀번호 입력이 없다.
- 별도의 `identify` 호출 없이 익명 세션으로 시작한다.

## 적용

로컬에서 환경변수를 변경하면 개발 서버를 재시작한다.

운영의 `NEXT_PUBLIC_*` 값은 Dockerfile builder의 ARG/ENV와 Compose build args를 통해 브라우저 번들에 들어간다.
운영에서 값을 바꾸면 이미지를 다시 빌드해야 한다.

```bash
bash scripts/deploy.sh app
```

서버의 실행 환경변수만 바꾸거나 컨테이너만 재시작해서는 브라우저 번들의 값이 바뀌지 않는다.
PostHog Cloud의 녹화 규칙이 켜진 상태에서 사이트를 방문한 뒤 Session Replay 목록에서 해당 세션을 확인한다.

공식 문서: https://posthog.com/docs/libraries/next-js
