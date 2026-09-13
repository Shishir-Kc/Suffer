import { HelpCircle, MapPin } from "lucide-react";

export function QuestMarker({ locked = false }: { locked?: boolean }) {
  return <span className={`quest-marker ${locked ? "quest-marker-locked" : ""}`}>{locked ? <HelpCircle size={15} /> : <MapPin size={15} />}</span>;
}

