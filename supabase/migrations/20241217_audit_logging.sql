-- Migration: Add audit logging for sensitive operations
-- Date: 2024-12-17
-- Description: Creates audit_log table and triggers for tracking sensitive operations
--              Required for security investigations and GDPR compliance

-- ============================================================================
-- CREATE AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Who performed the action
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- What action was performed
  action VARCHAR(50) NOT NULL,  -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, etc.
  entity_type VARCHAR(50),      -- horse, share_link, user, vaccination, etc.
  entity_id UUID,               -- ID of the affected entity

  -- What changed (for UPDATE operations)
  old_value JSONB,              -- Previous state (nullable for CREATE/DELETE)
  new_value JSONB,              -- New state (nullable for DELETE)

  -- Additional context
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,               -- Any additional context-specific data

  -- For compliance: mark if contains PII (for retention policies)
  contains_pii BOOLEAN DEFAULT false
);

-- ============================================================================
-- INDEXES FOR AUDIT LOG
-- ============================================================================

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id
ON audit_log(user_id);

-- Index for querying by organization
CREATE INDEX IF NOT EXISTS idx_audit_log_organization_id
ON audit_log(organization_id);

-- Index for querying by entity
CREATE INDEX IF NOT EXISTS idx_audit_log_entity
ON audit_log(entity_type, entity_id);

-- Index for querying by action
CREATE INDEX IF NOT EXISTS idx_audit_log_action
ON audit_log(action);

-- Index for time-based queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp
ON audit_log(timestamp DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_org_timestamp
ON audit_log(organization_id, timestamp DESC);

-- ============================================================================
-- ROW LEVEL SECURITY FOR AUDIT LOG
-- ============================================================================

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs for their organization
CREATE POLICY "Admins can view their organization audit logs"
ON audit_log FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_users
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Nobody can modify audit logs directly (immutable for compliance)
-- Logs are only created by triggers and service role

-- ============================================================================
-- FUNCTION: Log audit event (called by triggers and Edge Functions)
-- ============================================================================

CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_organization_id UUID,
  p_action VARCHAR(50),
  p_entity_type VARCHAR(50),
  p_entity_id UUID,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_contains_pii BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with elevated privileges
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_log (
    user_id,
    organization_id,
    action,
    entity_type,
    entity_id,
    old_value,
    new_value,
    ip_address,
    user_agent,
    metadata,
    contains_pii
  ) VALUES (
    p_user_id,
    p_organization_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_value,
    p_new_value,
    p_ip_address,
    p_user_agent,
    p_metadata,
    p_contains_pii
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- ============================================================================
-- TRIGGER FUNCTION: Log horse changes
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_horse_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action VARCHAR(50);
  v_old_value JSONB;
  v_new_value JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'CREATE';
    v_new_value := to_jsonb(NEW);

    PERFORM log_audit_event(
      NEW.user_id,
      NEW.organization_id,
      v_action,
      'horse',
      NEW.id,
      NULL,
      v_new_value,
      NULL,
      NULL,
      jsonb_build_object('horse_name', NEW.name),
      false
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_old_value := to_jsonb(OLD);
    v_new_value := to_jsonb(NEW);

    PERFORM log_audit_event(
      NEW.user_id,
      NEW.organization_id,
      v_action,
      'horse',
      NEW.id,
      v_old_value,
      v_new_value,
      NULL,
      NULL,
      jsonb_build_object('horse_name', NEW.name),
      false
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_old_value := to_jsonb(OLD);

    PERFORM log_audit_event(
      OLD.user_id,
      OLD.organization_id,
      v_action,
      'horse',
      OLD.id,
      v_old_value,
      NULL,
      NULL,
      NULL,
      jsonb_build_object('horse_name', OLD.name),
      false
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- Create trigger for horses table
DROP TRIGGER IF EXISTS audit_horses_trigger ON horses;
CREATE TRIGGER audit_horses_trigger
  AFTER INSERT OR UPDATE OR DELETE ON horses
  FOR EACH ROW
  EXECUTE FUNCTION audit_horse_changes();

-- ============================================================================
-- TRIGGER FUNCTION: Log share link changes
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_share_link_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action VARCHAR(50);
  v_old_value JSONB;
  v_new_value JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'CREATE';
    -- Exclude password_hash from logged data for security
    v_new_value := to_jsonb(NEW) - 'password_hash';

    PERFORM log_audit_event(
      NEW.created_by,
      NEW.organization_id,
      v_action,
      'share_link',
      NEW.id,
      NULL,
      v_new_value,
      NULL,
      NULL,
      jsonb_build_object(
        'recipient_name', NEW.recipient_name,
        'link_type', NEW.link_type,
        'horse_id', NEW.horse_id
      ),
      true  -- Contains PII (recipient name)
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_old_value := to_jsonb(OLD) - 'password_hash';

    PERFORM log_audit_event(
      OLD.created_by,
      OLD.organization_id,
      v_action,
      'share_link',
      OLD.id,
      v_old_value,
      NULL,
      NULL,
      NULL,
      jsonb_build_object(
        'recipient_name', OLD.recipient_name,
        'link_type', OLD.link_type
      ),
      true
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- Create trigger for share_links table
DROP TRIGGER IF EXISTS audit_share_links_trigger ON share_links;
CREATE TRIGGER audit_share_links_trigger
  AFTER INSERT OR DELETE ON share_links
  FOR EACH ROW
  EXECUTE FUNCTION audit_share_link_changes();

-- ============================================================================
-- TRIGGER FUNCTION: Log organization user changes (invitations, role changes)
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_organization_user_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action VARCHAR(50);
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'USER_ADDED';

    PERFORM log_audit_event(
      NEW.user_id,
      NEW.organization_id,
      v_action,
      'organization_user',
      NEW.id,
      NULL,
      to_jsonb(NEW),
      NULL,
      NULL,
      jsonb_build_object('role', NEW.role),
      false
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if role changed
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      v_action := 'ROLE_CHANGED';

      PERFORM log_audit_event(
        NEW.user_id,
        NEW.organization_id,
        v_action,
        'organization_user',
        NEW.id,
        to_jsonb(OLD),
        to_jsonb(NEW),
        NULL,
        NULL,
        jsonb_build_object(
          'old_role', OLD.role,
          'new_role', NEW.role
        ),
        false
      );
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'USER_REMOVED';

    PERFORM log_audit_event(
      OLD.user_id,
      OLD.organization_id,
      v_action,
      'organization_user',
      OLD.id,
      to_jsonb(OLD),
      NULL,
      NULL,
      NULL,
      jsonb_build_object('role', OLD.role),
      false
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- Create trigger for organization_users table
DROP TRIGGER IF EXISTS audit_organization_users_trigger ON organization_users;
CREATE TRIGGER audit_organization_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON organization_users
  FOR EACH ROW
  EXECUTE FUNCTION audit_organization_user_changes();

-- ============================================================================
-- FUNCTION: Query audit logs (for admin UI)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_organization_audit_logs(
  p_organization_id UUID,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0,
  p_action VARCHAR(50) DEFAULT NULL,
  p_entity_type VARCHAR(50) DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  timestamp TIMESTAMPTZ,
  user_id UUID,
  action VARCHAR(50),
  entity_type VARCHAR(50),
  entity_id UUID,
  metadata JSONB,
  user_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the caller is an admin of the organization
  IF NOT EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_id = p_organization_id
      AND user_id = auth.uid()
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    al.id,
    al.timestamp,
    al.user_id,
    al.action,
    al.entity_type,
    al.entity_id,
    al.metadata,
    au.email AS user_email
  FROM audit_log al
  LEFT JOIN auth.users au ON al.user_id = au.id
  WHERE al.organization_id = p_organization_id
    AND (p_action IS NULL OR al.action = p_action)
    AND (p_entity_type IS NULL OR al.entity_type = p_entity_type)
    AND (p_start_date IS NULL OR al.timestamp >= p_start_date)
    AND (p_end_date IS NULL OR al.timestamp <= p_end_date)
  ORDER BY al.timestamp DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE audit_log IS 'Immutable audit trail for sensitive operations. Used for security investigations and GDPR compliance.';
COMMENT ON COLUMN audit_log.action IS 'Action type: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, USER_ADDED, USER_REMOVED, ROLE_CHANGED, etc.';
COMMENT ON COLUMN audit_log.entity_type IS 'Type of entity affected: horse, share_link, organization_user, vaccination, etc.';
COMMENT ON COLUMN audit_log.contains_pii IS 'Flag indicating if this log entry contains personally identifiable information. Used for data retention policies.';
COMMENT ON FUNCTION log_audit_event IS 'Creates an audit log entry. Called by triggers and Edge Functions.';
COMMENT ON FUNCTION get_organization_audit_logs IS 'Returns paginated audit logs for an organization. Only accessible to admins.';
