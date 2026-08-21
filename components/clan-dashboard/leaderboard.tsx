import { ChevronDown } from "lucide-react";
import { members } from "@/lib/clan-data";
import { Avatar, PanelHeading } from "./ui";

const columns = "grid-cols-[minmax(190px,1fr)_55px_70px] sm:grid-cols-[minmax(230px,1fr)_70px_95px_75px_45px]";

export function Leaderboard() {
  return (
    <section className="border border-line bg-surface" id="ranking">
      <PanelHeading
        eyebrow="CLAN LEADERBOARD"
        title="클랜 랭킹"
        action={<button className="flex items-center gap-3 border border-[#2b3438] bg-[#141a1d] px-3 py-2 text-[10px] text-[#b5bdc1]" type="button">평균 딜량 <ChevronDown size={15} /></button>}
      />
      <div className={`hidden h-[38px] items-center bg-[#0d1113] px-4 text-[8px] font-black tracking-wide text-[#5f696f] sm:grid ${columns}`}>
        <span>순위 / 플레이어</span><span>K/D</span><span>평균 딜량</span><span>승률</span><span>경기</span>
      </div>
      <div>
        {members.map((member) => (
          <div className={`grid min-h-[67px] items-center border-t border-[#1c2326] px-4 text-xs transition-colors first:border-t-0 hover:bg-[#141a1d] ${columns}`} key={member.name}>
            <div className="flex items-center gap-3">
              <b className={`w-[18px] text-[10px] ${member.rank < 4 ? "text-acid" : "text-[#657077]"}`}>{String(member.rank).padStart(2, "0")}</b>
              <Avatar label={member.name.split("_")[1][0]} accent={member.rank === 1} />
              <p><strong className="block text-[11px]">{member.name}</strong><small className="text-[7px] tracking-wider text-[#606a70]">{member.role}</small></p>
            </div>
            <strong>{member.kd}</strong>
            <span className="flex items-center gap-2"><strong>{member.adr}</strong><small className={`text-[8px] ${member.trend.startsWith("+") ? "text-acid" : "text-[#f16f5e]"}`}>{member.trend}</small></span>
            <strong className="hidden sm:block">{member.winRate}</strong>
            <span className="hidden text-[#7d888e] sm:block">{member.games}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
