-- =====================================================
-- Check Auth Settings and Fix Foreign Key Issue
-- =====================================================

-- Check if there are any users in auth.users
SELECT
    '=== USERS IN AUTH.USERS ===' as section;

SELECT
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Check if email confirmation is required
-- We can't directly query Supabase settings, but we can see if users have null email_confirmed_at

SELECT
    '=== CHECKING EMAIL CONFIRMATION ===' as section;

SELECT
    email,
    CASE
        WHEN email_confirmed_at IS NULL THEN 'NOT CONFIRMED'
        ELSE 'CONFIRMED'
    END as confirmation_status
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Temporarily make the foreign key constraint DEFERRABLE
-- This allows the transaction to complete before checking the constraint
SELECT '=== MAKING FOREIGN KEY DEFERRABLE ===' as section;

ALTER TABLE public.organizations
DROP CONSTRAINT IF EXISTS organizations_created_by_fkey;

ALTER TABLE public.organizations
ADD CONSTRAINT organizations_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES auth.users(id)
ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

SELECT '✅ Foreign key constraint is now DEFERRABLE' as message;
SELECT 'This allows the user to be created before the organization in the same transaction.' as explanation;
SELECT 'Try signing up again!' as instruction;
