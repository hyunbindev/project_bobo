"use client";

import { useRef, useState } from "react";

import type { DiscordNicknameUpdate, DiscordRegistrationParams } from "@/lib/discord-accounts/types";
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
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const retryInFlight = useRef(false);

  async function handleRetryNickname() {
    if (!discordParams || !result || retryInFlight.current) return;
    retryInFlight.current = true;
    setIsRetrying(true);
    setRetryError(null);
    try {
      const response = await fetch("/api/discord-accounts/nickname/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordParams),
      });
      const body = await response.json() as {
        data?: { discordNicknameUpdate?: DiscordNicknameUpdate };
        error?: { message?: string };
      };
      if (!response.ok) {
        setRetryError(response.status >= 500
          ? "재시도 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."
          : body.error?.message ?? "별명 변경을 다시 시도하지 못했습니다.");
        return;
      }
      const nicknameUpdate = body.data?.discordNicknameUpdate;
      if (!nicknameUpdate || (nicknameUpdate.status !== "updated" && nicknameUpdate.status !== "failed")) {
        setRetryError("별명 변경 결과를 확인하지 못했습니다. 다시 시도해 주세요.");
        return;
      }
      setResult((current) => current ? { ...current, nicknameUpdate } : current);
    } catch {
      setRetryError("연결 상태를 확인한 후 다시 시도해 주세요.");
    } finally {
      retryInFlight.current = false;
      setIsRetrying(false);
    }
  }

  if (result) {
    return (
      <DiscordRegistrationComplete
        name={result.name}
        nicknameUpdate={result.nicknameUpdate}
        isRetrying={isRetrying}
        retryError={retryError}
        onRetryNickname={handleRetryNickname}
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
