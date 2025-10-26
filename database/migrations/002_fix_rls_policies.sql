-- =====================================================
-- Fix RLS Policy for organization_users
-- =====================================================
-- The original policy had a circular dependency where users
-- couldn't read their own membership without already knowing
-- their organization. This fixes that issue.

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can view org members" ON public.organization_users;

-- Create new policy that allows users to:
-- 1. See their own membership (to know which org they're in)
-- 2. See other members of their organization
CREATE POLICY "Users can view own and org members"
ON public.organization_users FOR SELECT
USING (
    -- User can see their own membership
    user_id = auth.uid()
    OR
    -- User can see members of their organization
    organization_id IN (
        SELECT organization_id
        FROM public.organization_users
        WHERE user_id = auth.uid()
    )
);

-- Verify the policy was created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'organization_users';
