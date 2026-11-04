import posthog from "posthog-js";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim();
const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim();

// 연결값이 없으면 로컬·CI 및 미설정 배포에서는 수집을 시작하지 않는다.
if (projectToken && apiHost) {
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
  });
}
