CREATE TABLE moments (
    id TEXT PRIMARY KEY NOT NULL,
    body TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL CHECK (updated_at >= created_at)
);
CREATE INDEX moments_by_creation ON moments (created_at DESC, id DESC);
PRAGMA user_version = 1;
