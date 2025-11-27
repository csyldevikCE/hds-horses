-- Migration: Add organization contact info and contact persons
-- Date: 2024-11-27
-- Description: Adds contact information fields to organizations and creates
--              a contact_persons table for organization contacts

-- ============================================================================
-- UPDATE ORGANIZATIONS TABLE WITH CONTACT INFO
-- ============================================================================

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);

-- ============================================================================
-- CREATE CONTACT PERSONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR CONTACT PERSONS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organization_contacts_org_id
ON organization_contacts(organization_id);

-- ============================================================================
-- ROW LEVEL SECURITY FOR CONTACT PERSONS
-- ============================================================================

ALTER TABLE organization_contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view contacts for their organization
CREATE POLICY "Users can view their organization contacts"
ON organization_contacts FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
  )
);

-- Policy: Admins can insert contacts for their organization
CREATE POLICY "Admins can insert organization contacts"
ON organization_contacts FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_users
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admins can update contacts for their organization
CREATE POLICY "Admins can update organization contacts"
ON organization_contacts FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM organization_users
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admins can delete contacts for their organization
CREATE POLICY "Admins can delete organization contacts"
ON organization_contacts FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM organization_users
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- FUNCTION TO UPDATE updated_at TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION update_organization_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS organization_contacts_updated_at ON organization_contacts;
CREATE TRIGGER organization_contacts_updated_at
  BEFORE UPDATE ON organization_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_contacts_updated_at();
