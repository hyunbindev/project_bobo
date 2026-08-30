import "server-only";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  escapeMarkdown,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
} from "discord.js";

import { createDiscordAppUrl } from "@/lib/discord/discord-app-url";
import type { RecentWonMatch } from "@/lib/services/match-service";

const numberFormatter = new Intl.NumberFormat("ko-KR");
const mapLabels: Record<string, string> = {
  Baltic_Main: "ERANGEL",
  Chimera_Main: "PARAMO",
  Desert_Main: "MIRAMAR",
  DihorOtok_Main: "VIKENDI",
  Heaven_Main: "HAVEN",
  Kiki_Main: "DESTON",
  Neon_Main: "RONDO",
  Range_Main: "CAMP JACKAL",
  Savage_Main: "SANHOK",
  Summerland_Main: "KARAKIN",
  Tiger_Main: "TAEGO",
};

/** 커맨드와 자동 알림이 함께 사용하는 치킨 경기 Components V2 메시지다. */
export function createWinMatchMessage(
  match: RecentWonMatch,
  footerText: string,
) {
  const playedAt = Math.floor(match.playedAt.getTime() / 1_000);
  const mapName = formatMapName(match.mapName);
  const mode = formatMode(match.matchType, match.gameMode);
  const detailUrl = createDiscordAppUrl(
    `/matches/${encodeURIComponent(match.matchId)}/rosters/${encodeURIComponent(match.rosterId)}`,
  );
  const members = [...match.members].sort(
    (left, right) => right.damage - left.damage,
  );

  const message = new ContainerBuilder()
    .setAccentColor(0xf0b429)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "# 🍗 WINNER WINNER CHICKEN DINNER\n-# BOBO CLAN RECENT VICTORY",
      ),
    )
    .addSeparatorComponents(createSeparator(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          `### ${mapName}`,
          `**${mode}**`,
          `-# <t:${playedAt}:F> · <t:${playedAt}:R>`,
        ].join("\n"),
      ),
    )
    .addSeparatorComponents(createSeparator(SeparatorSpacingSize.Large))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          "### BOBO TEAM RECORD",
          "`RANK` **#1**",
          `\`KILLS\` **${numberFormatter.format(match.kills)}**`,
          `\`DAMAGE\` **${numberFormatter.format(Math.round(match.damage))}**`,
        ].join("\n"),
      ),
    )
    .addSeparatorComponents(createSeparator(SeparatorSpacingSize.Large))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          "### BOBO SQUAD",
          members.length > 0
            ? members
                .map(
                  (member, index) =>
                    `${index+1} **${escapeMarkdown(member.name)}** · ${member.kills} K · ${numberFormatter.format(Math.round(member.damage))} DMG`,
                )
                .join("\n")
            : "클랜원 상세 기록이 없습니다.",
        ].join("\n"),
      ),
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(false)
        .setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# Match ${match.matchId.slice(0, 8)} · ${escapeMarkdown(footerText)}`,
      ),
    );

  if (detailUrl) {
    message.addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("경기 상세 보기")
          .setStyle(ButtonStyle.Link)
          .setURL(detailUrl),
      ),
    );
  }

  return {
    components: [message],
    flags: MessageFlags.IsComponentsV2,
  } as const;
}

function createSeparator(spacing: SeparatorSpacingSize) {
  return new SeparatorBuilder().setDivider(true).setSpacing(spacing);
}

function formatMapName(mapName: string) {
  return mapLabels[mapName] ?? mapName.replace(/_Main$/i, "").toUpperCase();
}

function formatMode(matchType: string, gameMode: string) {
  const matchTypeLabel =
    matchType === "competitive"
      ? "경쟁전"
      : matchType === "custom"
        ? "커스텀"
        : "일반전";

  return `${matchTypeLabel} · ${gameMode.replaceAll("-", " ").toUpperCase()}`;
}
