-- =====================================================
-- Manually Verify Test User Email
-- =====================================================

-- Show the user before verification
SELECT
    id,
    email,
    email_confirmed_at,
    created_at,
    CASE
        WHEN email_confirmed_at IS NULL THEN '❌ NOT VERIFIED'
        ELSE '✅ VERIFIED'
    END as status
FROM auth.users
WHERE email = 'christoffer@hannelldressage.com';

-- Manually verify the email
UPDATE auth.users
SET
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'christoffer@hannelldressage.com';

-- Show the user after verification
SELECT
    id,
    email,
    email_confirmed_at,
    '✅ VERIFIED!' as status
FROM auth.users
WHERE email = 'christoffer@hannelldressage.com';

-- Show their organization details
SELECT
    u.email as user_email,
    o.name as organization_name,
    ou.role as user_role,
    o.id as organization_id
FROM auth.users u
JOIN public.organization_users ou ON ou.user_id = u.id
JOIN public.organizations o ON o.id = ou.organization_id
WHERE u.email = 'christoffer@hannelldressage.com';

SELECT '✅ christoffer@hannelldressage.com is now verified!' as message;
SELECT 'You can log in at http://localhost:8080/login' as next_step;
