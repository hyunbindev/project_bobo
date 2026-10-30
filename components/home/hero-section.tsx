import { Crown, Search, Shield } from "lucide-react";

const mvpStats = [
  { label: "K/D", value: "4.82", change: "+12%" },
  { label: "평균 딜량", value: "512", change: "+48" },
  { label: "승률", value: "18.4%", change: "+3.2%" },
];

export function HeroSection() {
  return (
    <section className="grid min-h-[430px] items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-[70px]" id="overview">
      <div>
        <p className="mb-3.5 flex items-center gap-2 text-[11px] font-black tracking-[.16em] text-acid">
          <Shield size={15} /> BOBO CLAN · KAKAO
        </p>
        <h1 className="text-[42px] leading-[.99] font-black tracking-[-.06em] sm:text-[56px] lg:text-[70px]">
          우리의 모든 전투를<br /><em className="not-italic text-acid">하나의 기록으로.</em>
        </h1>
        <p className="my-6 text-sm leading-7 text-[#849096]">
          클랜원의 성장과 팀플레이를 한눈에 확인하세요.<br />전적은 마지막 경기 기준으로 자동 갱신됩니다.
        </p>
        <div className="flex h-[54px] max-w-[520px] items-center gap-3 border border-[#293136] bg-[#111619] py-1.5 pr-1.5 pl-4 focus-within:border-acid">
          <Search className="shrink-0 text-[#687279]" size={20} />
          <input className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-[#626c72]" aria-label="클랜원 닉네임" placeholder="클랜원 닉네임 검색" />
          <button className="h-10 bg-acid px-5 text-xs font-black text-[#090c0d] sm:px-6" type="button">검색</button>
        </div>
      </div>

      <div className="relative z-10 overflow-hidden border border-[#30393e] bg-[linear-gradient(135deg,#181f22,#0f1416_70%)] shadow-[0_25px_80px_rgba(0,0,0,.35)] [clip-path:polygon(0_0,94%_0,100%_12%,100%_100%,0_100%)]">
        <div className="flex justify-between border-b border-line px-5 py-4 text-[9px] font-black tracking-[.15em] text-acid">
          <span>WEEKLY MVP</span><span className="text-[#687278]">08.12 — 08.18</span>
        </div>
        <div className="flex items-center gap-5 px-5 py-7 sm:px-7">
          <div className="relative grid size-[66px] shrink-0 rotate-45 place-items-center border border-acid/25 bg-acid/10 text-acid sm:size-[86px]">
            <Crown className="absolute top-2 -rotate-45" size={28} />
            <span className="-rotate-45 text-3xl font-black">D</span>
          </div>
          <div>
            <p className="mb-1 text-[11px] text-[#849096]">이번 주 최고의 플레이어</p>
            <h2 className="mb-1.5 text-[22px] font-black tracking-tight sm:text-[27px]">BOBO_Doha</h2>
            <p className="text-[9px] tracking-wider text-[#657076]">68 MATCHES · SQUAD FPP</p>
          </div>
        </div>
        <div className="grid grid-cols-3 border-t border-line">
          {mvpStats.map((stat) => (
            <div className="relative border-r border-line px-3 py-3.5 last:border-0 sm:px-5 sm:py-4" key={stat.label}>
              <span className="mb-1 block text-[9px] font-extrabold tracking-wide text-[#6e7a80]">{stat.label}</span>
              <strong className="text-[17px] sm:text-[22px]">{stat.value}</strong>
              <small className="absolute right-4 bottom-5 hidden text-[9px] text-acid sm:block">{stat.change}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
