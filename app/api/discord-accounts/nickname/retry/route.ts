import { parseJsonBody, withApiErrorHandler } from "@/lib/api/route-handler";
import { retryDiscordNickname } from "@/lib/discord-accounts/service";
import { requireDiscordRegistrationIdentity } from "@/lib/discord-accounts/registration-token";

export const POST = withApiErrorHandler(async (request) => {
  const input = await parseJsonBody(request);
  const discordNicknameUpdate = await retryDiscordNickname(requireDiscordRegistrationIdentity(input));
  return Response.json({ data: { discordNicknameUpdate } });
});
