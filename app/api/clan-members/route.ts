import { parseJsonBody, withApiErrorHandler } from "@/lib/api/route-handler";
import { registerClanMember } from "@/lib/services/clan-member-service";

export const POST = withApiErrorHandler(async (request) => {
  const input = await parseJsonBody(request);

  const member = await registerClanMember(input);

  return Response.json({ data: member }, { status: 201 });
});
