-- Migration 029: Add Write Policies for Share Links
-- Date: 2025-10-31
-- Description: Add INSERT, UPDATE, and DELETE policies for share_links table
--              Currently only SELECT policies exist, which blocks admins from creating/editing/deleting share links

-- =============================================================================
-- STEP 1: Add INSERT policy for share_links
-- =============================================================================

-- Allow authenticated organization admins to create share links
CREATE POLICY "share_links_insert_admin"
ON public.share_links
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.organization_id = share_links.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role = 'admin'
  )
);

-- =============================================================================
-- STEP 2: Add UPDATE policy for share_links
-- =============================================================================

-- Allow authenticated organization admins to update their share links
CREATE POLICY "share_links_update_admin"
ON public.share_links
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.organization_id = share_links.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.organization_id = share_links.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role = 'admin'
  )
);

-- =============================================================================
-- STEP 3: Add DELETE policy for share_links
-- =============================================================================

-- Allow authenticated organization admins to delete their share links
CREATE POLICY "share_links_delete_admin"
ON public.share_links
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.organization_id = share_links.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role = 'admin'
  )
);

-- =============================================================================
-- STEP 4: Verify policies
-- =============================================================================

-- This query will show all policies for share_links - run it to confirm
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'share_links'
ORDER BY cmd, policyname;
