import { ArrowRight, CircleCheck } from "lucide-react";
import Link from "next/link";

import type { DiscordNicknameUpdate } from "@/lib/discord-accounts/types";

export function DiscordRegistrationComplete({ playerName, nicknameUpdate, discordGuildId }: {
  playerName: string;
  nicknameUpdate: DiscordNicknameUpdate | null;
  discordGuildId: string | null;
}) {
  return (
    <section
      aria-label="클랜원 등록 완료"
      className="rounded-sm border border-border border-t-2 border-t-primary bg-surface-elevated px-5 py-8 text-center shadow-[0_24px_80px_rgba(0,0,0,.35)] sm:px-7"
      role="status"
    >
      <CircleCheck aria-hidden="true" className="mx-auto size-10 text-primary" />
      <h2 className="mt-5 text-2xl font-black tracking-tight">BOBO 클랜에 오신 것을 환영합니다!</h2>
      <p className="mt-3 break-all text-lg font-black text-primary">{playerName}</p>
      {nicknameUpdate?.status === "updated" && (
        <p className="mt-4 break-all text-sm leading-6 text-muted-foreground">
          Discord 별명이 <strong className="text-primary">{nicknameUpdate.nickname}</strong>(으)로 변경되었어요.
        </p>
      )}
      {nicknameUpdate?.status === "failed" && (
        <p role="alert" className="mt-4 rounded-sm border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-left text-xs leading-6 text-destructive">
          별명 변경에 실패했습니다. 관리자에게 문의해 주세요.
        </p>
      )}
      <div className="mt-7 flex flex-col gap-3">
        {discordGuildId && (
          <a
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            href={`https://discord.com/channels/${discordGuildId}`}
          >
            Discord로 돌아가기 <ArrowRight aria-hidden="true" className="size-4" />
          </a>
        )}
        <Link
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm border border-border px-4 py-3 text-sm font-bold transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          href="/"
        >
          홈페이지 둘러보기 <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
