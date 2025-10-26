-- =====================================================
-- Fix Organization INSERT RLS Policy
-- =====================================================
-- Users are unable to create organizations during signup
-- This fixes the INSERT policy
-- =====================================================

-- Drop existing INSERT policies on organizations
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;

-- Create a simple INSERT policy
-- Any authenticated user can create an organization where they are the creator
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Also ensure the INSERT policy for organization_users allows signup
DROP POLICY IF EXISTS "Admins can invite users" ON public.organization_users;

CREATE POLICY "Users can create org memberships"
ON public.organization_users FOR INSERT
TO authenticated
WITH CHECK (
    -- Allow if user is adding themselves (signup)
    user_id = auth.uid()
    OR
    -- Or if user is an admin inviting someone
    (
        EXISTS (
            SELECT 1 FROM public.organization_users ou
            WHERE ou.user_id = auth.uid()
            AND ou.organization_id = organization_id
            AND ou.role = 'admin'
        )
        AND (
            -- Enforce limits
            (role = 'admin' AND (SELECT COUNT(*) FROM public.organization_users WHERE organization_id = organization_users.organization_id AND role = 'admin') < 2)
            OR
            (role = 'read_only' AND (SELECT COUNT(*) FROM public.organization_users WHERE organization_id = organization_users.organization_id AND role = 'read_only') < 2)
        )
    )
);

-- Verify policies
SELECT
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename IN ('organizations', 'organization_users')
AND cmd = 'INSERT'
ORDER BY tablename, policyname;

SELECT '✅ Organization creation policies fixed! Try signing up again.' as message;
