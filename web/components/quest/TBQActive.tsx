"use client";

import { Clock3, Flag, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import type { Quest } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function TBQActive({ quest, onComplete, onFail }: { quest: Quest; onComplete: () => void; onFail: () => void }) {
  const [seconds, setSeconds] = useState(quest.timerDurationSeconds ?? 90);
  useEffect(() => { const id = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(id); }, []);
  const urgent = seconds <= 20;
  return <div className="quest-active-layout"><Card className={`timer-card ${urgent ? "timer-urgent" : ""}`}><span className="eyebrow">Timing quest</span><h1>{quest.title}</h1><p>{quest.description}</p><div className="countdown-face"><Clock3 size={23} aria-hidden="true" /><strong>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</strong><span>{seconds ? "Make it count." : "Time&apos;s up."}</span></div><Button onClick={seconds ? onComplete : onFail} className="full-width">{seconds ? <><Flag size={17} aria-hidden="true" /> I did it</> : <><ShieldAlert size={17} aria-hidden="true" /> Take the penalty</>}</Button></Card></div>;
}

