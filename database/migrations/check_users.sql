-- Run this in Supabase SQL Editor to check your current users and organizations

-- Check all users
SELECT
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- Check organizations
SELECT * FROM public.organizations;

-- Check organization memberships
SELECT
    ou.*,
    o.name as organization_name
FROM public.organization_users ou
LEFT JOIN public.organizations o ON o.id = ou.organization_id
ORDER BY ou.created_at DESC;

-- Check horses and their organization
SELECT
    h.id,
    h.name,
    h.user_id,
    h.organization_id,
    o.name as organization_name
FROM public.horses h
LEFT JOIN public.organizations o ON o.id = h.organization_id
ORDER BY h.created_at DESC
LIMIT 10;
