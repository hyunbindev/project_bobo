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
import type { WinMatchContext } from "@/lib/discord/messages/win-match-context";
import type { RecentWonMatch } from "@/lib/matches/types";
import { formatMapName } from "@/lib/pubg/maps";
import { formatMatchMode } from "@/lib/pubg/game-modes";

const numberFormatter = new Intl.NumberFormat("ko-KR");

/** 커맨드와 자동 알림이 함께 사용하는 치킨 경기 Components V2 메시지다. */
export function createWinMatchMessage(
  match: RecentWonMatch,
  context: WinMatchContext = {},
) {
  const playedAt = Math.floor(match.playedAt.getTime() / 1_000);
  const mapName = formatMapName(match.mapName);
  const mode = formatMatchMode(match.matchType, match.gameMode);
  const path = `/matches/${encodeURIComponent(match.matchId)}/rosters/${encodeURIComponent(match.rosterId)}`;
  const detailUrl = createDiscordAppUrl(`${path}#match-records`, {
    campaign: "match_win",
    content: "match_details",
  });
  const historyUrl = createDiscordAppUrl(`${path}?squadHistory=open&squadPage=1#squad-summary`, {
    campaign: "match_win",
    content: "squad_comparison",
  });
  const members = [...match.members].sort(
    (left, right) => right.damage - left.damage,
  );
  
  const memberNames = members.map((member) => escapeMarkdown(member.name)).join(", ");

  const message = new ContainerBuilder()
    .setAccentColor(0xf0b429)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        context.summary
          ? `# 함께한 ${context.summary.matchCount}매치 중 ${context.summary.winCount}번째 치킨!\n${memberNames} 힘을 합쳐 치킨을 먹었습니다!`
          : `# ${memberNames} 힘을 합쳐 치킨을 먹었습니다!`,
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
          "`RANK` **#1**",
          `\`TEAM KILLS\` **${numberFormatter.format(match.kills)}**`,
          `\`TEAM DAMAGE\` **${numberFormatter.format(Math.round(match.damage))}**`,
        ].join("\n"),
      ),
    )
    .addSeparatorComponents(createSeparator(SeparatorSpacingSize.Large))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("### BOBO SQUAD"));

  for (const member of members) {
    const profile = context.profiles?.get(member.pubgAccountId);
    const discordName = profile ? ` · <@${profile.userId}>` : "";
    const text = new TextDisplayBuilder().setContent([
      `**${escapeMarkdown(member.name)}**${discordName}`,
      `\`${member.kills} Kill\` · \`${numberFormatter.format(Math.round(member.damage))} damage\``,
    ].join("\n"));
    message.addTextDisplayComponents(text);
  }

  if (members.length === 0) message.addTextDisplayComponents(new TextDisplayBuilder().setContent("클랜원 상세 기록이 없습니다."));

  if (detailUrl) {
    message
      .addSeparatorComponents(createSeparator(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "아래 버튼을 눌러 이전 경기 평균과 이번 경기의 킬·딜·순위를 비교해 보세요.",
        ),
      );

    const buttons = new ActionRowBuilder<ButtonBuilder>();
    if (historyUrl) {
      buttons.addComponents(
        new ButtonBuilder()
          .setEmoji("📈")
          .setLabel("우리 조합 성적 비교 보기")
          .setStyle(ButtonStyle.Link)
          .setURL(historyUrl),
      );
    }
    buttons.addComponents(
      new ButtonBuilder()
        .setEmoji("📊")
        .setLabel("경기 상세 기록 보기")
        .setStyle(ButtonStyle.Link)
        .setURL(detailUrl),
    );
    message.addActionRowComponents(buttons);
  }

  return {
    components: [message],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  } as const;
}

function createSeparator(spacing: SeparatorSpacingSize) {
  return new SeparatorBuilder().setDivider(true).setSpacing(spacing);
}
