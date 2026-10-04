import type { ReactNode } from "react";

export type TimelineEntryProps = {
  time: string;
  title: string;
  trackLabel: string;
  trackIcon: ReactNode;
  status: "completed" | "active" | "upcoming";
  isLast?: boolean;
  onClick?: () => void;
};

export function TimelineEntry({
  time,
  title,
  trackLabel,
  trackIcon,
  status,
  isLast,
  onClick,
}: TimelineEntryProps) {
  const content = (
    <>
      <span className="timeline-entry-time">{time}</span>
      <strong>{title}</strong>
      <span className="timeline-entry-track">
        {trackIcon}
        {trackLabel}
      </span>
    </>
  );
  return (
    <div className={`timeline-entry timeline-entry-${status}`}>
      <div className="timeline-rail" aria-hidden="true">
        <span className="timeline-node" />
        {!isLast && <span className="timeline-connector" />}
      </div>
      {onClick ? (
        <button type="button" className="timeline-entry-card" onClick={onClick}>
          {content}
        </button>
      ) : (
        <div className="timeline-entry-card">{content}</div>
      )}
    </div>
  );
}
