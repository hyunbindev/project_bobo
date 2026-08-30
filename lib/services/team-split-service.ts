import "server-only";

import { randomBytes, randomInt } from "node:crypto";

import {
  deleteExpiredTeamSplitResults,
  findActiveTeamSplitResultByToken,
  findPlayerStatsByDiscordUserIds,
  saveTeamSplitResult,
} from "@/lib/repositories/team-split-repository";
import type {
  TeamSplitMemberSnapshot,
  TeamSplitTeamSnapshot,
} from "@/lib/team-split/types";

const RESULT_TTL_MS = 15 * 60 * 1_000;
const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{24}$/;

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

export async function createTeamSplit(input: CreateTeamSplitInput) {
  if (!Number.isInteger(input.membersPerTeam) || input.membersPerTeam < 1) {
    throw new RangeError("membersPerTeam must be a positive integer.");
  }

  if (input.members.length === 0) {
    throw new RangeError("At least one member is required.");
  }

  const playerStats = await findPlayerStatsByDiscordUserIds(
    input.discordGuildId,
    input.members.map((member) => member.discordUserId),
  );
  const statsByDiscordUserId = new Map(
    playerStats.map((stats) => [stats.discordUserId, stats]),
  );
  const members: TeamSplitMemberSnapshot[] = input.members.map((member) => {
    const stats = statsByDiscordUserId.get(member.discordUserId);

    return {
      ...member,
      player: stats
        ? {
            playerId: stats.playerId,
            pubgName: stats.pubgName,
            averageDamage: normalizeAggregate(stats.averageDamage),
            averageRank: normalizeAggregate(stats.averageRank),
          }
        : null,
    };
  });

  const shuffledMembers = shuffle(members);
  const teamCount = Math.ceil(shuffledMembers.length / input.membersPerTeam);
  const teamMembers = Array.from(
    { length: teamCount },
    () => [] as TeamSplitMemberSnapshot[],
  );

  shuffledMembers.forEach((member, index) => {
    teamMembers[index % teamCount].push(member);
  });

  const teams: TeamSplitTeamSnapshot[] = teamMembers.map(
    (assignedMembers, index) => ({
      id: `team-${index + 1}`,
      averageDamage: average(
        assignedMembers.map((member) => member.player?.averageDamage ?? null),
      ),
      averageRank: average(
        assignedMembers.map((member) => member.player?.averageRank ?? null),
      ),
      members: assignedMembers,
    }),
  );
  const shareToken = randomBytes(18).toString("base64url");
  const expiresAt = new Date(Date.now() + RESULT_TTL_MS);

  // 생성 시점마다 만료된 스냅샷을 정리해 별도 고빈도 배치가 필요 없게 한다.
  await deleteExpiredTeamSplitResults();

  const savedResult = await saveTeamSplitResult({
    shareToken,
    discordGuildId: input.discordGuildId,
    discordVoiceChannelId: input.discordVoiceChannelId,
    discordVoiceChannelName: input.discordVoiceChannelName,
    requestedByDiscordUserId: input.requestedByDiscordUserId,
    requestedByDisplayName: input.requestedByDisplayName,
    membersPerTeam: input.membersPerTeam,
    teamCount: teams.length,
    memberCount: members.length,
    result: { teams },
    expiresAt,
  });

  return savedResult;
}

export async function getActiveTeamSplitResult(shareToken: string) {
  if (!SHARE_TOKEN_PATTERN.test(shareToken)) {
    return null;
  }

  return findActiveTeamSplitResultByToken(shareToken);
}

function shuffle<T>(items: readonly T[]) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = randomInt(index + 1);
    [result[index], result[randomIndex]] = [
      result[randomIndex],
      result[index],
    ];
  }

  return result;
}

function normalizeAggregate(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }

  return roundToOneDecimal(value);
}

function average(values: Array<number | null>) {
  const availableValues = values.filter(
    (value): value is number => value !== null,
  );

  if (availableValues.length === 0) {
    return null;
  }

  return roundToOneDecimal(
    availableValues.reduce((sum, value) => sum + value, 0) /
      availableValues.length,
  );
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

