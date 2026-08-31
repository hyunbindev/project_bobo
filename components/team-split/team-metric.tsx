type TeamMetricProps = {
  label: string;
  value: string;
};

export function TeamMetric({ label, value }: TeamMetricProps) {
  return (
    <div className="flex flex-col justify-center items-center py-4">
      <p className="text-[8px] font-black tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 font-mono text-lg font-black tracking-[-0.04em]">
        {value}
      </p>
    </div>
  );
}

