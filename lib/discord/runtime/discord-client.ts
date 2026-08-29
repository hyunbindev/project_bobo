import "server-only";

import { Client, Events, GatewayIntentBits } from "discord.js";

import { handleDiscordInteraction } from "@/lib/discord/commands/command-registry";
import { logger } from "@/lib/logger";

type DiscordRuntimeState = {
  client?: Client;
  startPromise?: Promise<void>;
};

// Next.js 개발 모드의 모듈 재로딩에서도 Gateway 연결이 중복되지 않도록
// 런타임 상태를 globalThis에 보관한다.
const globalForDiscord = globalThis as typeof globalThis & {
  discordRuntime?: DiscordRuntimeState;
};

const runtime = (globalForDiscord.discordRuntime ??= {});

/**
 * Discord Gateway 연결을 시작한다.
 * 토큰이 없으면 웹 애플리케이션은 그대로 실행하고 봇만 비활성화한다.
 */
export async function startDiscordBot() {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();

  if (!token) {
    logger.warn(
      { event: "discord.bot_disabled" },
      "DISCORD_BOT_TOKEN is not configured; Discord bot is disabled",
    );
    return;
  }

  if (runtime.client?.isReady()) {
    return;
  }

  // 동시에 여러 곳에서 시작을 요청해도 같은 로그인 Promise를 공유한다.
  if (runtime.startPromise) {
    return runtime.startPromise;
  }

  const client = createDiscordClient();
  runtime.client = client;
  runtime.startPromise = client
    .login(token)
    .then(() => undefined)
    .catch((error: unknown) => {
      logger.error(
        { err: error, event: "discord.login_failed" },
        "Failed to connect Discord bot",
      );

      client.destroy();
      runtime.client = undefined;
      throw error;
    })
    .finally(() => {
      runtime.startPromise = undefined;
    });

  return runtime.startPromise;
}

function createDiscordClient() {
  // 현재 기본 명령은 슬래시 명령뿐이므로 privileged intent가 필요하지 않다.
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, (readyClient) => {
    logger.info(
      {
        event: "discord.ready",
        botUserId: readyClient.user.id,
        botUsername: readyClient.user.tag,
      },
      "Discord bot connected",
    );
  });

  client.on(Events.InteractionCreate, (interaction) => {
    void handleDiscordInteraction(interaction).catch((error: unknown) => {
      // handler 내부의 오류 응답마저 실패했을 때 발생하는 최종 안전망이다.
      logger.error(
        { err: error, event: "discord.interaction_failed" },
        "Discord interaction handling failed",
      );
    });
  });

  client.on(Events.Error, (error) => {
    logger.error(
      { err: error, event: "discord.client_error" },
      "Discord client error",
    );
  });

  // Docker가 컨테이너를 종료할 때 Gateway 세션도 정상적으로 닫는다.
  process.once("SIGTERM", () => stopDiscordBot("SIGTERM"));
  process.once("SIGINT", () => stopDiscordBot("SIGINT"));

  return client;
}

function stopDiscordBot(signal: string) {
  const client = runtime.client;

  if (!client) {
    return;
  }

  logger.info(
    { event: "discord.shutdown", signal },
    "Closing Discord bot connection",
  );
  client.destroy();
  runtime.client = undefined;
  runtime.startPromise = undefined;
}
