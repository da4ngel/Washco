-- Google OAuth Support Migration
-- Allow Google-only accounts (no password) and store Google user identifiers

-- Make password_hash nullable for Google-only accounts
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add Google ID for linking accounts
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;

-- Add avatar URL for Google profile pictures
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);

-- Index for fast Google ID lookups
CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
