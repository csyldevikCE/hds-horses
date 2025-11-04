-- =====================================================
-- HDS Horses - Increase Admin Limit from 2 to 4
-- =====================================================
-- This migration updates the organization user limits to allow 4 admins
-- Run this in your Supabase SQL Editor

-- =====================================================
-- DROP EXISTING POLICIES THAT ENFORCE 2 ADMIN LIMIT
-- =====================================================

DROP POLICY IF EXISTS "Admins can invite users" ON public.organization_users;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.organization_users;

-- =====================================================
-- CREATE NEW POLICIES WITH 4 ADMIN LIMIT
-- =====================================================

-- Admins can invite users (max 4 admins, 2 read_only)
CREATE POLICY "Admins can invite users"
ON public.organization_users FOR INSERT
WITH CHECK (
    public.is_user_admin(auth.uid(), organization_id)
    AND (
        -- Ensure we don't exceed limits: max 4 admins and 2 read_only
        (role = 'admin' AND public.count_org_users_by_role(organization_id, 'admin') < 4)
        OR
        (role = 'read_only' AND public.count_org_users_by_role(organization_id, 'read_only') < 2)
    )
);

-- Admins can update user roles (max 4 admins, 2 read_only)
CREATE POLICY "Admins can update user roles"
ON public.organization_users FOR UPDATE
USING (
    public.is_user_admin(auth.uid(), organization_id)
)
WITH CHECK (
    public.is_user_admin(auth.uid(), organization_id)
    AND (
        -- Ensure we don't exceed limits when changing roles
        (role = 'admin' AND public.count_org_users_by_role(organization_id, 'admin') < 4)
        OR
        (role = 'read_only' AND public.count_org_users_by_role(organization_id, 'read_only') < 2)
        OR
        role = (SELECT role FROM public.organization_users WHERE id = organization_users.id)
    )
);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

SELECT 'Admin limit increased to 4!' as status;
