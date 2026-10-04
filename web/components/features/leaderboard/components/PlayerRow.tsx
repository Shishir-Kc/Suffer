import { Check, Clock3 } from "lucide-react";
import type { Player } from "@/types";

export function PlayerRow({
  player,
  completed,
  rank,
}: {
  player: Player;
  completed: number;
  rank: number;
}) {
  return (
    <div className="player-row">
      <span className="rank-number">{rank}</span>
      <span className="avatar">{player.name.slice(0, 1)}</span>
      <div className="player-name">
        <strong>{player.name}</strong>
        <span>{completed} quests done</span>
      </div>
      <span className="player-status">
        {player.penalties > 0 && (
          <small>
            <Clock3 size={12} /> +{player.penalties}m
          </small>
        )}
        <Check size={17} aria-label={`${completed} completed`} />
      </span>
    </div>
  );
}
