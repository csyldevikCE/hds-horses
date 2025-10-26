-- =====================================================
-- Add Existing Horses to Hannell Dressage Stable AB
-- =====================================================

-- Show the current state of the horses
SELECT
    '=== CURRENT HORSE STATUS ===' as section;

SELECT
    h.id,
    h.name,
    h.breed,
    h.user_id,
    h.organization_id,
    CASE
        WHEN h.organization_id IS NULL THEN '❌ NO ORG'
        ELSE '✅ HAS ORG'
    END as status
FROM public.horses h
WHERE h.id IN (
    '13c46e01-3d5d-4edd-bfc3-f882e02a8327',
    '768c86ae-513b-4047-b361-b48866f310ed'
);

-- Find the Hannell Dressage Stable AB organization
SELECT
    '=== HANNELL DRESSAGE STABLE AB ===' as section;

SELECT
    o.id as organization_id,
    o.name as organization_name,
    u.email as owner_email
FROM public.organizations o
JOIN auth.users u ON u.id = o.created_by
WHERE o.name = 'Hannell Dressage Stable AB';

-- Update the horses to belong to Hannell Dressage Stable AB
UPDATE public.horses
SET
    organization_id = (
        SELECT id
        FROM public.organizations
        WHERE name = 'Hannell Dressage Stable AB'
    ),
    user_id = (
        SELECT created_by
        FROM public.organizations
        WHERE name = 'Hannell Dressage Stable AB'
    )
WHERE id IN (
    '13c46e01-3d5d-4edd-bfc3-f882e02a8327',
    '768c86ae-513b-4047-b361-b48866f310ed'
);

-- Show the updated horses
SELECT
    '=== UPDATED HORSES ===' as section;

SELECT
    h.id,
    h.name,
    h.breed,
    o.name as organization_name,
    u.email as owner_email,
    '✅ ADDED TO ORG' as status
FROM public.horses h
JOIN public.organizations o ON o.id = h.organization_id
JOIN auth.users u ON u.id = h.user_id
WHERE h.id IN (
    '13c46e01-3d5d-4edd-bfc3-f882e02a8327',
    '768c86ae-513b-4047-b361-b48866f310ed'
);

SELECT '✅ Horses added to Hannell Dressage Stable AB!' as message;
SELECT 'Refresh your browser and log in to see them!' as next_step;
