-- =====================================================
-- Fix User Organization Setup
-- =====================================================
-- This script:
-- 1. Fixes the RLS policy circular dependency
-- 2. Checks if user has an organization
-- 3. Creates organization if missing
-- 4. Shows final status
-- =====================================================

-- STEP 1: Fix RLS Policy
-- =====================================================
DROP POLICY IF EXISTS "Users can view org members" ON public.organization_users;

CREATE POLICY "Users can view own and org members"
ON public.organization_users FOR SELECT
USING (
    user_id = auth.uid()
    OR
    organization_id IN (
        SELECT organization_id
        FROM public.organization_users
        WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- STEP 2: Check current user status
-- =====================================================
-- This will show all users and their organization status
SELECT
    u.id as user_id,
    u.email,
    ou.organization_id,
    ou.role,
    o.name as organization_name,
    CASE
        WHEN ou.organization_id IS NULL THEN '❌ NO ORGANIZATION'
        ELSE '✅ HAS ORGANIZATION'
    END as status
FROM auth.users u
LEFT JOIN public.organization_users ou ON ou.user_id = u.id
LEFT JOIN public.organizations o ON o.id = ou.organization_id
ORDER BY u.created_at DESC;

-- =====================================================
-- STEP 3: Create organization for users without one
-- =====================================================
-- This creates organizations for any users who don't have one

DO $$
DECLARE
    user_record RECORD;
    new_org_id UUID;
BEGIN
    -- Loop through users without organizations
    FOR user_record IN
        SELECT u.id, u.email
        FROM auth.users u
        LEFT JOIN public.organization_users ou ON ou.user_id = u.id
        WHERE ou.organization_id IS NULL
    LOOP
        RAISE NOTICE 'Creating organization for user: %', user_record.email;

        -- Create organization
        INSERT INTO public.organizations (name, created_by)
        VALUES (
            COALESCE(user_record.email, 'My Organization'),
            user_record.id
        )
        RETURNING id INTO new_org_id;

        -- Create membership with admin role
        INSERT INTO public.organization_users (organization_id, user_id, role, invited_by)
        VALUES (
            new_org_id,
            user_record.id,
            'admin',
            user_record.id
        );

        RAISE NOTICE 'Created organization % for user %', new_org_id, user_record.email;
    END LOOP;
END $$;

-- =====================================================
-- STEP 4: Update horses to belong to organizations
-- =====================================================
-- Connect any orphaned horses to their owner's organization

UPDATE public.horses h
SET organization_id = (
    SELECT ou.organization_id
    FROM public.organization_users ou
    WHERE ou.user_id = h.user_id
    LIMIT 1
)
WHERE h.organization_id IS NULL;

-- =====================================================
-- STEP 5: Update share_links to belong to organizations
-- =====================================================
-- Connect any orphaned share links to their creator's organization

UPDATE public.share_links sl
SET organization_id = (
    SELECT ou.organization_id
    FROM public.organization_users ou
    WHERE ou.user_id = sl.created_by
    LIMIT 1
)
WHERE sl.organization_id IS NULL;

-- =====================================================
-- FINAL STATUS REPORT
-- =====================================================
SELECT
    '=== FINAL STATUS ===' as report_section;

-- Show all users and their organizations
SELECT
    u.email as user_email,
    o.name as organization_name,
    ou.role as user_role,
    (SELECT COUNT(*) FROM public.horses WHERE organization_id = o.id) as horse_count
FROM auth.users u
JOIN public.organization_users ou ON ou.user_id = u.id
JOIN public.organizations o ON o.id = ou.organization_id
ORDER BY u.created_at DESC;

-- Show any remaining issues
SELECT
    '=== POTENTIAL ISSUES ===' as report_section;

-- Check for users without organizations
SELECT
    'Users without org: ' || COUNT(*)::TEXT as issue
FROM auth.users u
LEFT JOIN public.organization_users ou ON ou.user_id = u.id
WHERE ou.organization_id IS NULL;

-- Check for horses without organizations
SELECT
    'Horses without org: ' || COUNT(*)::TEXT as issue
FROM public.horses
WHERE organization_id IS NULL;

-- Check for share_links without organizations
SELECT
    'Share links without org: ' || COUNT(*)::TEXT as issue
FROM public.share_links
WHERE organization_id IS NULL;

-- =====================================================
-- DONE!
-- =====================================================
SELECT '✅ Migration complete! Please refresh your browser and try logging in again.' as message;
