-- =====================================================
-- Fix Infinite Recursion in organization_users RLS
-- =====================================================
-- The current policy causes infinite recursion because
-- it queries the same table it's protecting.
-- We'll replace it with a simple direct policy.
-- =====================================================

-- Drop ALL existing SELECT policies on organization_users
DROP POLICY IF EXISTS "Users can view org members" ON public.organization_users;
DROP POLICY IF EXISTS "Users can view own and org members" ON public.organization_users;
DROP POLICY IF EXISTS "Users can view own membership" ON public.organization_users;
DROP POLICY IF EXISTS "Users can view org members via function" ON public.organization_users;

-- Create a single, simple policy:
-- Users can ONLY see their own membership row
-- (This avoids recursion completely)
CREATE POLICY "Users can see their own membership"
ON public.organization_users FOR SELECT
USING (user_id = auth.uid());

-- For viewing OTHER members in the same org, we'll handle it differently:
-- Admins can see all members when they specifically query with organization_id
-- This is done through application logic, not RLS

-- Verify the policy
SELECT
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'organization_users'
ORDER BY cmd, policyname;

-- Test that it works (should return your membership)
SELECT
    id,
    organization_id,
    user_id,
    role,
    'SUCCESS - No recursion!' as status
FROM public.organization_users
WHERE user_id = auth.uid();

SELECT '✅ Infinite recursion fixed! Try signing up again.' as message;
