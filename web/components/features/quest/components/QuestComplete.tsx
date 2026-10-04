import { CheckCircle2 } from "lucide-react";

export function QuestComplete({
  copy = "Done! Nicely played.",
}: {
  copy?: string;
}) {
  return (
    <div className="quest-complete">
      <CheckCircle2 size={43} aria-hidden="true" />
      <strong>{copy}</strong>
      <span>Now go be a person again.</span>
    </div>
  );
}
