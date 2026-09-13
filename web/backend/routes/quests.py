from fastapi import APIRouter
from ..db.database import store
from ..models.quest import Quest
from ..services.quest_service import validate_trigger_spacing

router = APIRouter(prefix="/quests", tags=["quests"])


@router.post("/seed", response_model=list[Quest])
def seed_quests(quests: list[Quest]):
    errors = validate_trigger_spacing(quests)
    if errors:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail=errors)
    for quest in quests:
        store["quests"][quest.id] = quest
    return quests


@router.get("/{trip_id}", response_model=list[Quest])
def list_quests(trip_id: str):
    return [quest for quest in store["quests"].values() if quest.tripId == trip_id]

