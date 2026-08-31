export type TeamSplitPlayerSnapshot = {
  playerId: string;
  pubgName: string;
  averageDamage: number | null;
  averageRank: number | null;
};

export type TeamSplitMemberSnapshot = {
  discordUserId: string;
  discordDisplayName: string;
  player: TeamSplitPlayerSnapshot | null;
};

export type TeamSplitTeamSnapshot = {
  id: string;
  averageDamage: number | null;
  averageRank: number | null;
  members: TeamSplitMemberSnapshot[];
};

export type TeamSplitSnapshot = {
  teams: TeamSplitTeamSnapshot[];
};

