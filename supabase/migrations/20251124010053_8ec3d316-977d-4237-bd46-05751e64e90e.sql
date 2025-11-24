-- Add encrypted token columns to calendar_connections table
ALTER TABLE calendar_connections 
ADD COLUMN IF NOT EXISTS encrypted_access_token TEXT,
ADD COLUMN IF NOT EXISTS encrypted_refresh_token TEXT;

-- Update token_expires_at to be nullable (it already exists from schema)
-- Add index for token refresh operations
CREATE INDEX IF NOT EXISTS idx_calendar_connections_expires_at 
ON calendar_connections(token_expires_at) 
WHERE is_active = true;