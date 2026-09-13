from datetime import datetime, timezone
from uuid import uuid4
from fastapi import APIRouter
from ..db.database import store
from ..models.player import Player, PlayerJoin

router = APIRouter(prefix="/players", tags=["players"])


@router.post("/join", response_model=Player)
def join_trip(payload: PlayerJoin):
    player = Player(id=str(uuid4()), tripId=payload.tripId, name=payload.name, joinedAt=datetime.now(timezone.utc))
    store["players"][player.id] = player
    return player


@router.get("/{trip_id}", response_model=list[Player])
def list_players(trip_id: str):
    return [player for player in store["players"].values() if player.tripId == trip_id]

