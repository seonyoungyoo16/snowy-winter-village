CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS arrival_locks (visitor_key TEXT PRIMARY KEY, acquired_at INTEGER NOT NULL, lease TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS send_budget (id INTEGER PRIMARY KEY CHECK (id = 1), last_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS visitor_history (visitor_key TEXT PRIMARY KEY, first_seen INTEGER NOT NULL);
INSERT OR IGNORE INTO visitor_history (visitor_key, first_seen) SELECT visitor_key, acquired_at FROM arrival_locks;
CREATE TABLE IF NOT EXISTS connection_failures (
  room TEXT NOT NULL,
  event_key TEXT NOT NULL,
  occurred_at INTEGER NOT NULL,
  nickname TEXT,
  stage TEXT NOT NULL DEFAULT 'unknown',
  code TEXT NOT NULL DEFAULT 'UNKNOWN',
  PRIMARY KEY (room, event_key)
);
CREATE INDEX IF NOT EXISTS connection_failures_room_time ON connection_failures (room, occurred_at);
CREATE TABLE IF NOT EXISTS connection_alerts (room TEXT PRIMARY KEY, acquired_at INTEGER NOT NULL, lease TEXT NOT NULL);
