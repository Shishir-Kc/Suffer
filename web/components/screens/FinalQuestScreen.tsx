"use client";

import { Flag, Hourglass, Sparkles } from "lucide-react";
import { useState } from "react";
import { RouteShell } from "@/components/RouteShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Stopwatch } from "@/components/ui/Timer";
import { FinalReveal } from "@/components/leaderboard/FinalReveal";

export function FinalQuestScreen() {
  const [done, setDone] = useState(false);
  const startedAt = "2026-09-13T10:40:00.000Z";
  return (
    <RouteShell
      title="Final quest"
      eyebrow="Everyone starts together"
      back={true}
      nav={false}
    >
      <div className="final-quest-page">
        <div className="final-reveal-intro">
          <span className="brand-bubble small">
            <Sparkles size={19} />
          </span>
          <span className="eyebrow">The last one</span>
          <h1>
            Time to find
            <br />
            <em>your glory.</em>
          </h1>
        </div>
        <Card className="final-task-card">
          <div className="final-task-top">
            <span className="eyebrow">Your assigned quest</span>
            <span className="delay-badge">
              <Hourglass size={14} /> +2 min delay
            </span>
          </div>
          <h2>Find the hidden café token</h2>
          <p>
            Walk to the old stone bench, find the token, and bring it back to
            base. Your stopwatch is already running.
          </p>
          <div className="stopwatch-block">
            <span>your time</span>
            <Stopwatch startedAt={startedAt} />
          </div>
          <Button onClick={() => setDone(true)} className="full-width">
            <Flag size={17} /> I found it
          </Button>
        </Card>
        {done ? (
          <Card className="waiting-card">
            <span className="eyebrow">Nice work</span>
            <h2>Done! Waiting for everyone else...</h2>
            <div className="finishers">
              <span>✓ You</span>
              <span>⏳ Mina</span>
              <span>⏳ Kiran</span>
              <span>⏳ Riya</span>
            </div>
          </Card>
        ) : (
          <p className="final-reminder">
            Last one to finish sponsors café food for the whole crew. Friendly
            fire only.
          </p>
        )}
        <FinalReveal />
      </div>
    </RouteShell>
  );
}
