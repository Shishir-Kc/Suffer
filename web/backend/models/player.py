from datetime import datetime
from pydantic import BaseModel


class Player(BaseModel):
    id: str
    tripId: str
    name: str
    isOrganizer: bool = False
    penalties: int = 0
    finalQuestStartTime: datetime | None = None
    finalQuestCompleteTime: datetime | None = None
    joinedAt: datetime


class PlayerJoin(BaseModel):
    tripId: str
    name: str

