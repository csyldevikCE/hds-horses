-- ============================================================================
-- CRITICAL: Enable Public Share Links for Anonymous Users
-- ============================================================================
-- This migration allows ANYONE (without an account) to view share links
-- Run this ENTIRE script in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Grant permissions to anonymous role
-- This allows unauthenticated users to view shared content
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.share_links TO anon;
GRANT SELECT ON public.horses TO anon;
GRANT SELECT ON public.horse_images TO anon;
GRANT SELECT ON public.horse_videos TO anon;
GRANT SELECT ON public.competitions TO anon;
GRANT SELECT, INSERT ON public.share_link_views TO anon;

-- Step 2: Create RLS policy for public share link access
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "share_links_select_public" ON public.share_links;

-- Create new policy that allows EVERYONE to view share links
CREATE POLICY "share_links_select_public"
ON public.share_links
FOR SELECT
TO anon, authenticated
USING (true);

-- Step 3: Create RLS policy for public horse access via share links
DROP POLICY IF EXISTS "horses_select_public" ON public.horses;

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

-- Step 4: Create RLS policies for related tables
DROP POLICY IF EXISTS "horse_images_select_public" ON public.horse_images;

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

DROP POLICY IF EXISTS "horse_videos_select_public" ON public.horse_videos;

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

DROP POLICY IF EXISTS "competitions_select_public" ON public.competitions;

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

-- Step 5: Verify the setup
SELECT 'Checking grants for anon role...' as status;

SELECT
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'anon'
  AND table_schema = 'public'
  AND table_name IN ('share_links', 'horses', 'horse_images', 'horse_videos', 'competitions', 'share_link_views')
ORDER BY table_name, privilege_type;

SELECT 'Checking RLS policies...' as status;

SELECT
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('share_links', 'horses', 'horse_images', 'horse_videos', 'competitions')
  AND cmd = 'SELECT'
  AND 'anon' = ANY(roles)
ORDER BY tablename, policyname;

SELECT '✅ Migration complete! Share links should now work for anonymous users.' as status;
