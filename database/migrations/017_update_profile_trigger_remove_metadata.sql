-- =====================================================
-- Update Profile Trigger - Remove User Metadata Dependency
-- =====================================================
-- This migration updates the profile creation trigger to NOT pull
-- from auth user_metadata, since we're consolidating to profiles table only

-- Drop the old trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the function to create empty profiles (not from metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create empty profile (users will fill in names later)
    INSERT INTO public.profiles (id, first_name, last_name)
    VALUES (NEW.id, NULL, NULL)
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Verify the function was updated
SELECT '✅ Profile trigger updated to remove user metadata dependency' as message;

-- Show the current function definition
SELECT
    '=== Updated Function Definition ===' as section,
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';
