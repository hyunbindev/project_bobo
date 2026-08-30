import type {
  TeamSplitMemberSnapshot,
  TeamSplitTeamSnapshot,
} from "@/lib/team-split/types";

export type TeamMember = TeamSplitMemberSnapshot;
export type TeamSplitTeam = TeamSplitTeamSnapshot;

export type TeamSplitResultData = {
  createdAt: string;
  requestedBy: string;
  teams: TeamSplitTeam[];
  voiceChannel: string;
};
