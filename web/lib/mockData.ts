import type { Player, Quest, QuestCompletion, QuestPool, Trip } from "@/types";

const today = new Date();
const at = (hour: number, minute = 0) => {
  const value = new Date(today);
  value.setHours(hour, minute, 0, 0);
  return value.toISOString();
};

export const demoTrip: Trip = {
  id: "BHED26",
  name: "Bhedetar Weekend",
  startDate: "2026-10-17T08:00:00.000Z",
  expectedPlayerCount: 6,
  status: "active",
  organizerId: "p1",
  createdAt: new Date().toISOString(),
};

export const demoPlayers: Player[] = [
  { id: "p1", tripId: "BHED26", name: "Aarav", isOrganizer: true, penalties: 0, finalQuestStartTime: null, finalQuestCompleteTime: null, joinedAt: at(8) },
  { id: "p2", tripId: "BHED26", name: "Mina", isOrganizer: false, penalties: 2, finalQuestStartTime: null, finalQuestCompleteTime: null, joinedAt: at(8, 2) },
  { id: "p3", tripId: "BHED26", name: "Kiran", isOrganizer: false, penalties: 0, finalQuestStartTime: null, finalQuestCompleteTime: null, joinedAt: at(8, 3) },
  { id: "p4", tripId: "BHED26", name: "Riya", isOrganizer: false, penalties: 0, finalQuestStartTime: null, finalQuestCompleteTime: null, joinedAt: at(8, 4) },
  { id: "p5", tripId: "BHED26", name: "Suman", isOrganizer: false, penalties: 5, finalQuestStartTime: null, finalQuestCompleteTime: null, joinedAt: at(8, 5) },
  { id: "p6", tripId: "BHED26", name: "Nabin", isOrganizer: false, penalties: 0, finalQuestStartTime: null, finalQuestCompleteTime: null, joinedAt: at(8, 6) },
];

export const demoQuests: Quest[] = [
  { id: "i1", tripId: "BHED26", track: "individual", type: "LBQ", order: 1, title: "Touch the first viewpoint", description: "Walk to the Bhedetar viewpoint and take in the hills. The app will know when you arrive.", triggerTime: at(8), targetCoords: { lat: 26.89, lng: 87.21, radiusMeters: 80 }, timerDurationSeconds: null, isFinalQuestCandidate: false, assignedToPlayerId: null },
  { id: "i2", tripId: "BHED26", track: "individual", type: "VBQ", order: 2, title: "Learn one local word", description: "Ask a local how to say “thank you” in their language. Tell your friends what you learned.", triggerTime: at(12), targetCoords: null, timerDurationSeconds: null, isFinalQuestCandidate: false, assignedToPlayerId: null },
  { id: "i3", tripId: "BHED26", track: "individual", type: "TBQ", order: 3, title: "The 90-second dance", description: "Get the group moving. Make up a tiny dance and perform it for everyone before the timer runs out.", triggerTime: at(17), targetCoords: null, timerDurationSeconds: 90, isFinalQuestCandidate: false, assignedToPlayerId: null },
  { id: "g1", tripId: "BHED26", track: "group", type: "LBQ", order: 1, title: "Find the Namje trailhead", description: "Everyone needs to reach the trailhead together. No one gets left behind.", triggerTime: at(9), targetCoords: { lat: 26.78, lng: 87.17, radiusMeters: 100 }, timerDurationSeconds: null, isFinalQuestCandidate: false, assignedToPlayerId: null },
  { id: "g2", tripId: "BHED26", track: "group", type: "VBQ", order: 2, title: "Build the perfect lunch", description: "Work together to make lunch with three local ingredients. Get a majority vote from the crew.", triggerTime: at(14), targetCoords: null, timerDurationSeconds: null, isFinalQuestCandidate: false, assignedToPlayerId: null },
  { id: "f1", tripId: "BHED26", track: "final", type: "TBQ", order: 1, title: "The last little legend", description: "Find the hidden café token, bring it back to base, and claim your finish.", triggerTime: at(15, 30), targetCoords: null, timerDurationSeconds: null, isFinalQuestCandidate: true, assignedToPlayerId: "p1" },
  { id: "f2", tripId: "BHED26", track: "final", type: "TBQ", order: 2, title: "The bell ringer", description: "Find the bell near base, ring it three times, and return before anyone else.", triggerTime: at(15, 30), targetCoords: null, timerDurationSeconds: null, isFinalQuestCandidate: true, assignedToPlayerId: null },
  { id: "f3", tripId: "BHED26", track: "final", type: "TBQ", order: 3, title: "A tiny mountain portrait", description: "Sketch a five-minute portrait of the nearest hill and bring it to the finish line.", triggerTime: at(15, 30), targetCoords: null, timerDurationSeconds: null, isFinalQuestCandidate: true, assignedToPlayerId: null },
  { id: "f4", tripId: "BHED26", track: "final", type: "TBQ", order: 4, title: "The red thread", description: "Find the red thread tied somewhere around base and bring back the knot.", triggerTime: at(15, 30), targetCoords: null, timerDurationSeconds: null, isFinalQuestCandidate: true, assignedToPlayerId: null },
  { id: "f5", tripId: "BHED26", track: "final", type: "TBQ", order: 5, title: "Three good things", description: "Collect three honest compliments from the crew and report back with receipts.", triggerTime: at(15, 30), targetCoords: null, timerDurationSeconds: null, isFinalQuestCandidate: true, assignedToPlayerId: null },
  { id: "f6", tripId: "BHED26", track: "final", type: "TBQ", order: 6, title: "The secret handshake", description: "Recreate the crew handshake with two friends and show it at base.", triggerTime: at(15, 30), targetCoords: null, timerDurationSeconds: null, isFinalQuestCandidate: true, assignedToPlayerId: null },
  { id: "f7", tripId: "BHED26", track: "final", type: "TBQ", order: 7, title: "Leaf it better", description: "Find the most interesting leaf nearby and bring it back without tearing it.", triggerTime: at(15, 30), targetCoords: null, timerDurationSeconds: null, isFinalQuestCandidate: true, assignedToPlayerId: null },
  { id: "f8", tripId: "BHED26", track: "final", type: "TBQ", order: 8, title: "The local phrase", description: "Learn a new local phrase and teach it to the organizer at the finish.", triggerTime: at(15, 30), targetCoords: null, timerDurationSeconds: null, isFinalQuestCandidate: true, assignedToPlayerId: null },
  { id: "f9", tripId: "BHED26", track: "final", type: "TBQ", order: 9, title: "Postcard from here", description: "Write a postcard-sized note about this exact view and deliver it to base.", triggerTime: at(15, 30), targetCoords: null, timerDurationSeconds: null, isFinalQuestCandidate: true, assignedToPlayerId: null },
  { id: "f10", tripId: "BHED26", track: "final", type: "TBQ", order: 10, title: "The human compass", description: "Point out east, west, north, and south to the crew with no phone help.", triggerTime: at(15, 30), targetCoords: null, timerDurationSeconds: null, isFinalQuestCandidate: true, assignedToPlayerId: null },
];

export const demoQuestPools: QuestPool[] = [
  { id: "ip1", tripId: "BHED26", track: "individual", order: 1, triggerTime: at(8), assignmentMode: "per-player", assignments: { p1: "i1", p2: "i1", p3: "i1", p4: "i1", p5: "i1", p6: "i1" }, candidates: [demoQuests[0]] },
  { id: "ip2", tripId: "BHED26", track: "individual", order: 2, triggerTime: at(12), assignmentMode: "per-player", assignments: { p1: "i2", p2: "i2", p3: "i2", p4: "i2", p5: "i2", p6: "i2" }, candidates: [demoQuests[1]] },
  { id: "ip3", tripId: "BHED26", track: "individual", order: 3, triggerTime: at(17), assignmentMode: "per-player", assignments: { p1: "i3", p2: "i3", p3: "i3", p4: "i3", p5: "i3", p6: "i3" }, candidates: [demoQuests[2]] },
  { id: "gp1", tripId: "BHED26", track: "group", order: 1, triggerTime: at(9), assignmentMode: "shared", assignments: { shared: "g1" }, candidates: [demoQuests[3]] },
  { id: "gp2", tripId: "BHED26", track: "group", order: 2, triggerTime: at(14), assignmentMode: "shared", assignments: { shared: "g2" }, candidates: [demoQuests[4]] },
  { id: "fp1", tripId: "BHED26", track: "final", order: 1, triggerTime: at(15, 30), assignmentMode: "per-player", assignments: { p1: "f1" }, candidates: demoQuests.slice(5) },
];

export const demoCompletions: QuestCompletion[] = [
  { id: "c1", questId: "i1", playerId: "p1", completedAt: at(10), verificationMethod: "gps" },
  { id: "c2", questId: "g1", playerId: "p1", completedAt: at(11), verificationMethod: "gps" },
  { id: "c3", questId: "i1", playerId: "p2", completedAt: at(10, 12), verificationMethod: "gps" },
  { id: "c4", questId: "i1", playerId: "p3", completedAt: at(10, 14), verificationMethod: "gps" },
  { id: "c5", questId: "i1", playerId: "p4", completedAt: at(10, 16), verificationMethod: "gps" },
];
