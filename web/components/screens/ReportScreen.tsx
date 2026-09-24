"use client";

import { Flag, Send, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { demoPlayers } from "@/lib/mockData";
import { RouteShell } from "@/components/RouteShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";

export function ReportScreen() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <RouteShell title="Report" eyebrow="Keep it fair" back={true} nav={false}>
      <div className="report-heading">
        <div className="report-icon">
          <ShieldAlert size={24} />
        </div>
        <span className="eyebrow">Crew rules</span>
        <h1>Something feel off?</h1>
        <p>
          Reports go to the other four friends. Four approvals means a +5 minute
          penalty.
        </p>
      </div>
      <Card>
        <form
          className="stack-form"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <label htmlFor="reported">Who are you reporting?</label>
          <select id="reported" defaultValue="">
            <option value="" disabled>
              Select a crew member
            </option>
            {demoPlayers.slice(1).map((player) => (
              <option value={player.id} key={player.id}>
                {player.name}
              </option>
            ))}
          </select>
          <label htmlFor="reason">What happened?</label>
          <select id="reason" defaultValue="">
            <option value="" disabled>
              Pick a reason
            </option>
            <option>Cheating on a vote</option>
            <option>Sabotage</option>
            <option>Bribing</option>
          </select>
          <label htmlFor="note">
            Tiny bit more context <span>(optional)</span>
          </label>
          <textarea
            id="note"
            rows={4}
            placeholder="Keep it factual, no courtroom monologue needed."
          />
          <Button type="submit" className="full-width">
            <Send size={17} /> Send report
          </Button>
        </form>
      </Card>
      <div className="report-note">
        <Flag size={17} />
        <span>
          Use this for actual rule breaks, not because someone is winning.
        </span>
      </div>
      {submitted && <Toast message="Report sent. The crew will vote on it." />}
    </RouteShell>
  );
}
