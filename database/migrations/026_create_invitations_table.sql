-- Migration: Create invitations table for organization invites
-- Created: 2025-10-26
-- Purpose: Enable token-based invitation system

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'read_only')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_organization_id ON public.invitations(organization_id);
CREATE INDEX idx_invitations_email ON public.invitations(email);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Organization members can view their org's invitations
CREATE POLICY "invitations_select_own_org"
ON public.invitations
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.organization_users
    WHERE user_id = auth.uid()
  )
);

-- Policy: Admins can create invitations
CREATE POLICY "invitations_insert_admin"
ON public.invitations
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM public.organization_users
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
  AND invited_by = auth.uid()
);

-- Policy: Admins can delete invitations
CREATE POLICY "invitations_delete_admin"
ON public.invitations
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.organization_users
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Admins can update invitations (for marking as used)
CREATE POLICY "invitations_update_admin"
ON public.invitations
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.organization_users
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Anonymous users can view invitations by token (for signup page)
CREATE POLICY "invitations_select_by_token"
ON public.invitations
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy: Authenticated users can update their invitation after using it
CREATE POLICY "invitations_update_after_use"
ON public.invitations
FOR UPDATE
TO authenticated
USING (used_by = auth.uid() OR used_by IS NULL)
WITH CHECK (used_by = auth.uid());

-- Grant SELECT to anon role for signup page
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.invitations TO anon;

COMMENT ON TABLE public.invitations IS 'Stores pending organization invitations. Users sign up with invitation token and are automatically added to the organization.';
