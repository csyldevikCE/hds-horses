-- Diagnostic Script: Test Share Link Public Access
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if the share link exists
SELECT
  'Share Link Check' as test,
  id, token, horse_id, recipient_name, link_type, expires_at,
  CASE
    WHEN expires_at > NOW() THEN 'VALID'
    ELSE 'EXPIRED'
  END as status
FROM public.share_links
WHERE token = '3759uod4e08z4e9gqixiz8';

-- 2. Check if RLS is enabled on share_links table
SELECT
  'RLS Status' as test,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'share_links';

-- 3. List all RLS policies on share_links table
SELECT
  'RLS Policies on share_links' as test,
  policyname as policy_name,
  cmd as command,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'share_links';

-- 4. Check grants for anon role on share_links
SELECT
  'Grants for anon role' as test,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'anon'
  AND table_schema = 'public'
  AND table_name IN ('share_links', 'horses', 'horse_images', 'horse_videos', 'competitions', 'share_link_views')
ORDER BY table_name, privilege_type;

-- 5. Test anonymous access (simulates what the frontend does)
SET LOCAL ROLE anon;
SELECT
  'Anon Access Test' as test,
  id, token, horse_id, recipient_name, link_type,
  expires_at, shared_fields
FROM public.share_links
WHERE token = '3759uod4e08z4e9gqixiz8';
RESET ROLE;

-- 6. Check if the horse exists and can be accessed anonymously
SET LOCAL ROLE anon;
SELECT
  'Anon Horse Access Test' as test,
  h.id, h.name, h.breed
FROM public.horses h
WHERE EXISTS (
  SELECT 1 FROM public.share_links sl
  WHERE sl.horse_id = h.id
  AND sl.token = '3759uod4e08z4e9gqixiz8'
);
RESET ROLE;

-- Expected Results:
-- Test 1: Should show your share link data
-- Test 2: RLS should be TRUE
-- Test 3: Should show at least 2 policies: "Organization members can view their share links" and "Public can view share links"
-- Test 4: Should show SELECT grants for anon on all tables
-- Test 5: Should return the share link (if it returns nothing, RLS policies are blocking)
-- Test 6: Should return the horse data (if it returns nothing, RLS policies are blocking)
