import { Gamepad2 } from "lucide-react";
import { matches } from "@/lib/clan-data";
import { Avatar, PanelHeading } from "./ui";

export function MatchesPanel() {
  return (
    <section className="my-6 mb-14 border border-line bg-surface" id="matches">
      <PanelHeading
        eyebrow="PLAYED TOGETHER"
        title="클랜원끼리 함께한 경기"
        action={<button className="text-[10px] font-extrabold text-acid" type="button">전체 보기 →</button>}
      />
      <div>
        {matches.map((match, index) => (
          <div className="grid min-h-[76px] grid-cols-[48px_1fr_auto] items-center border-t border-[#1c2326] px-3 py-3 first:border-t-0 sm:grid-cols-[70px_1.5fr_1fr_110px_130px] sm:px-6" key={`${match.map}-${index}`}>
            <strong className={`text-[17px] ${match.place === "#1" ? "text-acid" : "text-[#9ba4a8]"}`}>{match.place}</strong>
            <div className="flex items-center gap-3 text-[#68737a]">
              <Gamepad2 className="hidden sm:block" size={18} />
              <p><strong className="block text-[11px] text-[#f4f6f7]">{match.map}</strong><small className="mt-1 block text-[9px] font-extrabold tracking-wide text-[#6e7a80]">{match.mode} · {match.time}</small></p>
            </div>
            <div className="hidden sm:flex">
              {match.members.map((member, memberIndex) => <span className={memberIndex ? "-ml-1.5" : ""} key={member}><Avatar label={member} /></span>)}
            </div>
            <div className="hidden sm:block"><small className="mb-1 block text-[9px] font-extrabold tracking-wide text-[#6e7a80]">TEAM KILLS</small><strong className="text-[13px]">{match.kills}</strong></div>
            <div className="text-right sm:text-left"><small className="mb-1 block text-[9px] font-extrabold tracking-wide text-[#6e7a80]">TEAM DAMAGE</small><strong className="text-[13px]">{match.damage}</strong></div>
          </div>
        ))}
      </div>
    </section>
  );
}
