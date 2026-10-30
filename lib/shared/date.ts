const kstDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const kstMonthDayFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "2-digit",
  day: "2-digit",
});

const dateTimeOptions: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Seoul",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

const kstDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", dateTimeOptions);
const kstFullDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  ...dateTimeOptions,
  year: "numeric",
});

/** 한국어 로케일의 KST 날짜·시간을 표시한다. */
export function formatDateTime(
  date: Date,
  { includeYear = false }: { includeYear?: boolean } = {},
) {
  const formatter = includeYear ? kstFullDateTimeFormatter : kstDateTimeFormatter;
  return formatter.format(date);
}

/** 한국어 로케일의 KST 월·일을 표시한다. */
export function formatKstMonthDay(date: Date) {
  return kstMonthDayFormatter.format(date);
}

/** 날짜를 KST 기준 YYYY.MM.DD 형식으로 변환한다. */
export function formatKstDate(date: Date) {
  const parts = kstDateFormatter.formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}.${values.month}.${values.day}`;
}

/** 날짜와 시간을 KST 기준 MM.DD / HH:mm KST 형식으로 변환한다. */
export function formatKstDateTime(date: Date) {
  const parts = kstDateTimeFormatter.formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.month}.${values.day} / ${values.hour}:${values.minute} KST`;
}
