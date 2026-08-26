"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const navigation = [
  { href: "/#top", label: "홈" },
  { href: "/members", label: "클랜원" },
  { href: "/matches", label: "클랜 전적" },
  { href: "/ranking", label: "랭킹" },
];

export function HomeHeader({
  clanMark,
  clanName,
}: {
  clanMark: string;
  clanName: string;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-360 items-center justify-between gap-3 px-5 sm:px-8 lg:px-12">
        <Link
          aria-label={`${clanName} 클랜 홈`}
          className="group flex min-w-0 items-center gap-3"
          href="/#top"
          onClick={closeMenu}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-primary text-xs font-black tracking-[-0.08em] text-primary-foreground transition-transform group-hover:-rotate-3">
            {clanMark}
          </span>
          <span className="min-w-0">
            <span className="block max-w-36 truncate text-sm font-black tracking-[0.2em] sm:max-w-56">
              {clanName}
            </span>
            <span className="block text-[8px] font-semibold tracking-[0.22em] text-muted-foreground sm:text-[9px] sm:tracking-[0.28em]">
              BATTLEGROUNDS
            </span>
          </span>
        </Link>

        <nav
          aria-label="주요 메뉴"
          className="hidden items-center gap-8 text-sm font-semibold text-muted-foreground md:flex"
        >
          {navigation.map((item, index) => (
            <Link
              className={`transition-colors hover:text-primary ${index === 0 ? "text-foreground" : ""}`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          className="hidden h-9 items-center gap-2 rounded-sm border border-primary/50 px-4 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground md:inline-flex"
          href="/#notice"
        >
          클랜 안내 <ArrowUpRight className="size-3.5" />
        </Link>

        <button
          aria-controls="mobile-navigation"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          className="grid size-10 shrink-0 place-items-center rounded-sm border border-border/70 bg-card text-foreground transition-colors hover:border-primary/50 hover:text-primary md:hidden"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          type="button"
        >
          {isMenuOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
        </button>
      </div>

      {isMenuOpen && (
        <nav
          aria-label="모바일 주요 메뉴"
          className="border-t border-border/50 bg-background/95 px-5 py-4 shadow-2xl backdrop-blur-xl md:hidden"
          id="mobile-navigation"
        >
          <div className="mx-auto grid max-w-360 gap-1">
            {navigation.map((item) => (
              <Link
                className="flex min-h-11 items-center justify-between rounded-sm px-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                href={item.href}
                key={item.href}
                onClick={closeMenu}
              >
                {item.label}
                <ArrowUpRight className="size-3.5 opacity-45" />
              </Link>
            ))}
            <Link
              className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-primary px-4 text-xs font-black text-primary-foreground"
              href="/#notice"
              onClick={closeMenu}
            >
              클랜 안내 <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
