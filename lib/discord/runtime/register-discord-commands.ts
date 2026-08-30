import "server-only";

import { REST, Routes } from "discord.js";

import { discordCommands } from "@/lib/discord/discord-commands";
import { discordLogger } from "@/lib/logger";

type DiscordCommandRegistrationState = {
  completed?: boolean;
  promise?: Promise<void>;
};


const globalForRegistration = globalThis as typeof globalThis & {
  discordCommandRegistration?: DiscordCommandRegistrationState;
};

const registrationState = (globalForRegistration.discordCommandRegistration ??= {});

export function registerDiscordCommands() {
  if (registrationState.completed) {
    return Promise.resolve();
  }

  if (registrationState.promise) {
    return registrationState.promise;
  }

  registrationState.promise = performRegistration().finally(() => {
    registrationState.promise = undefined;
  });

  return registrationState.promise;
}

async function performRegistration() {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const applicationId = process.env.DISCORD_APPLICATION_ID?.trim();

  if (!token || !applicationId) {
    discordLogger.warn(
      { event: "discord.commands_registration_skipped" },
      "Discord command registration credentials are not configured",
    );
    registrationState.completed = true;
    return;
  }

  const rest = new REST({ version: "10" }).setToken(token);


  const definitions = discordCommands.map((command) =>
    command.definition.toJSON(),
  );

  try {
    await rest.put(Routes.applicationCommands(applicationId), {
      body: definitions,
    });

    registrationState.completed = true;

    discordLogger.info(
      {
        event: "discord.commands_registered",
        commandCount: definitions.length,
      },
      "Discord global commands registered",
    );
  } catch (error) {
    discordLogger.error(
      { err: error, event: "discord.commands_registration_failed" },
      "Failed to register Discord global commands",
    );
  }
}
