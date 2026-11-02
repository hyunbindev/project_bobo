"use client";

import { useState } from "react";

import type { DiscordRegistrationParams } from "@/lib/discord-accounts/types";
import { DiscordRegistrationComplete } from "./discord-registration-complete";
import {
  DiscordRegistrationForm,
  type DiscordRegistrationResult,
} from "./discord-registration-form";

export function DiscordRegistration({ currentYear, discordParams }: {
  currentYear: number;
  discordParams: DiscordRegistrationParams | null;
}) {
  const [result, setResult] = useState<DiscordRegistrationResult | null>(null);

  if (result) {
    return (
      <DiscordRegistrationComplete
        playerName={result.player.name}
        nicknameUpdate={result.nicknameUpdate}
      />
    );
  }

  return (
    <DiscordRegistrationForm
      currentYear={currentYear}
      discordParams={discordParams}
      onComplete={setResult}
    />
  );
}
