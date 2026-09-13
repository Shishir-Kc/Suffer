"use client";

import { Check, ThumbsUp, Users } from "lucide-react";
import { useState } from "react";
import type { Quest } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function VBQActive({ quest, onComplete }: { quest: Quest; onComplete: () => void }) {
  const [votes, setVotes] = useState(3);
  return <div className="quest-active-layout"><Card className="quest-brief"><span className="eyebrow">Voting quest</span><h1>{quest.title}</h1><p>{quest.description}</p><div className="vote-instruction"><Users size={21} aria-hidden="true" /><span>Ask your friends to verify this. Bribing and sabotaging are strictly not the vibe.</span></div></Card><Card className="vote-card"><div className="vote-count"><strong>{votes} <small>out of 5</small></strong><span>verified <Check size={15} /></span></div><div className="vote-meter"><span style={{ width: `${(votes / 5) * 100}%` }} /></div><p>Your crew&apos;s votes sync when everyone taps in.</p><div className="vote-actions"><Button variant="secondary" onClick={() => setVotes((value) => Math.min(5, value + 1))}><ThumbsUp size={17} aria-hidden="true" /> Simulate yes</Button>{votes >= 3 && <Button onClick={onComplete}>Finish quest</Button>}</div></Card></div>;
}

