from datetime import datetime
from typing import Literal
from pydantic import BaseModel


class Report(BaseModel):
    id: str
    tripId: str
    reporterId: str
    reportedPlayerId: str
    reason: str
    approvals: list[str] = []
    status: Literal["pending", "approved", "rejected"] = "pending"
    penaltyApplied: bool = False
    createdAt: datetime


class ReportApproval(BaseModel):
    voterId: str
    approve: bool

