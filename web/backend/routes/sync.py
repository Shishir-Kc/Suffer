from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel
from ..db.database import store
from ..services.sync_service import merge_sync_payload

router = APIRouter(prefix="/sync", tags=["sync"])


class SyncPayload(BaseModel):
    playerId: str
    completions: list[dict[str, Any]] = []
    votes: list[dict[str, Any]] = []
    reports: list[dict[str, Any]] = []
    gpsLogs: list[dict[str, Any]] = []
    lastSyncAt: str


@router.post("")
def sync(payload: SyncPayload):
    return {"ok": True, "playerId": payload.playerId, "syncedAt": merge_sync_payload(store["sync"], payload.completions, payload.votes, payload.reports, payload.gpsLogs)["lastSyncAt"]}

