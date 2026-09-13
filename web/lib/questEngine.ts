import type { Quest, QuestCompletion, Track } from "@/types";

export type QuestState = "locked" | "available" | "completed" | "chill";

export function isQuestCompleted(quest: Quest, completions: QuestCompletion[], playerId: string) {
  return completions.some((completion) => completion.questId === quest.id && completion.playerId === playerId);
}

export function getTrackQuests(quests: Quest[], track: Track, playerId?: string) {
  return quests
    .filter((quest) => quest.track === track && (track !== "final" || quest.assignedToPlayerId === playerId))
    .sort((a, b) => a.order - b.order);
}

export function getQuestState(quest: Quest, quests: Quest[], completions: QuestCompletion[], playerId: string, now = new Date()) {
  if (isQuestCompleted(quest, completions, playerId)) return "completed" as const;
  const previous = getTrackQuests(quests, quest.track, playerId).find((candidate) => candidate.order === quest.order - 1);
  const previousDone = !previous || isQuestCompleted(previous, completions, playerId);
  const timeReady = now.getTime() >= new Date(quest.triggerTime).getTime();
  if (previousDone && timeReady) return "available" as const;
  return "locked" as const;
}

export function getCurrentQuest(quests: Quest[], track: Track, completions: QuestCompletion[], playerId: string, now = new Date()) {
  return getTrackQuests(quests, track, playerId).find((quest) => getQuestState(quest, quests, completions, playerId, now) !== "completed") ?? null;
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

