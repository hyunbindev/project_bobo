import { Crosshair } from "lucide-react";

export function ClanHeader() {
  return (
    <header className="flex h-[68px] items-center gap-0 border-b border-line sm:h-[82px] sm:gap-16">
      <a className="flex items-center gap-3 text-[19px] font-black tracking-tight" href="#" aria-label="BOBO Stats 홈">
        <span className="grid size-9 place-items-center bg-acid text-[#090c0d] [clip-path:polygon(10%_0,100%_0,100%_80%,80%_100%,0_100%,0_10%)]">
          <Crosshair size={20} />
        </span>
        <span>BOBO<span className="text-acid">.</span>STATS</span>
      </a>

      <nav className="hidden h-full items-center gap-8 sm:flex" aria-label="메인 메뉴">
        <a className="relative text-[13px] font-bold after:absolute after:-bottom-[33px] after:left-0 after:right-0 after:h-0.5 after:bg-acid" href="#overview">대시보드</a>
        <a className="text-[13px] font-bold text-[#849096] transition-colors hover:text-white" href="#ranking">클랜 랭킹</a>
        <a className="text-[13px] font-bold text-[#849096] transition-colors hover:text-white" href="#matches">함께한 경기</a>
      </nav>

      <div className="ml-auto rounded-sm border border-line bg-[#0d1113] px-2 py-2 text-[8px] font-extrabold tracking-wide text-[#aeb7bb] sm:px-3.5 sm:text-[11px]">
        <span className="mr-2 inline-block size-1.5 rounded-full bg-acid shadow-[0_0_10px_#c8f43d]" />
        시즌 42 · LIVE
      </div>
    </header>
  );
}
