-- =====================================================
-- Create Organizations for Users Without Them
-- =====================================================
-- This script creates organizations for any users who don't have one
-- (Skip the RLS policy update since it's already fixed)
-- =====================================================

-- =====================================================
-- STEP 1: Check current user status
-- =====================================================
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
-- STEP 2: Create organization for users without one
-- =====================================================

DO $$
DECLARE
    user_record RECORD;
    new_org_id UUID;
    users_fixed INTEGER := 0;
BEGIN
    -- Loop through users without organizations
    FOR user_record IN
        SELECT u.id, u.email
        FROM auth.users u
        LEFT JOIN public.organization_users ou ON ou.user_id = u.id
        WHERE ou.organization_id IS NULL
    LOOP
        RAISE NOTICE 'Creating organization for user: %', user_record.email;

        -- Create organization (use email or default name)
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

        users_fixed := users_fixed + 1;
        RAISE NOTICE '✅ Created organization % for user %', new_org_id, user_record.email;
    END LOOP;

    IF users_fixed = 0 THEN
        RAISE NOTICE '✅ All users already have organizations!';
    ELSE
        RAISE NOTICE '✅ Created organizations for % user(s)', users_fixed;
    END IF;
END $$;

-- =====================================================
-- STEP 3: Update horses to belong to organizations
-- =====================================================

UPDATE public.horses h
SET organization_id = (
    SELECT ou.organization_id
    FROM public.organization_users ou
    WHERE ou.user_id = h.user_id
    LIMIT 1
)
WHERE h.organization_id IS NULL;

-- =====================================================
-- STEP 4: Update share_links to belong to organizations
-- =====================================================

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

SELECT '===============================================' as divider;
SELECT '           FINAL STATUS REPORT                 ' as title;
SELECT '===============================================' as divider;

-- Show all users and their organizations
SELECT
    u.email as user_email,
    o.name as organization_name,
    ou.role as user_role,
    (SELECT COUNT(*) FROM public.horses WHERE organization_id = o.id) as horse_count,
    (SELECT COUNT(*) FROM public.organization_users WHERE organization_id = o.id) as team_size
FROM auth.users u
LEFT JOIN public.organization_users ou ON ou.user_id = u.id
LEFT JOIN public.organizations o ON o.id = ou.organization_id
ORDER BY u.created_at DESC;

-- Check for any remaining issues
SELECT '===============================================' as divider;
SELECT '           HEALTH CHECK                        ' as title;
SELECT '===============================================' as divider;

SELECT
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM public.organizations) as total_organizations,
    (SELECT COUNT(*) FROM public.organization_users) as total_memberships,
    (SELECT COUNT(*) FROM public.horses) as total_horses,
    (SELECT COUNT(*) FROM public.horses WHERE organization_id IS NULL) as horses_without_org,
    (SELECT COUNT(*) FROM auth.users u
     LEFT JOIN public.organization_users ou ON ou.user_id = u.id
     WHERE ou.organization_id IS NULL) as users_without_org;

-- =====================================================
-- DONE!
-- =====================================================
SELECT '✅ Migration complete! Refresh your browser and try logging in.' as message;
