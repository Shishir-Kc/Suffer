from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


class Trip(BaseModel):
    id: str = Field(min_length=6, max_length=6)
    name: str
    startDate: datetime
    status: Literal["waiting", "active", "finished"] = "waiting"
    organizerId: str
    createdAt: datetime


class TripCreate(BaseModel):
    name: str
    startDate: datetime
    organizerId: str

