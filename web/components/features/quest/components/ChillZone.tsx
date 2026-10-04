import { Coffee, Moon } from "lucide-react";
import { Countdown } from "@/components/ui/Timer";

export function ChillZone({ nextTrigger }: { nextTrigger: string }) {
  return (
    <article className="chill-zone">
      <div className="chill-orb">
        <Moon size={27} aria-hidden="true" />
        <Coffee size={20} aria-hidden="true" />
      </div>
      <span className="eyebrow">Chill zone</span>
      <h2>Put your phone down</h2>
      <p>
        The next quest will find you. Go look at the actual hills for a bit.
      </p>
      <div className="chill-countdown">
        Next unlock in <Countdown targetIso={nextTrigger} />
      </div>
    </article>
  );
}
