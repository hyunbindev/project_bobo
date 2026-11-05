import "server-only";

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type GuildMember } from "discord.js";

import { hasDiscordRegistration } from "@/lib/discord-accounts/repository";
import { createDiscordRegistrationUrl } from "@/lib/discord/discord-registration-url";
import { discordLogger } from "@/lib/logger";

const pendingMembers = new Set<string>();

/** 신규 입장자에게 기존 홈페이지 등록 절차를 안내한다. DM 실패는 가입 처리를 막지 않는다. */
export async function handleGuildMemberAdd(member: GuildMember) {
  const guildId = member.guild.id;
  const identity = { discordGuildId: member.guild.id, discordUserId: member.id };

  discordLogger.info({ event: "discord.member_joined", ...identity }, "Received guild member join event");
  if (member.user.bot) {
    discordLogger.info({ event: "discord.registration_dm_skipped", ...identity, reason: "bot_account" },
      "Skipped registration DM");
    return;
  }

  const key = `${guildId}:${member.id}`;
  if (pendingMembers.has(key)) return;
  pendingMembers.add(key);
  let stage = "registration_lookup";

  try {
    if (await hasDiscordRegistration(identity)) {
      discordLogger.info({ event: "discord.registration_dm_skipped", ...identity, reason: "already_registered" },
        "Skipped registration DM for an existing registered member");
      return;
    }

    stage = "registration_link";
    const url = createDiscordRegistrationUrl(member.id, member.guild.id);
    if (!url) {
      discordLogger.warn({ event: "discord.registration_dm_unavailable", ...identity },
        "Registration page URL is not configured; use /start after configuration");
      return;
    }

    const button = new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel("아이디 등록하기")
      .setURL(url);

    stage = "dm_send";
    await member.send({
      content: "👋 **BOBO에 오신 걸 환영해요!**\n\n새로운 분과 함께하게 돼서 반가워요 😊\n부담 없이 인사 나누고, 같이 치킨도 먹으러 가요! 🍗\n\n함께할 때 서로 알아보기 쉽도록 아래 버튼에서 이름·출생연도·배그 닉네임을 등록해 주세요.\n등록하면 서버 닉네임도 자동으로 설정돼요.\n\n궁금한 게 있으면 언제든 편하게 물어봐 주세요. 앞으로 잘 부탁드려요!",
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button)],
      allowedMentions: { parse: [] },
    });
    discordLogger.info({ event: "discord.registration_dm_sent", ...identity },
      "Sent new member registration DM");
  } catch (error) {
    // Discord 오류 객체에는 버튼의 개인 등록 토큰이 포함될 수 있으므로 원본은 기록하지 않는다.
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    discordLogger.warn({
      event: "discord.registration_dm_failed", ...identity, stage,
      code: typeof code === "number" || typeof code === "string" ? code : undefined,
    }, "Could not send registration DM; member can use /start in the server");
  } finally {
    pendingMembers.delete(key);
  }
}
