import Link from "next/link";
import { ArrowRight, Check, LockKeyhole, Sparkles } from "lucide-react";
import type { Quest } from "@/types";
import { getUnlockCopy, type QuestState } from "@/lib/questEngine";
import { QuestBadge } from "@/components/ui/Badge";

export function QuestCard({ quest, state, label, now = new Date() }: { quest: Quest; state: QuestState; label: string; now?: Date }) {
  if (state === "completed") return <article className="quest-card quest-completed"><div className="quest-card-top"><span className="eyebrow">{label}</span><span className="completed-mark"><Check size={15} /> Done</span></div><h3>{quest.title}</h3><p>Nicely played. That one is in the bag.</p></article>;
  if (state === "locked") return <article className="quest-card quest-locked"><div className="quest-card-top"><span className="eyebrow">{label}</span><LockKeyhole size={20} aria-hidden="true" /></div><h3>Locked for now</h3><p>Not yet! Check back at {new Date(quest.triggerTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.</p><span className="unlock-copy">{getUnlockCopy(quest, now)}</span></article>;
  return <article className="quest-card quest-active"><div className="quest-card-top"><span className="eyebrow">{label}</span><Sparkles size={19} aria-hidden="true" /></div><div className="quest-title-row"><h3>{quest.title}</h3><QuestBadge type={quest.type} /></div><p>{quest.description}</p><Link className="card-action" href={`/quest/${quest.id}`}>Let&apos;s go <ArrowRight size={17} aria-hidden="true" /></Link></article>;
}

