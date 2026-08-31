import { Clock3, RotateCcw } from "lucide-react";

export function TeamSplitUnavailable() {
  return (
    <section className="relative grid min-h-[calc(100vh-4.5rem)] place-items-center overflow-hidden px-5 py-20">
      <div className="hero-grid absolute inset-0 opacity-30" aria-hidden="true" />
      <div
        className="hero-glow absolute left-1/2 top-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full"
        aria-hidden="true"
      />
      <div className="relative max-w-xl border border-border/60 bg-card/85 p-8 text-center backdrop-blur-sm sm:p-12">
        <span className="mx-auto grid size-14 place-items-center border border-primary/40 bg-primary/8 text-primary">
          <Clock3 className="size-6" />
        </span>
        <p className="mt-7 text-[9px] font-black tracking-[0.24em] text-primary">
          TEAM DRAW EXPIRED
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
          조회 시간이 만료되었습니다
        </h1>
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          팀 배분 결과는 생성 후 15분 동안만 확인할 수 있습니다.
          <br />
          Discord에서 팀 배분 명령을 다시 실행해 주세요.
        </p>
        <div className="mt-8 inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-muted-foreground">
          <RotateCcw className="size-3.5 text-primary" /> /팀분배
        </div>
      </div>
    </section>
  );
}

