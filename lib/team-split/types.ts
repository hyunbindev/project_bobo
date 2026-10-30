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

export type CreateTeamSplitInput = {
  discordGuildId: string;
  discordVoiceChannelId: string;
  discordVoiceChannelName: string;
  requestedByDiscordUserId: string;
  requestedByDisplayName: string;
  membersPerTeam: number;
  members: Array<{
    discordUserId: string;
    discordDisplayName: string;
  }>;
};

export type SaveTeamSplitResultInput = {
  shareToken: string;
  discordGuildId: string;
  discordVoiceChannelId: string;
  discordVoiceChannelName: string;
  requestedByDiscordUserId: string;
  requestedByDisplayName: string;
  membersPerTeam: number;
  teamCount: number;
  memberCount: number;
  result: TeamSplitSnapshot;
  expiresAt: Date;
};
