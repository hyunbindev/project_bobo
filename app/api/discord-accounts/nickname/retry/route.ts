import { parseJsonBody, withApiErrorHandler } from "@/lib/api/route-handler";
import { retryDiscordNickname } from "@/lib/discord-accounts/service";

export const POST = withApiErrorHandler(async (request) => {
  const input = await parseJsonBody(request);
  const discordNicknameUpdate = await retryDiscordNickname(input);
  return Response.json({ data: { discordNicknameUpdate } });
});
