-- Migration: Add rate limiting table
-- Date: 2024-12-17
-- Description: Creates rate_limits table for tracking request attempts
--              Used by the rate-limit Edge Function
-- @see SEC-005 in TODO.md

-- ============================================================================
-- CREATE RATE LIMITS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What action is being rate limited
  action VARCHAR(50) NOT NULL,  -- login, signup, password_reset, share_link_password

  -- Who is being rate limited (IP address, email, or entity ID)
  identifier VARCHAR(255) NOT NULL,

  -- Current state
  attempts INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,  -- NULL if not blocked

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for looking up rate limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_action_identifier
ON rate_limits(action, identifier);

-- Index for cleaning up old entries
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start
ON rate_limits(window_start);

-- Unique constraint to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_unique
ON rate_limits(action, identifier, window_start);

-- ============================================================================
-- NO RLS - Service role access only
-- ============================================================================

-- Rate limits table is accessed only by Edge Functions using service role
-- No RLS needed as it's not user-facing

-- ============================================================================
-- CLEANUP FUNCTION: Remove old rate limit entries
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete entries older than 24 hours
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE rate_limits IS 'Tracks rate limiting state for authentication and sensitive operations. Used by the rate-limit Edge Function.';
COMMENT ON COLUMN rate_limits.action IS 'Type of action being limited: login, signup, password_reset, share_link_password';
COMMENT ON COLUMN rate_limits.identifier IS 'Identifier for rate limiting: IP address for auth, email for password reset, link ID for share links';
COMMENT ON COLUMN rate_limits.blocked_until IS 'If set, the identifier is blocked until this timestamp';
COMMENT ON FUNCTION cleanup_old_rate_limits IS 'Removes rate limit entries older than 24 hours. Should be called periodically via pg_cron or scheduled function.';
