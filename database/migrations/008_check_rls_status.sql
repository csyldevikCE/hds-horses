-- =====================================================
-- Check RLS Status and Temporarily Disable for Signup
-- =====================================================

-- Check if RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('organizations', 'organization_users');

-- Check current policies
SELECT
    tablename,
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('organizations', 'organization_users')
ORDER BY tablename, cmd;

-- TEMPORARY FIX: Disable RLS on organizations to allow signup
-- We'll re-enable it after we figure out the issue
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users DISABLE ROW LEVEL SECURITY;

SELECT '⚠️ RLS TEMPORARILY DISABLED on organizations and organization_users' as warning;
SELECT 'Try signing up now. This should work, then we can debug the RLS policies.' as instruction;

-- Show status
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('organizations', 'organization_users');
