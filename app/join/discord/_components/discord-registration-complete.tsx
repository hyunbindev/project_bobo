import { ArrowRight, CircleCheck, LoaderCircle, RotateCw } from "lucide-react";
import Link from "next/link";

import type { DiscordNicknameUpdate } from "@/lib/discord-accounts/types";

export function DiscordRegistrationComplete({ name, nicknameUpdate, isRetrying, retryError, onRetryNickname }: {
  name: string;
  nicknameUpdate: DiscordNicknameUpdate | null;
  isRetrying: boolean;
  retryError: string | null;
  onRetryNickname: () => void;
}) {
  return (
    <section
      aria-label="클랜원 등록 완료"
      className="animate-in fade-in zoom-in-95 rounded-sm border border-border border-t-2 border-t-primary bg-surface-elevated px-5 py-8 text-center duration-500 motion-reduce:animate-none sm:px-7"
      role="status"
    >
      <CircleCheck aria-hidden="true" className="mx-auto size-10 text-primary" />
      <h2 className="mt-5 break-words text-2xl font-black tracking-tight">
        <span className="text-primary">{name}</span>님, 환영합니다!
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">등록이 완료되었습니다.</p>
      {nicknameUpdate?.status === "failed" && (
        <div className="mt-4 rounded-sm border border-destructive/25 bg-destructive/5 px-3 py-3 text-left">
          <p role="alert" className="text-xs leading-6 text-destructive">
            별명 변경에 실패했습니다. 관리자에게 문의해 주세요.
          </p>
          <button
            type="button"
            onClick={onRetryNickname}
            disabled={isRetrying}
            className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-sm border border-border bg-background px-3 py-2 text-sm font-bold transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRetrying ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <RotateCw aria-hidden="true" className="size-4" />}
            <span aria-live="polite">{isRetrying ? "별명 적용 중…" : "별명 변경 다시 시도"}</span>
          </button>
        </div>
      )}
      {nicknameUpdate?.status === "updated" && (
        <p role="status" className="mt-4 break-words text-sm leading-6 text-primary">Discord 별명이 적용되었습니다.</p>
      )}
      {retryError && <p role="alert" className="mt-3 text-xs leading-6 text-destructive">{retryError}</p>}
      <Link
        className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        href="/"
      >
        확인 <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </section>
  );
}
