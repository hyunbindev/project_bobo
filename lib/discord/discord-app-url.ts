import "server-only";

const DEVELOPMENT_BASE_URL = "http://localhost:3000";

/** Discord 메시지에서 사용하는 서비스 내부 링크를 생성한다. */
export function createDiscordAppUrl(pathname: string) {
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? DEVELOPMENT_BASE_URL
      : process.env.APP_BASE_URL?.trim();

  if (!baseUrl) {
    return null;
  }

  try {
    return new URL(pathname, baseUrl).toString();
  } catch {
    return null;
  }
}
