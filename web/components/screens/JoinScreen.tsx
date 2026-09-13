"use client";

import Link from "next/link";
import { ArrowRight, KeyRound, UserRound } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function JoinScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  return <main className="entry-screen"><div className="entry-glow" /><div className="brand-lockup"><span className="brand-bubble">S</span><h1>Suffer</h1><p>A trip game. Stay off your phone. Win or pay.</p></div><form className="entry-form" onSubmit={(event) => { event.preventDefault(); router.push("/lobby"); }}><label htmlFor="trip-code">Trip code</label><div className="input-wrap"><KeyRound size={18} aria-hidden="true" /><input id="trip-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase().slice(0, 6))} placeholder="e.g. BHED26" maxLength={6} required /></div><label htmlFor="player-name">Your name</label><div className="input-wrap"><UserRound size={18} aria-hidden="true" /><input id="player-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="What should the crew call you?" required /></div><Button type="submit" className="full-width" disabled={code.length < 6 || !name.trim()}>Join the trip <ArrowRight size={18} /></Button></form><Link className="quiet-link" href="/create">Create a trip instead</Link><p className="entry-footnote">No feed. No streaks. Just six friends and a little friendly suffering.</p></main>;
}
