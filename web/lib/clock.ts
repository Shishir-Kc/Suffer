const CLOCK_OFFSET_KEY = "suffer-clock-offset";

export function getSyncedNow() {
  if (typeof window === "undefined") return new Date();
  const offset = Number(window.localStorage.getItem(CLOCK_OFFSET_KEY) ?? 0);
  return new Date(Date.now() + offset);
}

export function setClockOffset(serverTimeIso: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLOCK_OFFSET_KEY, String(new Date(serverTimeIso).getTime() - Date.now()));
}

