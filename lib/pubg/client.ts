const PUBG_API_BASE_URL = "https://api.pubg.com";
// PUBG API가 사용하는 JSON:API 미디어 타입이다.
const PUBG_ACCEPT = "application/vnd.api+json";

type PubgFetchOptions = {
  searchParams?: Record<string, string>;
  authorization?: boolean;
};

export class PubgApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryAfter: string | null = null,
  ) {
    super(message);
    this.name = "PubgApiError";
  }
}

export async function pubgFetch<T>(
  path: string,
  options: PubgFetchOptions = {},
): Promise<T> {
  const apiKey = process.env.PUBG_API_KEY;
  const requiresAuthorization = options.authorization ?? true;

  // API 키가 클라이언트 번들에 노출되지 않도록 서버 환경 변수만 읽는다.
  if (requiresAuthorization && !apiKey) {
    throw new PubgApiError("PUBG_API_KEY is not configured.", 500);
  }

  const url = new URL(path, PUBG_API_BASE_URL);

  for (const [key, value] of Object.entries(options.searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  let response: Response;
  const headers = new Headers({ Accept: PUBG_ACCEPT });

  // Match API처럼 인증이 필요 없는 엔드포인트에는 Authorization을 보내지 않는다.
  if (requiresAuthorization && apiKey) {
    headers.set("Authorization", `Bearer ${apiKey}`);
  }

  try {
    response = await fetch(url, {
      headers,
      // 동기화 시 오래된 PUBG 응답을 재사용하지 않는다.
      cache: "no-store",
      // 외부 API 장애가 Next.js 요청을 계속 붙잡지 않도록 제한한다.
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new PubgApiError(`PUBG API request failed: ${message}`, 502);
  }

  if (!response.ok) {
    // Route Handler가 429와 Retry-After를 클라이언트에 전달할 수 있게 보존한다.
    throw new PubgApiError(
      `PUBG API returned ${response.status}.`,
      response.status,
      response.headers.get("retry-after"),
    );
  }

  return (await response.json()) as T;
}
