import { activities } from "@/lib/clan-data";
import { Avatar, PanelHeading } from "./ui";

export function ActivityPanel() {
  const liveBadge = (
    <span className="text-[8px] font-black tracking-widest text-acid">
      <span className="mr-2 inline-block size-1.5 rounded-full bg-acid shadow-[0_0_10px_#c8f43d]" />LIVE
    </span>
  );

  return (
    <aside className="border border-line bg-surface">
      <PanelHeading eyebrow="RECENT ACTIVITY" title="최근 활동" action={liveBadge} />
      <div>
        {activities.map((activity, index) => (
          <div className="grid min-h-[76px] grid-cols-[32px_1fr_auto] items-center gap-3 border-b border-[#1d2427] px-4 py-3.5 last:border-0" key={activity.name}>
            <Avatar label={activity.initial} accent={index === 0} />
            <div>
              <strong className="text-[11px]">{activity.name}</strong>
              <p className="mt-1 text-[9px] text-[#6f7a80]"><b className="mr-1 text-acid">{activity.place}</b>{activity.map} · {activity.kills}킬 · {activity.damage} 딜량</p>
            </div>
            <time className="self-start pt-1 text-[8px] text-[#5e696f]">{activity.time}</time>
          </div>
        ))}
      </div>
    </aside>
  );
}
