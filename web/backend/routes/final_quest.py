from fastapi import APIRouter
from ..db.database import store
from ..services.random_assign import assign_final_quests

router = APIRouter(prefix="/final-quest", tags=["final quest"])


@router.post("/assign")
def assign_final_quests_route(trip_id: str):
    candidates = [quest for quest in store["quests"].values() if quest.tripId == trip_id and quest.isFinalQuestCandidate]
    players = [player for player in store["players"].values() if player.tripId == trip_id]
    assigned = assign_final_quests(candidates, players)
    for quest in assigned:
        store["quests"][quest.id] = quest
    return assigned

