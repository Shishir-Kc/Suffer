from datetime import datetime, timedelta
from fastapi import APIRouter
from pydantic import BaseModel
from ..db.database import store

router = APIRouter(prefix="/admin", tags=["admin"])


class TriggerAdjustment(BaseModel):
    minutes: int


class SkipQuest(BaseModel):
    note: str


@router.patch("/quests/{quest_id}/trigger")
def adjust_trigger(quest_id: str, payload: TriggerAdjustment):
    quest = store["quests"].get(quest_id)
    if not quest or abs(payload.minutes) > 120:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="Quest missing or adjustment exceeds two hours")
    updated = quest.model_copy(update={"triggerTime": quest.triggerTime + timedelta(minutes=payload.minutes)})
    store["quests"][quest_id] = updated
    return updated


@router.post("/pause")
def pause_game(paused: bool = True):
    store["game"]["paused"] = paused
    return {"paused": paused}


@router.post("/quests/{quest_id}/skip")
def skip_quest(quest_id: str, payload: SkipQuest):
    store["skipped"][quest_id] = {"note": payload.note, "at": datetime.utcnow().isoformat()}
    return store["skipped"][quest_id]

