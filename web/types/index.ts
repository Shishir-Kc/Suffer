export type TripStatus = "waiting" | "active" | "finished";
export type Track = "individual" | "group" | "final";
export type QuestType = "LBQ" | "VBQ" | "TBQ";
export type VerificationMethod = "gps" | "vote" | "timer" | "admin";

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  expectedPlayerCount: number;
  status: TripStatus;
  organizerId: string;
  createdAt: string;
}

export interface Player {
  id: string;
  tripId: string;
  name: string;
  isOrganizer: boolean;
  penalties: number;
  finalQuestStartTime: string | null;
  finalQuestCompleteTime: string | null;
  joinedAt: string;
  selfieDataUrl?: string;
}

export interface Quest {
  id: string;
  tripId: string;
  track: Track;
  type: QuestType;
  order: number;
  title: string;
  description: string;
  triggerTime: string;
  targetCoords: { lat: number; lng: number; radiusMeters: number } | null;
  timerDurationSeconds: number | null;
  isFinalQuestCandidate: boolean;
  assignedToPlayerId: string | null;
  /** The pool this candidate belongs to in the pool-first quest model. */
  poolId?: string;
}

export interface QuestPool {
  id: string;
  tripId: string;
  track: Track;
  order: number;
  triggerTime: string;
  candidates: Quest[];
  assignmentMode: "per-player" | "shared";
  /** Local sample assignments used by the mock trip. */
  assignments?: Record<string, string>;
}

export interface QuestCompletion {
  id: string;
  questId: string;
  playerId: string;
  completedAt: string;
  verificationMethod: VerificationMethod;
}

export interface Vote {
  id: string;
  questId: string;
  voterId: string;
  targetPlayerId: string;
  vote: "yes" | "no";
  createdAt: string;
}

export interface Report {
  id: string;
  tripId: string;
  reporterId: string;
  reportedPlayerId: string;
  reason: string;
  approvals: string[];
  status: "pending" | "approved" | "rejected";
  penaltyApplied: boolean;
  createdAt: string;
}

export interface GPSLog {
  playerId: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
}

export interface PlayerPosition extends GPSLog {
  name: string;
}
