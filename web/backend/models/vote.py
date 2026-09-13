from datetime import datetime
from typing import Literal
from pydantic import BaseModel


class Vote(BaseModel):
    id: str
    questId: str
    voterId: str
    targetPlayerId: str
    vote: Literal["yes", "no"]
    createdAt: datetime

