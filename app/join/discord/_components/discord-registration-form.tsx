"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, CalendarDays, Gamepad2, LoaderCircle } from "lucide-react";
import type { DiscordNicknameUpdate, DiscordRegistrationParams } from "@/lib/discord-accounts/types";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const inputClassName =
  "h-12 w-full min-w-0 rounded-sm border border-border bg-background px-4 text-base text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 sm:text-sm";

type RegisteredPlayer = { id: string; name: string };

export type DiscordRegistrationResult = {
  name: string;
  player: RegisteredPlayer;
  nicknameUpdate: DiscordNicknameUpdate | null;
};

type RegistrationResponse = {
  data?: { player?: RegisteredPlayer; discordNicknameUpdate?: DiscordNicknameUpdate };
  error?: { code?: string; message?: string };
};

const registrationErrorMessages: Record<string, string> = {
  INVALID_PUBG_NICKNAME: "올바른 PUBG 닉네임을 하나만 입력해 주세요. 빈 값이나 쉼표는 사용할 수 없습니다.",
  PUBG_PLAYER_NOT_FOUND: "카카오 서버에서 해당 PUBG 계정을 찾을 수 없습니다. 닉네임의 철자와 대소문자를 확인해 주세요.",
  PUBG_RATE_LIMITED: "계정 조회 요청이 많습니다. 잠시 후 다시 시도해 주세요.",
  PUBG_API_ERROR: "PUBG 서버에서 계정을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  DISCORD_LINK_REQUIRED: "Discord에서 등록 링크를 다시 받아 접속해 주세요.",
  BAD_REQUEST: "입력한 닉네임, 이름과 출생연도를 확인해 주세요.",
};

export function DiscordRegistrationForm({ currentYear, discordParams = null, onComplete }: {
  currentYear: number;
  onComplete: (result: DiscordRegistrationResult) => void;
  discordParams?: DiscordRegistrationParams | null;
}) {
  const [birthYear, setBirthYear] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submissionInFlight = useRef(false);
  const birthYears = Array.from({ length: currentYear - 1900 + 1 }, (_, index) => {
    const year = currentYear - index;
    return { value: String(year), label: `${year}` };
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInFlight.current) return;

    setSubmitError(null);

    if (!discordParams) {
      setSubmitError("Discord에서 받은 등록 링크를 통해 접속해 주세요.");
      return;
    }

    if (!birthYear) {
      setSubmitError("출생연도를 선택해 주세요.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const input = {
      nickname: String(formData.get("nickname") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      birthYear: Number(birthYear),
      platform: "kakao",
      ...discordParams,
    };

    if (!input.nickname || !input.name) {
      setSubmitError("배틀그라운드 닉네임과 이름을 입력해 주세요.");
      return;
    }

    submissionInFlight.current = true;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/clan-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = (await response.json()) as RegistrationResponse;

      if (!response.ok) {
        const errorMessage = result.error?.code
          ? registrationErrorMessages[result.error.code]
          : undefined;
        if (errorMessage) {
          setSubmitError(errorMessage);
        } else if (response.status === 429) {
          setSubmitError("계정 조회 요청이 많습니다. 잠시 후 다시 시도해 주세요.");
        } else if (response.status >= 500) {
          setSubmitError("등록 요청을 처리하지 못했습니다. 관리자에게 문의주세요.");
        } else {
          setSubmitError(result.error?.message ?? "입력한 정보를 확인하고 다시 시도해 주세요.");
        }
        return;
      }

      const player = result.data?.player;
      if (!player?.id || !player.name) {
        setSubmitError("등록 결과를 확인하지 못했습니다. 관리자에게 문의주세요.");
        return;
      }

      onComplete({ name: input.name, player, nicknameUpdate: result.data?.discordNicknameUpdate ?? null });
    } catch {
      setSubmitError("등록 결과를 확인하지 못했습니다. 관리자에게 문의주세요.");
    } finally {
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <section
      aria-label="Discord 계정 및 PUBG 등록 정보"
      className="overflow-hidden rounded-sm border border-border border-t-2 border-t-primary bg-surface-elevated shadow-[0_24px_80px_rgba(0,0,0,.35)]"
    >

      <form
        aria-busy={isSubmitting}
        className="px-5 py-6 sm:px-7 sm:py-7"
        onSubmit={handleSubmit}
      >
        <div className="mb-7">
          <h2 className="text-xl font-black tracking-tight">
            BOBO에 오신 걸 환영해요 👋
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            함께 게임할 때 서로 알아볼 수 있도록
            <br />
            배그 닉네임과 이름을 알려주세요.
          </p>
        </div>

        <fieldset className="min-w-0 space-y-5" disabled={isSubmitting}>
          <legend className="sr-only">클랜원 등록 정보</legend>

          <div className="space-y-2.5">
            <label
              className="block text-xs font-bold tracking-wide"
              htmlFor="registration-pubg-nickname"
            >
              배틀그라운드 닉네임 <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <Gamepad2
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-primary"
              />
              <input
                aria-describedby="registration-pubg-hint"
                autoCapitalize="none"
                autoComplete="off"
                className={`${inputClassName} pl-11`}
                id="registration-pubg-nickname"
                maxLength={64}
                name="nickname"
                placeholder="배틀그라운드 닉네임을 입력해 주세요"
                required
                spellCheck={false}
                type="text"
              />
            </div>
            <p
              className="text-[11px] leading-5 text-muted-foreground"
              id="registration-pubg-hint"
            >
              배틀그라운드 닉네임을 입력해 주세요.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_140px]">
            <div className="min-w-0 space-y-2.5">
              <label
                className="block text-xs font-bold tracking-wide"
                htmlFor="registration-name"
              >
                이름 <span className="text-primary">*</span>
              </label>
              <input
                autoComplete="off"
                className={inputClassName}
                id="registration-name"
                maxLength={30}
                name="name"
                placeholder="이름을 입력해주세요"
                required
                type="text"
              />
            </div>
            <div className="min-w-0 space-y-2.5">
              <label
                className="block text-xs font-bold tracking-wide"
                htmlFor="registration-birth-year"
              >
                출생연도 <span className="text-primary">*</span>
              </label>
              <Select
                disabled={isSubmitting}
                items={birthYears}
                name="birthYear"
                onValueChange={setBirthYear}
                required
                value={birthYear}
              >
                <SelectTrigger
                  className="w-full gap-2 rounded-sm bg-background px-3 text-sm shadow-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 data-[size=default]:h-12 data-placeholder:text-muted-foreground/60 dark:bg-background dark:hover:bg-surface"
                  id="registration-birth-year"
                >
                  <CalendarDays aria-hidden="true" className="size-4 text-primary" />
                  <SelectValue placeholder="연도 선택" />
                </SelectTrigger>
                <SelectContent
                  align="start"
                  alignItemWithTrigger={false}
                  className="max-h-[min(16rem,var(--available-height))] rounded-sm border border-border bg-surface-elevated p-1 shadow-xl ring-0"
                >
                  {birthYears.map(({ value, label }) => (
                    <SelectItem
                      className="min-h-9 rounded-sm pl-3 tabular-nums data-highlighted:bg-primary/10 data-highlighted:text-primary data-selected:font-bold"
                      key={value}
                      value={value}
                    >
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </fieldset>

        <p className="mt-5 text-xs leading-6 text-muted-foreground">
          입력한 이름·출생연도 및 계정 연동 정보는 해당 Discord 서버 탈퇴 시 삭제됩니다.
        </p>

        {submitError && (
          <p
            className="mt-5 rounded-sm border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs leading-6 text-destructive"
            id="registration-error"
            role="alert"
          >
            {submitError}
          </p>
        )}

        <button
          aria-describedby={submitError ? "registration-error" : undefined}
          className="mt-6 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-sm bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <ArrowRight aria-hidden="true" className="size-4" />
          )}
          <span aria-live="polite">
            {isSubmitting ? "계정 확인 및 등록 중…" : "내 닉네임 등록하기"}
          </span>
        </button>
      </form>
    </section>
  );
}
