import posthog from "posthog-js";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim();
const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim();

// 개발·테스트 모드에서는 토큰이 설정되어 있어도 이벤트와 리플레이 수집을 시작하지 않는다.
if (process.env.NODE_ENV === "production" && projectToken && apiHost) {
  posthog.init(projectToken, {
    api_host: apiHost,
    defaults: "2026-08-30",
    // GA는 유지하고 PostHog는 세션 리플레이를 중심으로 사용한다.
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: false,
      maskTextSelector: null,
    },
    loaded(client) {
      // 자동 수집이 꺼져 있어도 설치 확인과 세션의 진입 시점을 기록한다.
      client.capture("replay_client_initialized");
    },
  });
}
