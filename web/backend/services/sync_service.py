from datetime import datetime, timezone
from ..models.completion import QuestCompletion
from ..models.report import Report
from ..models.vote import Vote
from ..models.quest import Quest


def merge_sync_payload(existing: dict, completions: list[QuestCompletion], votes: list[Vote], reports: list[Report], gps_logs: list[dict]) -> dict:
    existing.setdefault("completions", {}).update({item.id: item for item in completions})
    existing.setdefault("votes", {}).update({item.id: item for item in votes})
    existing.setdefault("reports", {}).update({item.id: item for item in reports})
    existing.setdefault("gpsLogs", {}).update({item["timestamp"]: item for item in gps_logs})
    existing["lastSyncAt"] = datetime.now(timezone.utc).isoformat()
    return existing

