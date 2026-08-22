import { getClanById } from "@/lib/pubg/clans";
import { PubgApiError } from "@/lib/pubg/client";
import { PUBG_PLATFORMS, type PubgPlatform } from "@/lib/pubg/types";

function isPubgPlatform(value: string): value is PubgPlatform {
  return PUBG_PLATFORMS.some((platform) => platform === value);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clanId: string }> },
) {
  // Next.js 16의 동적 Route Handler params는 Promise라서 먼저 기다려야 한다.
  const { clanId } = await params;
  const { searchParams } = new URL(request.url);
  const platformParam = searchParams.get("platform") ?? "kakao";

  // clanId는 UUID 버전에 의존하지 않고 PUBG가 발급한 불투명 문자열로 취급한다.
  if (!clanId || clanId.length > 128 || clanId.includes("/")) {
    return Response.json({ error: "Invalid clan ID." }, { status: 400 });
  }

  if (!isPubgPlatform(platformParam)) {
    return Response.json(
      {
        error: `Unsupported platform. Use one of: ${PUBG_PLATFORMS.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  try {
    const clan = await getClanById(clanId, platformParam);
    return Response.json({ data: clan });
  } catch (error) {
    if (error instanceof PubgApiError) {
      const status =
        error.status === 404
          ? 404
          : error.status === 429
            ? 429
            : error.status === 500
              ? 500
              : 502;
      const headers = error.retryAfter
        ? { "Retry-After": error.retryAfter }
        : undefined;

      return Response.json({ error: error.message }, { status, headers });
    }

    return Response.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
