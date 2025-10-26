-- =====================================================
-- Add Foreign Key: organization_users → profiles
-- =====================================================
-- This establishes a direct FK relationship between
-- organization_users and profiles, enabling proper JOINs
-- and eliminating the need for separate queries + JavaScript merging

-- Step 1: Verify all organization_users have corresponding profiles
-- (This should pass because profiles are auto-created on signup)
DO $$
DECLARE
    missing_profiles INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_profiles
    FROM public.organization_users ou
    WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = ou.user_id
    );

    IF missing_profiles > 0 THEN
        RAISE NOTICE '⚠️  Found % organization_users without profiles. Creating them now...', missing_profiles;

        -- Create missing profiles
        INSERT INTO public.profiles (id, first_name, last_name)
        SELECT DISTINCT
            ou.user_id,
            u.raw_user_meta_data->>'first_name',
            u.raw_user_meta_data->>'last_name'
        FROM public.organization_users ou
        LEFT JOIN auth.users u ON u.id = ou.user_id
        WHERE NOT EXISTS (
            SELECT 1 FROM public.profiles p WHERE p.id = ou.user_id
        );

        RAISE NOTICE '✅ Created missing profiles';
    ELSE
        RAISE NOTICE '✅ All organization_users have corresponding profiles';
    END IF;
END $$;

-- Step 2: Add the foreign key constraint
-- This creates a direct relationship: organization_users.user_id → profiles.id
ALTER TABLE public.organization_users
ADD CONSTRAINT fk_organization_users_profile
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 3: Verify the constraint was added
SELECT
    '✅ Foreign key constraint added successfully!' as status,
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as references_table
FROM pg_constraint
WHERE conname = 'fk_organization_users_profile';

-- Step 4: Test the relationship with a sample JOIN
SELECT
    '=== Testing JOIN capability ===' as section;

SELECT
    ou.id,
    ou.role,
    p.first_name,
    p.last_name,
    CASE
        WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL
            THEN p.first_name || ' ' || p.last_name
        WHEN p.first_name IS NOT NULL
            THEN p.first_name
        WHEN p.last_name IS NOT NULL
            THEN p.last_name
        ELSE 'Unknown'
    END as display_name
FROM public.organization_users ou
LEFT JOIN public.profiles p ON p.id = ou.user_id
LIMIT 5;

SELECT '✅ Migration complete! You can now use direct JOINs in queries.' as message;
