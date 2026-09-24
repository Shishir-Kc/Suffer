ALTER TABLE trips ADD COLUMN organizer_id TEXT REFERENCES users(id);
ALTER TABLE trips ADD COLUMN join_code TEXT;
ALTER TABLE trips ADD COLUMN final_quest_trigger INTEGER;
ALTER TABLE users ADD COLUMN username TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN is_organizer INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX users_username_unique ON users(username) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX trips_join_code_unique ON trips(join_code) WHERE join_code IS NOT NULL;
