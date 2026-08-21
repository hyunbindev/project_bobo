import type { ReactNode } from "react";

export function Avatar({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <span className={`grid size-8 shrink-0 place-items-center rounded-sm border text-[11px] font-black ${
      accent ? "border-acid bg-acid text-[#0b0e0f]" : "border-[#313a3e] bg-[#20272b] text-[#c4c9cc]"
    }`}>
      {label}
    </span>
  );
}

export function PanelHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex h-20 items-center justify-between border-b border-line px-4 sm:px-5">
      <div>
        <p className="mb-1 text-[8px] font-black tracking-[.2em] text-acid">{eyebrow}</p>
        <h2 className="text-base font-bold sm:text-[17px]">{title}</h2>
      </div>
      {action}
    </div>
  );
}
