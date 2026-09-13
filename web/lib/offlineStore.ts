import { openDB, type DBSchema } from "idb";
import type { GPSLog, Quest, QuestCompletion, Report, SyncPayload, Vote } from "@/types";

interface SufferDB extends DBSchema {
  quests: { key: string; value: Quest };
  completions: { key: string; value: QuestCompletion };
  votes: { key: string; value: Vote };
  reports: { key: string; value: Report };
  gpsLogs: { key: string; value: GPSLog };
}

const database = () => openDB<SufferDB>("suffer-trip", 1, { upgrade(db) {
  db.createObjectStore("quests", { keyPath: "id" });
  db.createObjectStore("completions", { keyPath: "id" });
  db.createObjectStore("votes", { keyPath: "id" });
  db.createObjectStore("reports", { keyPath: "id" });
  db.createObjectStore("gpsLogs", { keyPath: "timestamp" });
} });

export async function seedQuestData(quests: Quest[]) {
  const db = await database();
  const tx = db.transaction("quests", "readwrite");
  await Promise.all(quests.map((quest) => tx.store.put(quest)));
  await tx.done;
}

export async function getStoredQuests() {
  const db = await database();
  return db.getAll("quests");
}

export async function queueSyncPayload(payload: SyncPayload) {
  const db = await database();
  const completions = db.transaction("completions", "readwrite");
  const votes = db.transaction("votes", "readwrite");
  const reports = db.transaction("reports", "readwrite");
  const gpsLogs = db.transaction("gpsLogs", "readwrite");
  await Promise.all([
    ...payload.completions.map((item) => completions.store.put(item)),
    ...payload.votes.map((item) => votes.store.put(item)),
    ...payload.reports.map((item) => reports.store.put(item)),
    ...payload.gpsLogs.map((item) => gpsLogs.store.put(item)),
  ]);
  await Promise.all([completions.done, votes.done, reports.done, gpsLogs.done]);
}
