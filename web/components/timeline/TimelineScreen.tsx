"use client";

import { CalendarClock, Clock3, Flag, UserRound, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Quest } from "@/types";
import { demoCompletions, demoPlayers, demoQuests } from "@/lib/demoData";
import { getStoredQuests, seedQuestData } from "@/lib/offlineStore";
import { getQuestState } from "@/lib/questEngine";
import { RouteShell } from "@/components/RouteShell";
import { Card } from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";
import { TimelineView } from "@/components/timeline/TimelineView";
import type { TimelineEntryProps } from "@/components/timeline/TimelineEntry";

const trackMeta = {
  individual: { label: "Your quest", Icon: UserRound },
  group: { label: "Group quest", Icon: UsersRound },
  final: { label: "Final quest", Icon: Flag },
} as const;

export function TimelineScreen() {
  const router = useRouter();
  const playerId = demoPlayers[0].id;
  const [quests, setQuests] = useState<Quest[]>(demoQuests);
  const [now, setNow] = useState(() => new Date());
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getStoredQuests().then((storedQuests) => {
      if (!mounted) return;
      if (storedQuests.length) {
        setQuests(storedQuests);
        return;
      }
      seedQuestData(demoQuests).catch(() => undefined);
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const timelineQuests = useMemo(() => quests.filter((quest) => quest.track !== "final" || quest.assignedToPlayerId === playerId).sort((a, b) => new Date(a.triggerTime).getTime() - new Date(b.triggerTime).getTime()), [quests, playerId]);
  const completedCount = timelineQuests.filter((quest) => getQuestState(quest, quests, demoCompletions, playerId, now) === "completed").length;

  function handleSelect(quest: Quest) {
    const state = getQuestState(quest, quests, demoCompletions, playerId, now);
    if (state === "available") {
      router.push(`/quest/${quest.id}`);
      return;
    }
    if (state === "locked") {
      setNotice(`Unlocks at ${new Date(quest.triggerTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
    }
  }

  const entries = timelineQuests.map<TimelineEntryProps>((quest) => {
    const state = getQuestState(quest, quests, demoCompletions, playerId, now);
    const track = trackMeta[quest.track];
    const status = state === "completed" ? "completed" : state === "available" ? "active" : "upcoming";
    return {
      time: new Date(quest.triggerTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      title: quest.title,
      trackLabel: track.label,
      trackIcon: <track.Icon size={14} aria-hidden="true" />,
      status,
      onClick: () => handleSelect(quest),
    };
  });

  return <RouteShell title="Timeline" eyebrow="Every quest, one trail"><div className="timeline-heading"><div className="timeline-heading-icon"><CalendarClock size={22} aria-hidden="true" /></div><span className="eyebrow">Stay curious, stay present</span><h1>The trip,<br /><em>in order.</em></h1><p>One lightweight view of what&apos;s happened, what&apos;s live, and what&apos;s next.</p></div><Card className="timeline-summary"><div className="timeline-summary-stat"><span className="eyebrow">Progress so far</span><strong>{completedCount} done</strong></div><span className="timeline-summary-divider" aria-hidden="true" /><div className="timeline-summary-stat timeline-summary-stat-right"><span className="eyebrow">Quest index</span><strong>{timelineQuests.length}<small>quests loaded</small></strong></div></Card><TimelineView entries={entries} /><div className="timeline-key"><span><span className="key-dot key-dot-active" /> Active now</span><span><span className="key-dot key-dot-upcoming" /> Coming up</span><span><span className="key-dot key-dot-done" /> Done</span></div><div className="timeline-footnote"><Clock3 size={15} aria-hidden="true" /> Trigger times sync from the organizer&apos;s clock.</div>{notice && <Toast message={notice} />}</RouteShell>;
}
