import os
from collections import defaultdict
from typing import Any


DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://localhost/suffer")

# The organizer hotspot uses this in-memory repository in local/offline mode.
# Swap the collections for SQLAlchemy repositories when deploying with Postgres.
store: dict[str, dict[str, Any]] = defaultdict(dict)

