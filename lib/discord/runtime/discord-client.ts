import "server-only";

import { Client, Events, GatewayIntentBits } from "discord.js";

import { handleDiscordInteraction } from "@/lib/discord/commands/command-registry";
import { discordLogger } from "@/lib/logger";

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
    discordLogger.warn(
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
  runtime.startPromise = loginAndWaitUntilReady(client, token)
    .catch((error: unknown) => {
      discordLogger.error(
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

/** login 호출 완료가 아니라 ClientReady 이벤트까지 기다린다. */
async function loginAndWaitUntilReady(client: Client, token: string) {
  // login보다 먼저 listener를 등록하여 매우 빠른 Ready 이벤트도 놓치지 않는다.
  const readyPromise = new Promise<void>((resolve) => {
    client.once(Events.ClientReady, () => resolve());
  });

  await client.login(token);
  await readyPromise;
}

/** 메시지 발송처럼 Gateway 클라이언트가 필요한 작업에 준비된 클라이언트를 제공한다. */
export async function getReadyDiscordClient() {
  await startDiscordBot();

  if (!runtime.client?.isReady()) {
    throw new Error("Discord bot is not ready.");
  }

  return runtime.client;
}

function createDiscordClient() {
  // 음성 채널 접속자 상태를 수신한다. GuildVoiceStates는 privileged intent가 아니다.
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
    ],
  });

  client.once(Events.ClientReady, (readyClient) => {
    discordLogger.info(
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
      discordLogger.error(
        { err: error, event: "discord.interaction_failed" },
        "Discord interaction handling failed",
      );
    });
  });

  client.on(Events.Error, (error) => {
    discordLogger.error(
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

  discordLogger.info(
    { event: "discord.shutdown", signal },
    "Closing Discord bot connection",
  );
  client.destroy();
  runtime.client = undefined;
  runtime.startPromise = undefined;
}
