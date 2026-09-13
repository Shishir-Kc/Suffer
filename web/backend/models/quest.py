from datetime import datetime
from typing import Literal
from pydantic import BaseModel


class TargetCoords(BaseModel):
    lat: float
    lng: float
    radiusMeters: int


class Quest(BaseModel):
    id: str
    tripId: str
    track: Literal["individual", "group", "final"]
    type: Literal["LBQ", "VBQ", "TBQ"]
    order: int
    title: str
    description: str
    triggerTime: datetime
    targetCoords: TargetCoords | None = None
    timerDurationSeconds: int | None = None
    isFinalQuestCandidate: bool = False
    assignedToPlayerId: str | None = None

