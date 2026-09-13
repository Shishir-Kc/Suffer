from datetime import datetime
from typing import Literal
from pydantic import BaseModel


class QuestCompletion(BaseModel):
    id: str
    questId: str
    playerId: str
    completedAt: datetime
    verificationMethod: Literal["gps", "vote", "timer", "admin"]

