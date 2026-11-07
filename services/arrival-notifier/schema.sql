CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS arrival_locks (visitor_key TEXT PRIMARY KEY, acquired_at INTEGER NOT NULL, lease TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS send_budget (id INTEGER PRIMARY KEY CHECK (id = 1), last_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS visitor_history (visitor_key TEXT PRIMARY KEY, first_seen INTEGER NOT NULL);
INSERT OR IGNORE INTO visitor_history (visitor_key, first_seen) SELECT visitor_key, acquired_at FROM arrival_locks;
