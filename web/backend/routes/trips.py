from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from ..db.database import store
from ..models.trip import Trip, TripCreate

router = APIRouter(prefix="/trips", tags=["trips"])


@router.post("", response_model=Trip)
def create_trip(payload: TripCreate):
    trip_id = f"{payload.name[:3].upper()}26"[:6].ljust(6, "X")
    trip = Trip(id=trip_id, name=payload.name, startDate=payload.startDate, organizerId=payload.organizerId, createdAt=datetime.now(timezone.utc))
    store["trips"][trip.id] = trip
    return trip


@router.get("/{trip_id}", response_model=Trip)
def get_trip(trip_id: str):
    trip = store["trips"].get(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

