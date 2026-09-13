import type { SyncPayload } from "@/types";

export async function syncWithOrganizer(payload: SyncPayload, endpoint = "/api/sync") {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { synced: false, reason: "offline" };
  try {
    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error("Sync did not complete");
    return { synced: true, reason: "organizer-updated" };
  } catch {
    return { synced: false, reason: "retry-later" };
  }
}

