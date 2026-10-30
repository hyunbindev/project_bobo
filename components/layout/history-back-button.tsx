"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

export function HistoryBackButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-sm border border-primary/50 px-5 text-xs font-black text-primary transition-colors hover:bg-primary hover:text-primary-foreground",
        className,
      )}
      onClick={() => router.back()}
      type="button"
    >
      <ArrowLeft className="size-4" /> 이전 페이지로
    </button>
  );
}
