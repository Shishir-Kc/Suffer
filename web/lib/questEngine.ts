import type { Quest, QuestCompletion, QuestPool, Track } from "@/types";

export type QuestState = "locked" | "available" | "completed" | "chill";

type QuestSource = Quest[] | QuestPool[];

function isPoolSource(source: QuestSource): source is QuestPool[] {
  return source.length === 0 || "candidates" in source[0];
}

export function resolveQuestForPlayer(pool: QuestPool, playerId: string): Quest | null {
  const assignedId = pool.assignments?.[pool.assignmentMode === "shared" ? "shared" : playerId] ?? pool.assignments?.[playerId];
  const candidate = assignedId ? pool.candidates.find((item) => item.id === assignedId) : undefined;
  const selectionKey = pool.assignmentMode === "shared" ? pool.id : `${pool.id}:${playerId}`;
  const seed = Array.from(selectionKey).reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) | 0, 7);
  const fallback = candidate ?? pool.candidates[Math.abs(seed) % pool.candidates.length];
  if (!fallback) return null;
  return { ...fallback, track: pool.track, order: pool.order, triggerTime: pool.triggerTime, poolId: pool.id } as Quest;
}

export function getPoolForQuest(source: QuestPool[], quest: Quest) {
  return source.find((pool) => pool.id === quest.poolId || pool.candidates.some((candidate) => candidate.id === quest.id));
}

export function isQuestCompleted(quest: Quest, completions: QuestCompletion[], playerId: string) {
  return completions.some((completion) => completion.questId === quest.id && completion.playerId === playerId);
}

export function getTrackQuests(source: QuestSource, track: Track, playerId?: string) {
  if (isPoolSource(source)) {
    const resolved = source
      .filter((pool) => pool.track === track)
      .map((pool) => resolveQuestForPlayer(pool, playerId ?? "") ?? undefined)
      .filter(Boolean) as Quest[];
    return resolved.sort((a, b) => a.order - b.order);
  }
  return source
    .filter((quest) => quest.track === track && (track !== "final" || quest.assignedToPlayerId === playerId))
    .sort((a, b) => a.order - b.order);
}

export function getQuestState(quest: Quest, source: QuestSource, completions: QuestCompletion[], playerId: string, now = new Date()) {
  if (isQuestCompleted(quest, completions, playerId)) return "completed" as const;
  const previous = getTrackQuests(source, quest.track, playerId).find((candidate) => candidate.order === quest.order - 1);
  const previousDone = !previous || isQuestCompleted(previous, completions, playerId);
  const timeReady = now.getTime() >= new Date(quest.triggerTime).getTime();
  if (previousDone && timeReady) return "available" as const;
  return "locked" as const;
}

export function getCurrentQuest(source: QuestSource, track: Track, completions: QuestCompletion[], playerId: string, now = new Date()) {
  return getTrackQuests(source, track, playerId).find((quest) => getQuestState(quest, source, completions, playerId, now) !== "completed") ?? null;
}

export function getUnlockCopy(quest: Quest, now = new Date()) {
  const milliseconds = Math.max(0, new Date(quest.triggerTime).getTime() - now.getTime());
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  if (!milliseconds) return "Ready when you are.";
  return `unlocks in ${hours > 0 ? `${hours}h ` : ""}${minutes}m`;
}

export function getTimeUntil(isoTime: string, now = new Date()) {
  return Math.max(0, new Date(isoTime).getTime() - now.getTime());
}
