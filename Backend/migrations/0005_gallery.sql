CREATE TABLE face_enrollments (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  embedding_json TEXT NOT NULL,
  enrolled_at INTEGER NOT NULL
);
CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  uploader_id TEXT NOT NULL REFERENCES users(id),
  trip_id TEXT NOT NULL REFERENCES trips(id),
  storage_key TEXT NOT NULL UNIQUE,
  storage_file_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  processing_status TEXT NOT NULL CHECK(processing_status IN ('processing','complete')) DEFAULT 'processing'
);
CREATE TABLE photo_tags (
  id TEXT PRIMARY KEY,
  photo_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  UNIQUE(photo_id,user_id)
);
CREATE TABLE photo_jobs (
  id TEXT PRIMARY KEY,
  photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  attempts INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('pending','processing','complete','abandoned')) DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE gallery_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  photo_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('photo_tagged')),
  created_at INTEGER NOT NULL
);
CREATE INDEX photos_trip_created ON photos(trip_id,created_at DESC);
CREATE INDEX tags_user ON photo_tags(user_id,photo_id);
CREATE INDEX gallery_events_trip_id ON gallery_events(trip_id,id);
