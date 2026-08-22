import { PubgApiError } from "@/lib/pubg/client";
import {
  getCurrentSeasonId,
  getPlayerSeasonStats,
} from "@/lib/pubg/seasons";
import { PUBG_PLATFORMS, type PubgPlatform } from "@/lib/pubg/types";

function isPubgPlatform(value: string): value is PubgPlatform {
  return PUBG_PLATFORMS.some((platform) => platform === value);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> },
) {
  const { accountId } = await params;
  const { searchParams } = new URL(request.url);
  const platformParam = searchParams.get("platform") ?? "kakao";
  const requestedSeasonId = searchParams.get("seasonId")?.trim();

  if (!accountId || accountId.length > 128 || accountId.includes("/")) {
    return Response.json({ error: "Invalid account ID." }, { status: 400 });
  }

  if (requestedSeasonId && requestedSeasonId.length > 128) {
    return Response.json({ error: "Invalid season ID." }, { status: 400 });
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
    // seasonId를 생략하면 현재 시즌을 찾아주므로 클라이언트가 시즌 ID를 알 필요가 없다.
    const seasonId =
      requestedSeasonId ?? (await getCurrentSeasonId(platformParam));
    const stats = await getPlayerSeasonStats(
      accountId,
      seasonId,
      platformParam,
    );

    return Response.json({ data: stats });
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
