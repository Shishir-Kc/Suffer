import { Compass, Timer, Vote } from "lucide-react";
import type { QuestType } from "@/types";

const badgeMeta: Record<
  QuestType,
  { label: string; className: string; Icon: typeof Compass }
> = {
  LBQ: { label: "Location", className: "badge-location", Icon: Compass },
  VBQ: { label: "Vote", className: "badge-vote", Icon: Vote },
  TBQ: { label: "Timer", className: "badge-timer", Icon: Timer },
};

export function QuestBadge({ type }: { type: QuestType }) {
  const { label, className, Icon } = badgeMeta[type];
  return (
    <span className={`quest-badge ${className}`}>
      <Icon size={14} aria-hidden="true" /> {label}
    </span>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return <span className={`status-badge status-${tone}`}>{children}</span>;
}
