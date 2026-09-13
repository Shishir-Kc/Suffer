import { Coffee, PartyPopper } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function FinalReveal({ name = "Mina" }: { name?: string }) {
  return <Card className="final-reveal"><PartyPopper size={31} aria-hidden="true" /><span className="eyebrow">Final result</span><h2>{name} is buying the coffee.</h2><p>GG everyone. Somebody had to finish last. 🫡</p><div className="coffee-line"><Coffee size={17} /> Café fund: officially activated</div></Card>;
}

