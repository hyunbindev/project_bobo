import type { LucideIcon } from "lucide-react";

type MetaItemProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

export function MetaItem({ icon: Icon, label, value }: MetaItemProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="size-3.5 text-primary" />
      {label} <strong className="text-foreground">{value}</strong>
    </span>
  );
}

