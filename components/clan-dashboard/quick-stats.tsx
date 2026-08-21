import { Activity, Swords, Trophy, Users } from "lucide-react";

const stats = [
  { label: "활동 클랜원", value: "24", detail: "전체 28명", icon: Users },
  { label: "이번 주 경기", value: "186", detail: "지난주 대비 +14%", icon: Activity, positive: true },
  { label: "치킨 횟수", value: "31", detail: "승률 16.7%", icon: Trophy },
  { label: "함께한 경기", value: "94", detail: "클랜 스쿼드", icon: Swords },
];

export function QuickStats() {
  return (
    <section className="mb-6 grid grid-cols-2 border border-line bg-[#0e1214] lg:grid-cols-4" aria-label="클랜 요약">
      {stats.map(({ label, value, detail, icon: Icon, positive }, index) => (
        <div className={`grid min-h-24 grid-cols-[38px_1fr] items-center gap-x-3 border-line px-3 py-4 sm:px-5 ${
          index % 2 === 0 ? "border-r" : ""
        } ${index < 2 ? "border-b lg:border-b-0" : ""} ${index < 3 ? "lg:border-r" : ""}`} key={label}>
          <span className="row-span-2 grid size-[38px] place-items-center rounded-sm bg-acid/10 text-acid"><Icon size={19} /></span>
          <p className="text-[10px] text-[#849096]">{label}<strong className="mt-1 block text-[23px] text-[#f4f6f7]">{value}</strong></p>
          <small className={`text-[9px] ${positive ? "text-acid" : "text-[#697278]"}`}>{detail}</small>
        </div>
      ))}
    </section>
  );
}
