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

export function TimelineEntry({ time, title, trackLabel, trackIcon, status, isLast, onClick }: TimelineEntryProps) {
  const cardBg = status === "completed" ? "var(--color-brown-secondary)" : status === "active" ? "var(--color-brown-primary)" : "var(--color-bg)";
  const textColor = status === "completed" ? "#FFFFFF" : "var(--color-text-primary)";

  return <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "flex-start" }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24 }}>
      <div className={status === "active" ? "timeline-node timeline-node--pulse" : "timeline-node"} style={{ width: 12, height: 12, borderRadius: "50%", background: status === "upcoming" ? "var(--color-text-secondary)" : cardBg, marginTop: 6 }} />
      {!isLast && <div style={{ flex: 1, width: 2, background: "var(--color-brown-secondary)", opacity: 0.3, marginTop: 4 }} />}
    </div>
    <div style={{ flex: 1, marginBottom: "var(--space-lg)", padding: "var(--space-md)", borderRadius: "var(--radius-lg)", background: cardBg, color: textColor, boxShadow: "var(--shadow-md)", cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{time}</div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, opacity: 0.8 }}>
        {trackIcon}
        <span>{trackLabel}</span>
      </div>
    </div>
  </div>;
}
