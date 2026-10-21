CREATE TABLE photos (
    id TEXT PRIMARY KEY NOT NULL,
    moment_id TEXT NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK(position BETWEEN 0 AND 5),
    width INTEGER NOT NULL CHECK(width > 0),
    height INTEGER NOT NULL CHECK(height > 0),
    image BLOB NOT NULL,
    thumbnail BLOB NOT NULL,
    UNIQUE(moment_id, position)
);
PRAGMA user_version = 2;
