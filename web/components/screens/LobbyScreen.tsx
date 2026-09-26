"use client";

import Link from "next/link";
import { ArrowRight, Check, Copy, Crown, Users } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { demoPlayers, demoTrip } from "@/lib/mockData";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SelfieCapture } from "@/components/lobby/SelfieCapture";

export function LobbyScreen() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [players, setPlayers] = useState(demoPlayers);
  const currentPlayerId = demoPlayers[0]?.id;
  const currentPlayer = players.find((player) => player.id === currentPlayerId);

  function saveCurrentPlayerSelfie(selfieDataUrl: string) {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player) =>
        player.id === currentPlayerId ? { ...player, selfieDataUrl } : player,
      ),
    );
  }

  return (
    <main className="lobby-screen">
      <div className="lobby-top">
        <span className="eyebrow">Waiting room</span>
        <h1>{demoTrip.name}</h1>
        <p>Starts Saturday, 17 October · Bhedetar → Namje</p>
      </div>
      <Card className="trip-code-card">
        <span>Trip code</span>
        <strong>BHED26</strong>
        <button
          onClick={() => {
            navigator.clipboard?.writeText("BHED26");
            setCopied(true);
          }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
          {copied ? "Copied" : "Copy code"}
        </button>
      </Card>
      <SelfieCapture
        selfieDataUrl={currentPlayer?.selfieDataUrl}
        onSave={saveCurrentPlayerSelfie}
      />
      <section className="crew-section">
        <div className="section-heading">
          <h2>
            The crew <span>({demoPlayers.length}/6)</span>
          </h2>
          <Users size={19} aria-hidden="true" />
        </div>
        <div className="crew-list">
          {players.map((player) => (
            <div className="crew-person" key={player.id}>
              {player.selfieDataUrl ? (
                <img
                  className="avatar avatar-photo"
                  src={player.selfieDataUrl}
                  alt={`${player.name}'s trip avatar`}
                />
              ) : (
                <span className="avatar">{player.name[0]}</span>
              )}
              <span>{player.name}</span>
              {player.isOrganizer && <Crown size={15} aria-label="Organizer" />}
            </div>
          ))}
        </div>
      </section>
      <div className="waiting-message">
        <span className="pulse-dot" />
        <div>
          <strong>Everyone&apos;s here. Almost.</strong>
          <p>Tell your friends the code. Or don&apos;t. See how that goes.</p>
        </div>
      </div>
      <Button className="full-width" onClick={() => router.push("/home")}>
        Start trip <ArrowRight size={18} />
      </Button>
      <Link className="quiet-link" href="/home">
        Preview home screen
      </Link>
    </main>
  );
}
