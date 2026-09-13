import { Check, Flag, LockKeyhole, UserRound, UsersRound } from "lucide-react";
import type { Quest } from "@/types";
import type { QuestState } from "@/lib/questEngine";

const trackMeta = {
  individual: { label: "Your quest", Icon: UserRound },
  group: { label: "Group", Icon: UsersRound },
  final: { label: "Final", Icon: Flag },
} as const;

export function TimelineEntry({ quest, state, onSelect }: { quest: Quest; state: QuestState; onSelect: () => void }) {
  const { label, Icon } = trackMeta[quest.track];
  const isInteractive = state === "available";
  const time = new Date(quest.triggerTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return <button className={`timeline-entry timeline-entry-${state}`} onClick={onSelect} type="button" aria-label={`${quest.title}, ${label}, ${time}${state === "completed" ? ", completed" : state === "locked" ? ", upcoming" : ", active"}`}><span className="timeline-rail" aria-hidden="true"><span className="timeline-dot">{state === "completed" ? <Check size={14} /> : state === "locked" ? <LockKeyhole size={13} /> : <span />}</span></span><span className="timeline-time">{time}</span><span className="timeline-entry-content"><strong>{quest.title}</strong><span className="timeline-track-label"><Icon size={12} aria-hidden="true" /> {label}</span></span>{isInteractive && <span className="timeline-active-label">Go</span>}</button>;
}

