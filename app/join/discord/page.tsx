import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { DiscordRegistration } from "./_components/discord-registration";
import { getDiscordRegistrationParams } from "@/lib/discord-accounts/registration-params";

export const metadata: Metadata = {
  title: "아이디 등록 | BOBO CLAN",
  description: "PUBG 계정을 확인하고 BOBO 클랜원 정보를 등록하세요.",
  robots: { index: false, follow: false },
};

export default async function DiscordRegistrationPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const discordParams = getDiscordRegistrationParams(await searchParams);
  return (
    <main className="relative isolate flex min-h-svh flex-col overflow-x-clip bg-background text-foreground">
      <div
        aria-hidden="true"
        className="hero-grid pointer-events-none absolute inset-0 -z-10 opacity-40"
      />
      <div
        aria-hidden="true"
        className="hero-glow pointer-events-none absolute -top-24 left-1/2 -z-10 size-96 -translate-x-1/2 rounded-full"
      />

      <header className="border-b border-border/50">
        <div className="mx-auto flex h-18 max-w-360 items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <Link
            aria-label="BOBO 클랜 홈"
            className="group flex min-w-0 items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            href="/"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-primary text-xs font-black tracking-[-0.08em] text-primary-foreground transition-transform group-hover:-rotate-3">
              BO
            </span>
            <span>
              <span className="block text-sm font-black tracking-[0.2em]">
                BOBO CLAN
              </span>
              <span className="block text-[8px] font-semibold tracking-[0.22em] text-muted-foreground">
                BATTLEGROUNDS
              </span>
            </span>
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center px-5 py-10 sm:py-14">
        <div className="mb-7 text-center sm:mb-8">
          <p className="mb-3 inline-flex items-center gap-2 text-[10px] font-black tracking-[0.24em] text-primary">
            <ShieldCheck aria-hidden="true" className="size-3.5" />
            BOBO CLAN REGISTRATION
          </p>
          <h1 className="text-4xl font-black tracking-[-0.055em] sm:text-5xl">
            BOBO 클랜원 등록
          </h1>
        </div>

        <DiscordRegistration
          currentYear={new Date().getFullYear()}
          discordParams={discordParams}
        />

        <Link
          className="mx-auto mt-7 inline-flex min-h-11 items-center gap-2 rounded-sm px-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          href="/"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          클랜 홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
