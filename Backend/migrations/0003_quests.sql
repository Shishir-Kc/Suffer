CREATE TABLE quest_themes (
 id TEXT PRIMARY KEY, trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
 track TEXT NOT NULL CHECK(track IN ('individual','group')), sequence_order INTEGER NOT NULL,
 trigger_point INTEGER NOT NULL, type TEXT NOT NULL CHECK(type IN ('LBQ','VBQ','TBQ')), title TEXT NOT NULL,
 UNIQUE(trip_id, track, sequence_order)
);
CREATE TABLE quest_variants (
 id TEXT PRIMARY KEY, theme_id TEXT NOT NULL REFERENCES quest_themes(id) ON DELETE CASCADE,
 description TEXT NOT NULL, target_lat REAL, target_lng REAL, radius_meters REAL NOT NULL DEFAULT 50, timer_seconds INTEGER
);
CREATE TABLE quest_assignments (
 id TEXT PRIMARY KEY, theme_id TEXT NOT NULL REFERENCES quest_themes(id), variant_id TEXT NOT NULL REFERENCES quest_variants(id),
 user_id TEXT NOT NULL REFERENCES users(id), status TEXT NOT NULL CHECK(status IN ('unlocked','in_progress','completed','failed')),
 started_at INTEGER NOT NULL, completed_at INTEGER, UNIQUE(theme_id,user_id)
);
CREATE TABLE votes (
 id TEXT PRIMARY KEY, assignment_id TEXT NOT NULL REFERENCES quest_assignments(id) ON DELETE CASCADE,
 voter_id TEXT NOT NULL REFERENCES users(id), approve INTEGER NOT NULL CHECK(approve IN (0,1)), created_at INTEGER NOT NULL,
 UNIQUE(assignment_id,voter_id)
);
CREATE TABLE final_quest_candidates (id TEXT PRIMARY KEY, trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE, description TEXT NOT NULL);
CREATE TABLE final_quest_assignments (
 id TEXT PRIMARY KEY, trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id), candidate_id TEXT NOT NULL REFERENCES final_quest_candidates(id),
 started_at INTEGER, completed_at INTEGER, UNIQUE(trip_id,user_id)
);
CREATE INDEX quest_themes_trip_track_order ON quest_themes(trip_id,track,sequence_order);
CREATE INDEX quest_assignments_user ON quest_assignments(user_id,status);
