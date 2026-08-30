import type { LucideIcon } from "lucide-react";

type TournamentStatProps = {
  icon: LucideIcon;
  label: string;
  value: number | string;
  wide?: boolean;
};

export function TournamentStat({
  icon: Icon,
  label,
  value,
  wide = false,
}: TournamentStatProps) {
  return (
    <div
      className={`border-border/50 p-5 ${wide ? "col-span-2 border-t" : "border-r last:border-r-0"}`}
    >
      <div className="flex items-center gap-2 text-primary">
        <Icon className="size-3.5" />
        <p className="text-[8px] font-black tracking-[0.2em]">{label}</p>
      </div>
      <p className="mt-3 font-mono text-xl font-black tracking-[-0.04em]">
        {value}
      </p>
    </div>
  );
}

