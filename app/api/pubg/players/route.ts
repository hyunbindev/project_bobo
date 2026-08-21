import { PubgApiError } from "@/lib/pubg/client";
import { getPlayerByName } from "@/lib/pubg/players";
import {
  PUBG_PLATFORMS,
  type PubgPlatform,
} from "@/lib/pubg/types";

function isPubgPlatform(value: string): value is PubgPlatform {
  return PUBG_PLATFORMS.some((platform) => platform === value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim();
  const platformParam = searchParams.get("platform") ?? "steam";

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
