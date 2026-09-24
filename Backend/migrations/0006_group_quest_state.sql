CREATE TABLE group_quest_assignments (
  theme_id TEXT PRIMARY KEY REFERENCES quest_themes(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL REFERENCES quest_variants(id),
  status TEXT NOT NULL CHECK(status IN ('unlocked','in_progress','completed','failed')),
  started_at INTEGER NOT NULL,
  completed_at INTEGER
);
