import { PubgApiError } from "@/lib/pubg/client";
import { getMatchById } from "@/lib/pubg/matches";
import {
  PUBG_PLATFORMS,
  type PubgPlatform,
} from "@/lib/pubg/types";

function isPubgPlatform(value: string): value is PubgPlatform {
  return PUBG_PLATFORMS.some((platform) => platform === value);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  // Next.js 16의 동적 Route Handler params는 Promise이므로 await해야 한다.
  const { matchId } = await params;
  const { searchParams } = new URL(request.url);
  const platformParam = searchParams.get("platform") ?? "kakao";

  // PUBG ID를 UUID로 단정하지 않고 외부 API의 불투명한 문자열로 검증한다.
  if (!matchId || matchId.length > 128 || matchId.includes("/")) {
    return Response.json({ error: "Invalid match ID." }, { status: 400 });
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
    const match = await getMatchById(matchId, platformParam);
    return Response.json({ data: match });
  } catch (error) {
    if (error instanceof PubgApiError) {
      // 존재하지 않거나 보존 기간이 지난 매치는 PUBG의 404를 그대로 전달한다.
      const status = error.status === 404 ? 404 : 502;
      return Response.json({ error: error.message }, { status });
    }

    return Response.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
