import "server-only";

import {
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";

import type { RankingEntry, WeeklyRankingPeriod } from "@/lib/rankings/types";
import { getMainClanSummary } from "@/lib/services/clan-service";
import { getCurrentBoboKingRanking } from "@/lib/services/weekly-ranking-service";

const rankingValueFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 2,
});

/** 현재 진행 중인 주차의 BOBOKING 순위를 조회하여 Discord에 표시한다. */
export async function executeBoboKingCommand(
  interaction: ChatInputCommandInteraction,
) {
  // DB 집계가 Discord의 초기 응답 제한 시간을 넘을 수 있으므로 먼저 응답을 예약한다.
  await interaction.deferReply();

  const clan = await getMainClanSummary();

  if (!clan) {
    await interaction.editReply(
      "등록된 클랜 정보가 없어 BOBOKING 순위를 조회할 수 없습니다.",
    );
    return;
  }

  const { period, ranking } = await getCurrentBoboKingRanking(clan.id);
  const rankingDescription = createRankingDescription(
    ranking.rankings,
    ranking.unit,
  );

  const embed = new EmbedBuilder()
    .setColor(0xf0b429)
    .setTitle(`${clan.name} 이번 주 BOBOKING`)
    .setDescription(rankingDescription)
    .addFields({
      name: "집계 기간",
      value: formatWeeklyPeriod(period),
      inline: false,
    })
    .setFooter({ text: "최소 5경기 참여 기준 · 킬, 기절, 대미지 종합 점수" })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

function createRankingDescription(
  rankings: RankingEntry[],
  unit: string,
) {
  if (rankings.length === 0) {
    return "집계 조건을 충족한 경기 기록이 없습니다.";
  }

  return rankings
    .map(
      (entry) =>
        `**${entry.rank}위**  ${entry.playerName} — **${rankingValueFormatter.format(entry.value)}${unit}** · ${entry.matchCount}경기`,
    )
    .join("\n");
}

function formatWeeklyPeriod(period: WeeklyRankingPeriod) {
  // endAt은 다음 월요일 00:00의 배타적 경계이므로 1ms를 빼서 일요일로 표시한다.
  const inclusiveEndAt = new Date(period.endAt.getTime() - 1);

  return `${formatKstDate(period.startAt)} ~ ${formatKstDate(inclusiveEndAt)}`;
}

function formatKstDate(date: Date) {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}.${values.month}.${values.day}`;
}
