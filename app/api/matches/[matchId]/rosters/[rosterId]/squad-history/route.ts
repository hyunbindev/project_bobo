import { BadRequestError } from "@/lib/api/errors";
import { withApiErrorHandler } from "@/lib/api/route-handler";
import { getMainClanSummary } from "@/lib/services/clan-service";
import { getSquadHistory } from "@/lib/services/squad-history-service";

type RouteContext = {
  params: Promise<{ matchId: string; rosterId: string }>;
};

export const GET = withApiErrorHandler<RouteContext>(async (request, { params }) => {
  const { matchId, rosterId } = await params;
  const pageValue = new URL(request.url).searchParams.get("page") ?? "1";
  const page = Number(pageValue);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(matchId) ||
      !rosterId.trim() || rosterId.length > 256) {
    throw new BadRequestError("유효하지 않은 경기 또는 로스터 ID입니다.");
  }
  if (!/^\d+$/.test(pageValue) || !Number.isSafeInteger(page) || page < 1) {
    throw new BadRequestError("페이지는 1 이상의 정수여야 합니다.");
  }
  const clan = await getMainClanSummary();
  const data = clan ? await getSquadHistory({ matchId, rosterId, clanId: clan.id }, page) : null;
  return Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
});
