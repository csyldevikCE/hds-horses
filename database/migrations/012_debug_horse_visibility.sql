-- =====================================================
-- Debug Horse Visibility for Hannell Dressage Stable
-- =====================================================

-- 1. Check the user and their organization
SELECT
    '=== USER AND ORGANIZATION ===' as section;

SELECT
    u.id as user_id,
    u.email,
    ou.organization_id,
    ou.role,
    o.name as organization_name
FROM auth.users u
JOIN public.organization_users ou ON ou.user_id = u.id
JOIN public.organizations o ON o.id = ou.organization_id
WHERE u.email = 'christoffer@hannelldressage.com';

-- 2. Check the horses for that organization
SELECT
    '=== HORSES IN ORGANIZATION ===' as section;

SELECT
    h.id,
    h.name,
    h.breed,
    h.organization_id,
    h.user_id,
    o.name as organization_name
FROM public.horses h
JOIN public.organizations o ON o.id = h.organization_id
WHERE o.name = 'Hannell Dressage Stable AB';

-- 3. Check if there's a mismatch
SELECT
    '=== CHECKING FOR MISMATCHES ===' as section;

SELECT
    h.id as horse_id,
    h.name as horse_name,
    h.organization_id as horse_org_id,
    ou.organization_id as user_org_id,
    CASE
        WHEN h.organization_id = ou.organization_id THEN '✅ MATCH'
        ELSE '❌ MISMATCH'
    END as status
FROM public.horses h
CROSS JOIN (
    SELECT organization_id
    FROM public.organization_users ou
    JOIN auth.users u ON u.id = ou.user_id
    WHERE u.email = 'christoffer@hannelldressage.com'
) ou
WHERE h.id IN (
    '13c46e01-3d5d-4edd-bfc3-f882e02a8327',
    '768c86ae-513b-4047-b361-b48866f310ed'
);

-- 4. Test the exact query that the app would use
SELECT
    '=== SIMULATING APP QUERY ===' as section;

SELECT
    h.id,
    h.name,
    h.breed,
    h.age,
    h.color
FROM public.horses h
WHERE h.organization_id = (
    SELECT ou.organization_id
    FROM public.organization_users ou
    JOIN auth.users u ON u.id = ou.user_id
    WHERE u.email = 'christoffer@hannelldressage.com'
)
ORDER BY h.created_at DESC;
