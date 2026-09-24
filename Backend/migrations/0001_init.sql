-- migrations/0001_init.sql
CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  trip_id TEXT NOT NULL REFERENCES trips(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
