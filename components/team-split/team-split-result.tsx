import { TeamRosterSection } from "./team-roster-section";
import { TeamSplitHero } from "./team-split-hero";
import { TeamSplitMetaBar } from "./team-split-meta-bar";
import type { TeamSplitResultData } from "./types";

export function TeamSplitResult({
  createdAt,
  requestedBy,
  teams,
  voiceChannel,
}: TeamSplitResultData) {
  const memberCount = teams.reduce(
    (total, team) => total + team.members.length,
    0,
  );

  return (
    <>
      <TeamSplitHero
        createdAt={createdAt}
        memberCount={memberCount}
        teamCount={teams.length}
      />
      <TeamSplitMetaBar
        requestedBy={requestedBy}
        voiceChannel={voiceChannel}
      />
      <TeamRosterSection teams={teams} />
    </>
  );
}

