import { Crosshair, Radio } from "lucide-react";

import { MetaItem } from "./meta-item";

type TeamSplitMetaBarProps = {
  requestedBy: string;
  voiceChannel: string;
};

export function TeamSplitMetaBar({
  requestedBy,
  voiceChannel,
}: TeamSplitMetaBarProps) {
  return (
    <section className="border-b border-border/50 bg-surface">
      <div className="mx-auto flex max-w-360 flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4 text-[9px] font-bold tracking-[0.16em] text-muted-foreground sm:px-8 lg:px-12">
        <MetaItem icon={Radio} label="VOICE" value={voiceChannel} />
        <MetaItem icon={Crosshair} label="REQUESTED BY" value={requestedBy} />
        <span className="ml-auto hidden items-center gap-2 text-success sm:flex">
          <span className="size-1.5 rounded-full bg-success shadow-[0_0_10px_var(--success)]" />
          DRAW VERIFIED
        </span>
      </div>
    </section>
  );
}

