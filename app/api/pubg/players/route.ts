import { PubgApiError } from "@/lib/pubg/client";
import { getPlayerByName } from "@/lib/pubg/players";
import {
  PUBG_PLATFORMS,
  type PubgPlatform,
} from "@/lib/pubg/types";

function isPubgPlatform(value: string): value is PubgPlatform {
  // 런타임 검증과 동시에 TypeScript 타입을 PubgPlatform으로 좁힌다.
  return PUBG_PLATFORMS.some((platform) => platform === value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim();
  // 플랫폼을 생략하면 가장 일반적인 PC Kakao 샤드를 사용한다.
  const platformParam = searchParams.get("platform") ?? "kakao";

  if (!name) {
    return Response.json(
      { error: "The name query parameter is required." },
      { status: 400 },
    );
  }

  if (name.length > 64 || name.includes(",")) {
    return Response.json(
      { error: "Enter one player name with 64 characters or fewer." },
      { status: 400 },
    );
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
    const player = await getPlayerByName(name, platformParam);

    if (!player) {
      return Response.json({ error: "Player not found." }, { status: 404 });
    }

    return Response.json({ data: player });
  } catch (error) {
    if (error instanceof PubgApiError) {
      // PUBG의 인증 오류나 장애 세부 정보는 외부에 그대로 노출하지 않는다.
      const status = error.status === 429 ? 429 : error.status === 500 ? 500 : 502;
      const headers = error.retryAfter
        ? { "Retry-After": error.retryAfter }
        : undefined;

      return Response.json(
        { error: error.message },
        { status, headers },
      );
    }

    return Response.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
