import type { Metadata } from "next";

import { SiteHeader } from "@/components/clan-dashboard/site-header";
import {
  TeamSplitResult,
  TeamSplitUnavailable,
} from "@/components/team-split";
import { getMainClanSummary } from "@/lib/services/clan-service";
import { getActiveTeamSplitResult } from "@/lib/services/team-split-service";
import { formatKstDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "팀 배분 결과 | BOBO CLAN",
  description: "BOBO CLAN 내전 팀 배분 결과",
};

export default async function TeamSplitPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const [teamSplit, clan] = await Promise.all([
    getActiveTeamSplitResult(shareToken),
    getMainClanSummary(),
  ]);
  const clanName = clan?.name ?? "BOBO";
  const clanTag = clan?.tag ?? "BOBO";

  return (
    <main className="min-h-screen bg-background pt-18 text-foreground">
      <SiteHeader clanName={clanName} clanTag={clanTag} />
      {teamSplit ? (
        <TeamSplitResult
          createdAt={formatKstDateTime(teamSplit.createdAt)}
          requestedBy={teamSplit.requestedByDisplayName}
          teams={teamSplit.result.teams}
          voiceChannel={teamSplit.discordVoiceChannelName}
        />
      ) : (
        <TeamSplitUnavailable />
      )}
    </main>
  );
}
