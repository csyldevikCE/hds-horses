-- =====================================================
-- Move Specific Horses to Hannell Dressage Stable AB
-- =====================================================

-- Show current state of the horses
SELECT
    '=== CURRENT HORSE STATUS ===' as section;

SELECT
    h.id,
    h.name,
    h.breed,
    h.organization_id,
    o.name as current_org_name,
    CASE
        WHEN h.organization_id = 'd9c0b512-a649-4757-9fe6-fd27014ec524' THEN '✅ ALREADY IN TARGET ORG'
        ELSE '❌ NEEDS TO BE MOVED'
    END as status
FROM public.horses h
LEFT JOIN public.organizations o ON o.id = h.organization_id
WHERE h.id IN (
    '13c46e01-3d5d-4edd-bfc3-f882e02a8327',
    '768c86ae-513b-4047-b361-b48866f310ed'
);

-- Show target organization
SELECT
    '=== TARGET ORGANIZATION ===' as section;

SELECT
    id,
    name,
    created_by,
    created_at
FROM public.organizations
WHERE id = 'd9c0b512-a649-4757-9fe6-fd27014ec524';

-- Get the user who owns the target organization
SELECT
    '=== ORGANIZATION OWNER ===' as section;

SELECT
    u.id as user_id,
    u.email
FROM auth.users u
JOIN public.organizations o ON o.created_by = u.id
WHERE o.id = 'd9c0b512-a649-4757-9fe6-fd27014ec524';

-- Update the horses to belong to the target organization
UPDATE public.horses
SET
    organization_id = 'd9c0b512-a649-4757-9fe6-fd27014ec524',
    user_id = (
        SELECT created_by
        FROM public.organizations
        WHERE id = 'd9c0b512-a649-4757-9fe6-fd27014ec524'
    )
WHERE id IN (
    '13c46e01-3d5d-4edd-bfc3-f882e02a8327',
    '768c86ae-513b-4047-b361-b48866f310ed'
);

-- Show updated horses with full details
SELECT
    '=== UPDATED HORSES ===' as section;

SELECT
    h.id,
    h.name,
    h.breed,
    h.age,
    h.color,
    o.name as organization_name,
    u.email as owner_email,
    '✅ SUCCESSFULLY MOVED' as status
FROM public.horses h
JOIN public.organizations o ON o.id = h.organization_id
JOIN auth.users u ON u.id = h.user_id
WHERE h.id IN (
    '13c46e01-3d5d-4edd-bfc3-f882e02a8327',
    '768c86ae-513b-4047-b361-b48866f310ed'
);

SELECT '✅ Horses successfully moved to Hannell Dressage Stable AB!' as message;
SELECT 'Refresh your browser to see them in your horses list' as next_step;
