import { TimelineEntry, type TimelineEntryProps } from "@/components/timeline/TimelineEntry";

export function TimelineView({ entries }: { entries: TimelineEntryProps[] }) {
  return <div className="timeline-list">
    {entries.map((entry, i) => <TimelineEntry key={i} {...entry} isLast={i === entries.length - 1} />)}
  </div>;
}
