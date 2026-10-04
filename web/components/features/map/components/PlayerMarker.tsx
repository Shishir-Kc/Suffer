import { UserRound } from "lucide-react";

export function PlayerMarker({
  name,
  color = "sage",
}: {
  name: string;
  color?: "sage" | "terracotta" | "brown";
}) {
  return (
    <span className={`player-marker player-marker-${color}`} title={name}>
      <UserRound size={15} aria-hidden="true" />
    </span>
  );
}
