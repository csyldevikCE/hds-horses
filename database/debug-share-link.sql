-- Quick Debug: Check if share link exists and test anonymous access
-- Run this in Supabase SQL Editor

-- Step 1: Check if the share link exists at all
SELECT
  'Share Link Exists?' as check,
  id,
  token,
  horse_id,
  recipient_name,
  link_type,
  expires_at,
  expires_at > NOW() as is_valid,
  shared_fields
FROM share_links
WHERE token = '3759uod4e08z4e9gqixiz8';

-- Step 2: Test if anon role can access it
SET LOCAL ROLE anon;
SELECT
  'Anon Can Access?' as check,
  *
FROM share_links
WHERE token = '3759uod4e08z4e9gqixiz8';
RESET ROLE;

-- Step 3: If the above returns nothing, check what policies exist
SELECT
  'Current RLS Policies' as check,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'share_links'
ORDER BY policyname;

-- Step 4: Check if anon has SELECT grant
SELECT
  'Anon Grants' as check,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'anon'
  AND table_schema = 'public'
  AND table_name = 'share_links';
