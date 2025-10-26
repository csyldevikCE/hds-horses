-- ============================================================================
-- Test Query: Check Your Share Link
-- ============================================================================
-- Run this in Supabase SQL Editor to diagnose the issue
-- Replace the token with your actual token from the URL
-- ============================================================================

-- Your token from the URL: http://localhost:8080/shared/3759uod4e08z4e9gqixiz8
-- Token is: 3759uod4e08z4e9gqixiz8

-- ============================================================================
-- TEST 1: Check if the share link exists (as admin)
-- ============================================================================
SELECT
  '🔍 Test 1: Checking if share link exists...' as test,
  id,
  token,
  horse_id,
  recipient_name,
  link_type,
  expires_at,
  view_count,
  max_views,
  shared_fields
FROM public.share_links
WHERE token = '3759uod4e08z4e9gqixiz8';

-- If this returns NO ROWS, your share link doesn't exist in the database
-- If this returns a row, continue to Test 2

-- ============================================================================
-- TEST 2: Check if anon role has permissions
-- ============================================================================
SELECT
  '🔑 Test 2: Checking anon role permissions...' as test,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'anon'
  AND table_schema = 'public'
  AND table_name IN ('share_links', 'horses', 'horse_images', 'horse_videos', 'competitions')
ORDER BY table_name;

-- Expected result: You should see SELECT permission for all these tables
-- If you don't see rows, run IMPORTANT_RUN_THIS_MIGRATION.sql

-- ============================================================================
-- TEST 3: Check RLS policies for anonymous access
-- ============================================================================
SELECT
  '🛡️ Test 3: Checking RLS policies...' as test,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('share_links', 'horses')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- Expected: You should see policies with {anon,authenticated} in the roles column

-- ============================================================================
-- TEST 4: Try accessing as anonymous user (THIS IS THE REAL TEST!)
-- ============================================================================
-- This simulates what happens when someone visits the share link

-- Switch to anon role to test
SET LOCAL ROLE anon;

-- Try to fetch the share link (this is what fails in your app)
SELECT
  '🎯 Test 4: Accessing as anonymous user...' as test,
  id,
  token,
  horse_id,
  recipient_name,
  link_type,
  expires_at
FROM public.share_links
WHERE token = '3759uod4e08z4e9gqixiz8';

-- If this returns NO ROWS, the RLS policy is blocking access
-- If this returns a row, check Test 5

-- Try to fetch the horse data
SELECT
  '🐴 Test 4b: Accessing horse as anonymous user...' as test,
  h.id,
  h.name,
  h.breed
FROM public.horses h
WHERE h.id = (
  SELECT horse_id FROM public.share_links WHERE token = '3759uod4e08z4e9gqixiz8'
);

-- Reset role back to admin
RESET ROLE;

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT '
✅ If all tests passed, the migration worked!
❌ If Test 1 failed: Create a share link first
❌ If Test 2 failed: Run IMPORTANT_RUN_THIS_MIGRATION.sql
❌ If Test 3 failed: Run IMPORTANT_RUN_THIS_MIGRATION.sql
❌ If Test 4 failed: Run IMPORTANT_RUN_THIS_MIGRATION.sql
' as summary;
