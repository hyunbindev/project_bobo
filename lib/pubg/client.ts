const PUBG_API_BASE_URL = "https://api.pubg.com";
const PUBG_ACCEPT = "application/vnd.api+json";

type PubgFetchOptions = {
  searchParams?: Record<string, string>;
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

  if (!apiKey) {
    throw new PubgApiError("PUBG_API_KEY is not configured.", 500);
  }

  const url = new URL(path, PUBG_API_BASE_URL);

  for (const [key, value] of Object.entries(options.searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: PUBG_ACCEPT,
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new PubgApiError(`PUBG API request failed: ${message}`, 502);
  }

  if (!response.ok) {
    throw new PubgApiError(
      `PUBG API returned ${response.status}.`,
      response.status,
      response.headers.get("retry-after"),
    );
  }

  return (await response.json()) as T;
}
