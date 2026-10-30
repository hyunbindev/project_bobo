import { Crosshair } from "lucide-react";

type ClanMasterSignalWingProps = {
  label: string;
  reverse?: boolean;
};

/** 클랜 마스터 카드 좌우에 표시하는 장식용 전술 신호선이다. */
export function ClanMasterSignalWing({
  label,
  reverse = false,
}: ClanMasterSignalWingProps) {
  return (
    <div
      aria-hidden="true"
      className={`clan-master-wing hidden items-center gap-3 lg:flex ${reverse ? "flex-row-reverse" : ""}`}
      data-reverse={reverse}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full border border-primary/25 text-primary/55">
        <Crosshair className="size-4" />
      </span>
      <div className="relative h-px flex-1 bg-linear-to-r from-primary/10 via-primary/55 to-primary/10">
        <span className="clan-master-packet absolute -top-0.75 size-1.5 rotate-45 bg-primary shadow-[0_0_10px_var(--primary)]" />
        <span className="absolute left-1/4 top-1/2 size-1.5 -translate-y-1/2 rounded-full border border-primary/50 bg-background" />
        <span className="absolute right-1/4 top-1/2 size-1.5 -translate-y-1/2 rounded-full border border-primary/50 bg-background" />
      </div>
      <span className="shrink-0 font-mono text-[7px] font-bold tracking-[0.18em] text-primary/60 [writing-mode:vertical-rl]">
        {label}
      </span>
    </div>
  );
}
