export const TBQ_PENALTY_MINUTES = 2;
export const REPORT_PENALTY_MINUTES = 5;

export function addPenalty(currentMinutes: number, reason: "tbq-failed" | "approved-report") {
  return currentMinutes + (reason === "tbq-failed" ? TBQ_PENALTY_MINUTES : REPORT_PENALTY_MINUTES);
}

export function finalQuestStartTime(scheduledIso: string, penaltyMinutes: number) {
  return new Date(new Date(scheduledIso).getTime() + penaltyMinutes * 60_000).toISOString();
}

