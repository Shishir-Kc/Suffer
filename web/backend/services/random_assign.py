import random
from ..models.player import Player
from ..models.quest import Quest


def assign_final_quests(candidates: list[Quest], players: list[Player]) -> list[Quest]:
    pool = candidates[:]
    random.shuffle(pool)
    return [quest.model_copy(update={"assignedToPlayerId": player.id}) for quest, player in zip(pool, players)]

