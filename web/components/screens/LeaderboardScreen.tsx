"use client";

import { RouteShell } from "@/components/RouteShell";
import { FinalReveal } from "@/components/leaderboard/FinalReveal";
import { PlayerRow } from "@/components/leaderboard/PlayerRow";
import { demoCompletions, demoPlayers } from "@/lib/mockData";

export function LeaderboardScreen() {
  const ranked = [...demoPlayers].sort((a, b) => demoCompletions.filter((item) => item.playerId === b.id).length - demoCompletions.filter((item) => item.playerId === a.id).length);
  return <RouteShell title="Crew board" eyebrow="No pressure"><div className="leaderboard-heading"><span className="eyebrow">The only scoreboard that matters</span><h1>Keep moving,<br /><em>keep laughing.</em></h1><p>Quests completed isn&apos;t everything. It&apos;s who finishes last that matters.</p></div><div className="player-list">{ranked.map((player, index) => <PlayerRow key={player.id} player={player} completed={demoCompletions.filter((item) => item.playerId === player.id).length} rank={index + 1} />)}</div><FinalReveal /></RouteShell>;
}
