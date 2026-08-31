"use client";

import { Crown, Radio, Shield, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ClanMasterSignalWing } from "@/components/clan-dashboard/clan-master-signal-wing";

/** 멤버 페이지 상단에 표시하는 클랜 마스터 프로필이다. */
export function ClanMasterCard({ nickname }: { nickname: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullyVisible, setIsFullyVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || isFullyVisible) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      const fallbackTimer = globalThis.setTimeout(
        () => setIsFullyVisible(true),
        0,
      );
      return () => globalThis.clearTimeout(fallbackTimer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // 서브픽셀 반올림 오차를 고려하여 99% 이상 노출되면 완전 노출로 처리한다.
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.99) {
          setIsFullyVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.99 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [isFullyVisible]);

  return (
    <div
      className="clan-master-showcase grid w-full items-center gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)_minmax(0,1fr)]"
      data-visible={isFullyVisible}
      ref={containerRef}
    >
      <ClanMasterSignalWing label="AUTH / 01" />

      <article className="clan-master-card relative isolate mx-auto w-full max-w-lg overflow-hidden rounded-sm border border-primary/50 bg-card/85 shadow-[0_24px_80px_-38px_color-mix(in_srgb,var(--primary)_70%,transparent)] backdrop-blur-sm">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/12 blur-3xl" />
        <div className="clan-master-scan pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/90 to-transparent" />

        <span className="absolute left-3 top-3 size-5 border-l border-t border-primary/70" />
        <span className="absolute right-3 top-3 size-5 border-r border-t border-primary/70" />
        <span className="absolute bottom-3 left-3 size-5 border-b border-l border-primary/70" />
        <span className="absolute bottom-3 right-3 size-5 border-b border-r border-primary/70" />

        <header className="relative flex items-center justify-between border-b border-border/60 px-6 py-4 sm:px-8">
          <div className="flex items-center gap-2 text-[9px] font-black tracking-[0.24em] text-primary">
            <Radio className="size-3.5" /> MASTER :: {nickname}
          </div>
          <div className="flex items-center gap-2 text-[8px] font-black tracking-[0.18em] text-success">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-success" />
            </span>
            ACTIVE
          </div>
        </header>

        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <div className="grid items-center gap-7 sm:grid-cols-[96px_minmax(0,1fr)]">
            <div className="clan-master-emblem relative mx-auto grid size-24 place-items-center rounded-full border border-primary/45 bg-primary/8 text-primary">
              <span className="absolute inset-2 rounded-full border border-dashed border-primary/30" />
              <Shield className="size-11 stroke-[1.4]" />
              <Crown className="absolute -top-3 size-7 fill-primary text-primary drop-shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_65%,transparent)]" />
              <Star className="absolute size-4 fill-primary text-primary" />
            </div>

            <div className="flex min-w-0 flex-col text-center sm:text-left">
              <div className="flex w-fit items-center gap-2 self-center whitespace-nowrap border border-primary/45 bg-primary/10 px-2.5 py-1.5 text-[9px] font-black tracking-[0.22em] text-primary shadow-[0_0_22px_-8px_var(--primary)] sm:self-start">
                <Crown className="size-3.5 fill-primary" /> CLAN MASTER
              </div>
              <h2
                className="military-glitch military-glitch-primary mt-3 max-w-full truncate text-2xl font-black tracking-[-0.04em] text-foreground sm:text-3xl"
                data-text={nickname}
              >
                {nickname}
              </h2>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-border/55 pt-5 font-mono text-[8px] font-bold tracking-[0.16em] text-muted-foreground">
            <span>BOBO-HQ / COMMAND-01</span>
            <span className="text-primary">LEAD FROM THE FRONT</span>
          </div>
        </div>
      </article>

      <ClanMasterSignalWing label="COMMAND / LIVE" reverse />
    </div>
  );
}
