"use client";

import { ArrowRight, Check, Flag, LockKeyhole, Sparkles, UserRound, UsersRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Quest } from "@/types";
import type { QuestState } from "@/lib/questEngine";

const trackMeta = {
  individual: { label: "Your quest", Icon: UserRound },
  group: { label: "Group quest", Icon: UsersRound },
  final: { label: "Final quest", Icon: Flag },
} as const;

const stateMeta = {
  completed: { label: "Done", Icon: Check },
  available: { label: "Live now", Icon: Sparkles },
  locked: { label: "Not yet", Icon: LockKeyhole },
} as const;

export function TimelineEntry({ quest, state, index, onSelect }: { quest: Quest; state: QuestState; index: number; onSelect: () => void }) {
  const entryRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const track = trackMeta[quest.track];
  const status = stateMeta[state === "chill" ? "locked" : state];
  const TrackIcon = track.Icon;
  const StateIcon = status.Icon;
  const time = new Date(quest.triggerTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  useEffect(() => {
    const element = entryRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { threshold: 0.12 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <button ref={entryRef} className={`timeline-entry timeline-entry-${state} ${visible ? "timeline-entry-visible" : ""}`} style={{ "--timeline-delay": `${Math.min(index * 55, 275)}ms` } as React.CSSProperties} onClick={onSelect} type="button" aria-label={`${quest.title}, ${track.label}, ${time}${state === "completed" ? ", completed" : state === "locked" ? ", upcoming" : ", active"}`}><span className="timeline-node-column" aria-hidden="true"><span className="timeline-node"><StateIcon size={state === "available" ? 15 : 14} /></span></span><span className="timeline-entry-card"><span className="timeline-entry-header"><span className="timeline-time">{time}</span><span className="timeline-state-copy"><StateIcon size={13} /> {status.label}</span></span><span className="timeline-title-row"><strong>{quest.title}</strong>{state === "available" && <span className="timeline-go-chip">Go <ArrowRight size={14} aria-hidden="true" /></span>}</span><span className="timeline-entry-meta"><span className="timeline-track-label"><TrackIcon size={13} aria-hidden="true" /> {track.label}</span></span></span></button>;
}
