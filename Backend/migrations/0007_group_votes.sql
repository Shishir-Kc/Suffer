CREATE TABLE group_votes (
  id TEXT PRIMARY KEY,
  theme_id TEXT NOT NULL REFERENCES quest_themes(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL REFERENCES users(id),
  approve INTEGER NOT NULL CHECK(approve IN (0,1)),
  created_at INTEGER NOT NULL,
  UNIQUE(theme_id,voter_id)
);
