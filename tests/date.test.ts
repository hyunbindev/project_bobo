import assert from "node:assert/strict";
import { test } from "node:test";

import {
  formatDateTime,
  formatKstDate,
  formatKstDateTime,
  formatKstMonthDay,
} from "../lib/shared/date";

test("KST 자정과 연도 경계에서 한국 날짜로 표시한다", () => {
  assert.equal(formatKstDate(new Date("2026-12-31T14:59:59Z")), "2026.12.31");
  const midnight = new Date("2026-12-31T15:00:00Z");
  assert.equal(formatKstDate(midnight), "2027.01.01");
  assert.equal(formatKstDateTime(midnight), "01.01 / 00:00 KST");
  assert.match(formatKstMonthDay(midnight), /01\D+01/);
});

test("경기 목록과 상세의 기존 한국어 날짜·시간 형식을 유지한다", () => {
  const date = new Date("2026-10-30T06:20:00Z");
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  assert.equal(formatDateTime(date), new Intl.DateTimeFormat("ko-KR", options).format(date));
  assert.equal(
    formatDateTime(date, { includeYear: true }),
    new Intl.DateTimeFormat("ko-KR", { ...options, year: "numeric" }).format(date),
  );
});

test("실행 환경의 시간대가 달라도 차트와 날짜 표시가 동일하다", () => {
  const previousTimeZone = process.env.TZ;
  const date = new Date("2026-10-30T15:30:00Z");
  const formatAll = () => [
    formatKstMonthDay(date),
    formatKstDate(date),
    formatKstDateTime(date),
    formatDateTime(date),
    formatDateTime(date, { includeYear: true }),
  ];

  try {
    process.env.TZ = "UTC";
    const expected = formatAll();
    process.env.TZ = "America/Los_Angeles";
    assert.deepEqual(formatAll(), expected);
    assert.equal(formatKstDate(date), "2026.10.31");
  } finally {
    if (previousTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimeZone;
  }
});
