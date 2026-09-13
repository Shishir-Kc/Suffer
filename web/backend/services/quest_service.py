from datetime import datetime, timezone
from ..models.completion import QuestCompletion
from ..models.quest import Quest


def is_unlocked(quest: Quest, quests: list[Quest], completions: list[QuestCompletion], player_id: str, now: datetime | None = None) -> bool:
    current_time = now or datetime.now(timezone.utc)
    previous = next((item for item in quests if item.track == quest.track and item.order == quest.order - 1 and (item.assignedToPlayerId in (None, player_id))), None)
    previous_done = previous is None or any(item.questId == previous.id and item.playerId == player_id for item in completions)
    return previous_done and quest.triggerTime <= current_time


def validate_trigger_spacing(quests: list[Quest], minimum_hours: int = 4) -> list[str]:
    errors: list[str] = []
    for track in ("individual", "group", "final"):
        if track == "final" and all(item.isFinalQuestCandidate for item in quests if item.track == track):
            continue
        ordered = sorted((item for item in quests if item.track == track), key=lambda item: item.triggerTime)
        for previous, current in zip(ordered, ordered[1:]):
            if (current.triggerTime - previous.triggerTime).total_seconds() < minimum_hours * 3600:
                errors.append(f"{current.id} needs at least {minimum_hours} hours after {previous.id}")
    return errors
