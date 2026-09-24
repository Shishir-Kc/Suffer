"use client";

import { useEffect, useState } from "react";

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function Countdown({
  targetIso,
  label = "left",
}: {
  targetIso: string;
  label?: string;
}) {
  const [remaining, setRemaining] = useState(
    () => new Date(targetIso).getTime() - Date.now(),
  );
  useEffect(() => {
    const id = window.setInterval(
      () => setRemaining(new Date(targetIso).getTime() - Date.now()),
      1000,
    );
    return () => window.clearInterval(id);
  }, [targetIso]);
  return (
    <span
      className="timer-value"
      aria-label={`${formatDuration(remaining)} ${label}`}
    >
      {formatDuration(remaining)}
    </span>
  );
}

export function Stopwatch({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(
    () => Date.now() - new Date(startedAt).getTime(),
  );
  useEffect(() => {
    const id = window.setInterval(
      () => setElapsed(Date.now() - new Date(startedAt).getTime()),
      1000,
    );
    return () => window.clearInterval(id);
  }, [startedAt]);
  return (
    <span className="timer-value stopwatch-value">
      {formatDuration(elapsed)}
    </span>
  );
}
