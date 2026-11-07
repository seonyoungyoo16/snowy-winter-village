ALTER TABLE connection_failures ADD COLUMN nickname TEXT;
ALTER TABLE connection_failures ADD COLUMN stage TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE connection_failures ADD COLUMN code TEXT NOT NULL DEFAULT 'UNKNOWN';
