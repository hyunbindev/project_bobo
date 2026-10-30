import type { LucideIcon } from "lucide-react";

export type PlayerRecord = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

export function PlayerRecords({ records }: { records: PlayerRecord[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {records.map(({ detail, icon: Icon, label, value }) => (
        <article
          className="group rounded-sm border border-border/60 bg-card p-5 transition-colors hover:border-primary/40"
          key={label}
        >
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black tracking-[0.17em] text-muted-foreground">
              {label}
            </p>
            <Icon className="size-4 text-primary" />
          </div>
          <p className="mt-5 text-3xl font-black tracking-[-0.05em]">{value}</p>
          <p className="mt-2 text-[10px] font-semibold text-muted-foreground">
            {detail}
          </p>
        </article>
      ))}
    </div>
  );
}
