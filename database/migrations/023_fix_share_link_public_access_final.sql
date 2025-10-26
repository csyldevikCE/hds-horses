-- Migration 023: Final Fix for Share Link Public Access
-- Date: 2025-10-26
-- Description: Clean slate - drop all conflicting policies and create fresh ones

-- =============================================================================
-- STEP 1: Clean up all existing policies
-- =============================================================================

-- Drop ALL existing SELECT policies on share_links
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'share_links'
          AND cmd = 'SELECT'
    )
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.share_links';
    END LOOP;
END $$;

-- =============================================================================
-- STEP 2: Create new, simplified policies
-- =============================================================================

-- Policy 1: Allow authenticated organization members to view their org's links
CREATE POLICY "share_links_select_authenticated"
ON public.share_links
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.organization_id = share_links.organization_id
      AND ou.user_id = auth.uid()
  )
);

-- Policy 2: Allow EVERYONE (including anon) to view ANY share link
-- This is critical for public sharing
CREATE POLICY "share_links_select_public"
ON public.share_links
FOR SELECT
TO anon, authenticated
USING (true);

-- =============================================================================
-- STEP 3: Ensure anon role has SELECT grant
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.share_links TO anon;
GRANT SELECT ON public.horses TO anon;
GRANT SELECT ON public.horse_images TO anon;
GRANT SELECT ON public.horse_videos TO anon;
GRANT SELECT ON public.competitions TO anon;
GRANT SELECT, INSERT ON public.share_link_views TO anon;

-- =============================================================================
-- STEP 4: Ensure horses table has public access policies
-- =============================================================================

-- Drop and recreate horses SELECT policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'horses'
          AND cmd = 'SELECT'
    )
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.horses';
    END LOOP;
END $$;

-- Authenticated users can see their org's horses
CREATE POLICY "horses_select_authenticated"
ON public.horses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.organization_id = horses.organization_id
      AND ou.user_id = auth.uid()
  )
);

-- Everyone can see horses that have share links
CREATE POLICY "horses_select_public"
ON public.horses
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.share_links sl
    WHERE sl.horse_id = horses.id
  )
);

-- =============================================================================
-- STEP 5: Fix related tables (images, videos, competitions)
-- =============================================================================

-- Horse Images
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'horse_images'
          AND cmd = 'SELECT'
    )
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.horse_images';
    END LOOP;
END $$;

CREATE POLICY "horse_images_select_authenticated"
ON public.horse_images
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.horses h
    JOIN public.organization_users ou ON ou.organization_id = h.organization_id
    WHERE h.id = horse_images.horse_id
      AND ou.user_id = auth.uid()
  )
);

CREATE POLICY "horse_images_select_public"
ON public.horse_images
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.share_links sl
    WHERE sl.horse_id = horse_images.horse_id
  )
);

-- Horse Videos
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'horse_videos'
          AND cmd = 'SELECT'
    )
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.horse_videos';
    END LOOP;
END $$;

CREATE POLICY "horse_videos_select_authenticated"
ON public.horse_videos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.horses h
    JOIN public.organization_users ou ON ou.organization_id = h.organization_id
    WHERE h.id = horse_videos.horse_id
      AND ou.user_id = auth.uid()
  )
);

CREATE POLICY "horse_videos_select_public"
ON public.horse_videos
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.share_links sl
    WHERE sl.horse_id = horse_videos.horse_id
  )
);

-- Competitions
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'competitions'
          AND cmd = 'SELECT'
    )
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.competitions';
    END LOOP;
END $$;

CREATE POLICY "competitions_select_authenticated"
ON public.competitions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.horses h
    JOIN public.organization_users ou ON ou.organization_id = h.organization_id
    WHERE h.id = competitions.horse_id
      AND ou.user_id = auth.uid()
  )
);

CREATE POLICY "competitions_select_public"
ON public.competitions
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.share_links sl
    WHERE sl.horse_id = competitions.horse_id
  )
);

-- =============================================================================
-- STEP 6: Verify setup
-- =============================================================================

-- This query will show all policies - run it to confirm
SELECT
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('share_links', 'horses', 'horse_images', 'horse_videos', 'competitions')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- Show grants for anon
SELECT
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'anon'
  AND table_schema = 'public'
  AND table_name IN ('share_links', 'horses', 'horse_images', 'horse_videos', 'competitions', 'share_link_views')
ORDER BY table_name, privilege_type;
