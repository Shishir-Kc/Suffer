"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, FileJson, Sparkles, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function CreateScreen() {
  const [created, setCreated] = useState(false);
  return <main className="entry-screen create-screen"><Link className="back-link" href="/join"><ArrowLeft size={18} /> Back to join</Link><div className="form-heading"><span className="eyebrow">Organizer setup</span><h1>Make the trip<br /><em>worth remembering.</em></h1><p>Load the quests, invite five friends, and let the hills do the rest.</p></div>{created ? <section className="code-reveal"><span className="brand-bubble small"><Sparkles size={20} /></span><span className="eyebrow">Your trip code</span><strong>BHED26</strong><p>Share it with the crew. Six seats, no spectators.</p><Link className="card-action" href="/lobby">Open waiting room <ArrowLeft size={17} className="rotate-180" /></Link></section> : <form className="entry-form" onSubmit={(event) => { event.preventDefault(); setCreated(true); }}><label htmlFor="trip-name">Trip name</label><div className="input-wrap"><Sparkles size={18} aria-hidden="true" /><input id="trip-name" defaultValue="Bhedetar Weekend" required /></div><label htmlFor="trip-date">Start date</label><div className="input-wrap"><CalendarDays size={18} aria-hidden="true" /><input id="trip-date" type="date" defaultValue="2026-10-17" required /></div><label className="upload-box" htmlFor="quest-json"><FileJson size={25} /><span><strong>Drop quest JSON here</strong><small>10–15 final candidates recommended</small></span><Upload size={18} aria-hidden="true" /><input id="quest-json" type="file" accept="application/json" /></label><Button type="submit" className="full-width">Generate trip code <ArrowLeft size={17} className="rotate-180" /></Button></form>}</main>;
}

