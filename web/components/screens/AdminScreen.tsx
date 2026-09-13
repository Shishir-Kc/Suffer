"use client";

import { ChevronRight, Clock3, Pause, Play, SkipForward, UsersRound } from "lucide-react";
import { useState } from "react";
import { demoQuests } from "@/lib/demoData";
import { RouteShell } from "@/components/RouteShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";

export function AdminScreen() {
  const [paused, setPaused] = useState(false);
  return <RouteShell title="Organizer controls" eyebrow="Master clock" back={true} nav={false}><div className="admin-heading"><span className="eyebrow">You&apos;re in charge, technically</span><h1>Keep the trip<br /><em>on the rails.</em></h1><p>Every change syncs to the crew when they connect to your hotspot.</p></div><div className="admin-actions"><Button variant={paused ? "primary" : "secondary"} onClick={() => setPaused((value) => !value)}>{paused ? <Play size={17} /> : <Pause size={17} />} {paused ? "Resume game" : "Pause game"}</Button><Button variant="ghost"><UsersRound size={17} /> Force sync</Button></div><Card className="clock-card"><Clock3 size={19} /><div><span className="eyebrow">Master clock</span><strong>Saturday · 11:42 AM</strong></div><StatusBadge tone={paused ? "warning" : "success"}>{paused ? "Paused" : "Live"}</StatusBadge></Card><section className="admin-section"><div className="section-heading"><h2>Quest timeline</h2><span>{demoQuests.length} loaded</span></div>{demoQuests.map((quest) => <div className="admin-quest" key={quest.id}><div><span className="eyebrow">{quest.track} · {quest.type}</span><strong>{quest.title}</strong><small>{new Date(quest.triggerTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small></div><div className="admin-quest-actions"><button aria-label={`Move ${quest.title} trigger time`}><Clock3 size={16} /></button><button aria-label={`Skip ${quest.title}`}><SkipForward size={16} /></button><ChevronRight size={18} /></div></div>)}</section><Card className="admin-note"><strong>Long press worked.</strong><p>That hidden button is just for you. Everyone else stays focused on the trip.</p></Card></RouteShell>;
}
