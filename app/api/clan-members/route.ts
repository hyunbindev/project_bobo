import { parseJsonBody, withApiErrorHandler } from "@/lib/api/route-handler";
import { registerClanMember } from "@/lib/members/service";
import { requireDiscordRegistrationIdentity } from "@/lib/discord-accounts/registration-token";

export const POST = withApiErrorHandler(async (request) => {
  const input = await parseJsonBody(request);

  const identity = requireDiscordRegistrationIdentity(input);
  const member = await registerClanMember(input, identity);

  return Response.json({ data: member }, { status: 201 });
});
