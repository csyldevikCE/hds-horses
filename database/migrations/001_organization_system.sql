-- =====================================================
-- HDS Horses - Organization Multi-Tenant Migration
-- =====================================================
-- This migration adds organization-based multi-tenancy with role-based access control
-- Run this in your Supabase SQL editor

-- =====================================================
-- 1. CREATE ORGANIZATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);

-- =====================================================
-- 2. CREATE ORGANIZATION_USERS TABLE (Memberships)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.organization_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'read_only')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure a user can only be in an organization once
    UNIQUE(organization_id, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_organization_users_org ON public.organization_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_user ON public.organization_users(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_role ON public.organization_users(organization_id, role);

-- =====================================================
-- 3. ADD ORGANIZATION_ID TO EXISTING TABLES
-- =====================================================

-- Add organization_id to horses table
ALTER TABLE public.horses
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create index for horses organization lookup
CREATE INDEX IF NOT EXISTS idx_horses_organization ON public.horses(organization_id);

-- Add organization_id to share_links table
ALTER TABLE public.share_links
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create index for share_links organization lookup
CREATE INDEX IF NOT EXISTS idx_share_links_organization ON public.share_links(organization_id);

-- =====================================================
-- 4. MIGRATION DATA - Move existing data to organizations
-- =====================================================

-- Create organizations for existing users (one org per user)
-- This is for backwards compatibility during migration
INSERT INTO public.organizations (name, created_by)
SELECT
    COALESCE(email, 'My Organization'),
    id
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.organizations WHERE created_by = auth.users.id
);

-- Create organization_users memberships for creators (as admins)
INSERT INTO public.organization_users (organization_id, user_id, role, invited_by)
SELECT
    o.id,
    o.created_by,
    'admin',
    o.created_by
FROM public.organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE organization_id = o.id AND user_id = o.created_by
);

-- Update horses to belong to the creator's organization
UPDATE public.horses h
SET organization_id = (
    SELECT o.id
    FROM public.organizations o
    WHERE o.created_by = h.user_id
    LIMIT 1
)
WHERE h.organization_id IS NULL;

-- Update share_links to belong to the creator's organization
UPDATE public.share_links sl
SET organization_id = (
    SELECT o.id
    FROM public.organizations o
    WHERE o.created_by = sl.created_by
    LIMIT 1
)
WHERE sl.organization_id IS NULL;

-- =====================================================
-- 5. ADD NOT NULL CONSTRAINTS (after data migration)
-- =====================================================

-- Make organization_id required on horses
ALTER TABLE public.horses
ALTER COLUMN organization_id SET NOT NULL;

-- Make organization_id required on share_links
ALTER TABLE public.share_links
ALTER COLUMN organization_id SET NOT NULL;

-- =====================================================
-- 6. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization_id(user_uuid UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT organization_id
    FROM public.organization_users
    WHERE user_id = user_uuid
    LIMIT 1;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_uuid UUID, org_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_users
        WHERE user_id = user_uuid
          AND organization_id = org_uuid
          AND role = 'admin'
    );
$$;

-- Function to check if user has access to organization
CREATE OR REPLACE FUNCTION public.user_has_org_access(user_uuid UUID, org_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_users
        WHERE user_id = user_uuid
          AND organization_id = org_uuid
    );
$$;

-- Function to count users by role in organization
CREATE OR REPLACE FUNCTION public.count_org_users_by_role(org_uuid UUID, user_role TEXT)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.organization_users
    WHERE organization_id = org_uuid
      AND role = user_role;
$$;

-- =====================================================
-- 7. DROP OLD RLS POLICIES
-- =====================================================

-- Drop existing RLS policies on horses
DROP POLICY IF EXISTS "Users can view their own horses" ON public.horses;
DROP POLICY IF EXISTS "Users can insert their own horses" ON public.horses;
DROP POLICY IF EXISTS "Users can update their own horses" ON public.horses;
DROP POLICY IF EXISTS "Users can delete their own horses" ON public.horses;

-- Drop existing RLS policies on horse_images
DROP POLICY IF EXISTS "Users can view images of their horses" ON public.horse_images;
DROP POLICY IF EXISTS "Users can insert images for their horses" ON public.horse_images;
DROP POLICY IF EXISTS "Users can delete images of their horses" ON public.horse_images;
DROP POLICY IF EXISTS "Users can update images of their horses" ON public.horse_images;

-- Drop existing RLS policies on horse_videos
DROP POLICY IF EXISTS "Users can view videos of their horses" ON public.horse_videos;
DROP POLICY IF EXISTS "Users can insert videos for their horses" ON public.horse_videos;
DROP POLICY IF EXISTS "Users can delete videos of their horses" ON public.horse_videos;
DROP POLICY IF EXISTS "Users can update videos of their horses" ON public.horse_videos;

-- Drop existing RLS policies on competitions
DROP POLICY IF EXISTS "Users can view competitions for their horses" ON public.competitions;
DROP POLICY IF EXISTS "Users can insert competitions for their horses" ON public.competitions;
DROP POLICY IF EXISTS "Users can update competitions for their horses" ON public.competitions;
DROP POLICY IF EXISTS "Users can delete competitions for their horses" ON public.competitions;

-- Drop existing RLS policies on share_links
DROP POLICY IF EXISTS "Users can view their own share links" ON public.share_links;
DROP POLICY IF EXISTS "Users can create share links for their horses" ON public.share_links;
DROP POLICY IF EXISTS "Users can delete their own share links" ON public.share_links;
DROP POLICY IF EXISTS "Anyone can view valid share links" ON public.share_links;

-- =====================================================
-- 8. CREATE NEW RLS POLICIES - ORGANIZATIONS
-- =====================================================

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Users can view their own organization
CREATE POLICY "Users can view their organization"
ON public.organizations FOR SELECT
USING (
    id IN (
        SELECT organization_id
        FROM public.organization_users
        WHERE user_id = auth.uid()
    )
);

-- Only organization creators can update their organization
CREATE POLICY "Organization creators can update"
ON public.organizations FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Users can create organizations (for signup flow)
CREATE POLICY "Users can create organizations"
ON public.organizations FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Only creators can delete organizations
CREATE POLICY "Organization creators can delete"
ON public.organizations FOR DELETE
USING (created_by = auth.uid());

-- =====================================================
-- 9. CREATE NEW RLS POLICIES - ORGANIZATION_USERS
-- =====================================================

-- Enable RLS on organization_users
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

-- Users can view members of their organization
CREATE POLICY "Users can view org members"
ON public.organization_users FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id
        FROM public.organization_users
        WHERE user_id = auth.uid()
    )
);

-- Admins can invite users (insert)
CREATE POLICY "Admins can invite users"
ON public.organization_users FOR INSERT
WITH CHECK (
    public.is_user_admin(auth.uid(), organization_id)
    AND (
        -- Ensure we don't exceed limits: max 2 admins and 2 read_only
        (role = 'admin' AND public.count_org_users_by_role(organization_id, 'admin') < 2)
        OR
        (role = 'read_only' AND public.count_org_users_by_role(organization_id, 'read_only') < 2)
    )
);

-- Admins can update user roles
CREATE POLICY "Admins can update user roles"
ON public.organization_users FOR UPDATE
USING (
    public.is_user_admin(auth.uid(), organization_id)
)
WITH CHECK (
    public.is_user_admin(auth.uid(), organization_id)
    AND (
        -- Ensure we don't exceed limits when changing roles
        (role = 'admin' AND public.count_org_users_by_role(organization_id, 'admin') < 2)
        OR
        (role = 'read_only' AND public.count_org_users_by_role(organization_id, 'read_only') < 2)
        OR
        role = (SELECT role FROM public.organization_users WHERE id = organization_users.id)
    )
);

-- Admins can remove users
CREATE POLICY "Admins can remove users"
ON public.organization_users FOR DELETE
USING (
    public.is_user_admin(auth.uid(), organization_id)
);

-- =====================================================
-- 10. CREATE NEW RLS POLICIES - HORSES
-- =====================================================

-- Enable RLS on horses (should already be enabled)
ALTER TABLE public.horses ENABLE ROW LEVEL SECURITY;

-- All org members can view horses in their organization
CREATE POLICY "Org members can view horses"
ON public.horses FOR SELECT
USING (
    public.user_has_org_access(auth.uid(), organization_id)
);

-- Admins can insert horses
CREATE POLICY "Admins can create horses"
ON public.horses FOR INSERT
WITH CHECK (
    public.is_user_admin(auth.uid(), organization_id)
);

-- Admins can update horses
CREATE POLICY "Admins can update horses"
ON public.horses FOR UPDATE
USING (
    public.is_user_admin(auth.uid(), organization_id)
)
WITH CHECK (
    public.is_user_admin(auth.uid(), organization_id)
);

-- Admins can delete horses
CREATE POLICY "Admins can delete horses"
ON public.horses FOR DELETE
USING (
    public.is_user_admin(auth.uid(), organization_id)
);

-- =====================================================
-- 11. CREATE NEW RLS POLICIES - HORSE_IMAGES
-- =====================================================

-- Enable RLS on horse_images
ALTER TABLE public.horse_images ENABLE ROW LEVEL SECURITY;

-- Org members can view images of org horses
CREATE POLICY "Org members can view horse images"
ON public.horse_images FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.horses
        WHERE horses.id = horse_images.horse_id
          AND public.user_has_org_access(auth.uid(), horses.organization_id)
    )
);

-- Admins can insert images
CREATE POLICY "Admins can add horse images"
ON public.horse_images FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.horses
        WHERE horses.id = horse_images.horse_id
          AND public.is_user_admin(auth.uid(), horses.organization_id)
    )
);

-- Admins can update images
CREATE POLICY "Admins can update horse images"
ON public.horse_images FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.horses
        WHERE horses.id = horse_images.horse_id
          AND public.is_user_admin(auth.uid(), horses.organization_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.horses
        WHERE horses.id = horse_images.horse_id
          AND public.is_user_admin(auth.uid(), horses.organization_id)
    )
);

-- Admins can delete images
CREATE POLICY "Admins can delete horse images"
ON public.horse_images FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.horses
        WHERE horses.id = horse_images.horse_id
          AND public.is_user_admin(auth.uid(), horses.organization_id)
    )
);

-- =====================================================
-- 12. CREATE NEW RLS POLICIES - HORSE_VIDEOS
-- =====================================================

-- Enable RLS on horse_videos
ALTER TABLE public.horse_videos ENABLE ROW LEVEL SECURITY;

-- Org members can view videos of org horses
CREATE POLICY "Org members can view horse videos"
ON public.horse_videos FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.horses
        WHERE horses.id = horse_videos.horse_id
          AND public.user_has_org_access(auth.uid(), horses.organization_id)
    )
);

-- Admins can insert videos
CREATE POLICY "Admins can add horse videos"
ON public.horse_videos FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.horses
        WHERE horses.id = horse_videos.horse_id
          AND public.is_user_admin(auth.uid(), horses.organization_id)
    )
);

-- Admins can update videos
CREATE POLICY "Admins can update horse videos"
ON public.horse_videos FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.horses
        WHERE horses.id = horse_videos.horse_id
          AND public.is_user_admin(auth.uid(), horses.organization_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.horses
        WHERE horses.id = horse_videos.horse_id
          AND public.is_user_admin(auth.uid(), horses.organization_id)
    )
);

-- Admins can delete videos
CREATE POLICY "Admins can delete horse videos"
ON public.horse_videos FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.horses
        WHERE horses.id = horse_videos.horse_id
          AND public.is_user_admin(auth.uid(), horses.organization_id)
    )
);

-- =====================================================
-- 13. CREATE NEW RLS POLICIES - COMPETITIONS
-- =====================================================

-- Enable RLS on competitions
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

-- Org members can view competitions for org horses
CREATE POLICY "Org members can view competitions"
ON public.competitions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.horses
        WHERE horses.id = competitions.horse_id
          AND public.user_has_org_access(auth.uid(), horses.organization_id)
    )
);

-- Admins can insert competitions
CREATE POLICY "Admins can add competitions"
ON public.competitions FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.horses
        WHERE horses.id = competitions.horse_id
          AND public.is_user_admin(auth.uid(), horses.organization_id)
    )
);

-- Admins can update competitions
CREATE POLICY "Admins can update competitions"
ON public.competitions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.horses
        WHERE horses.id = competitions.horse_id
          AND public.is_user_admin(auth.uid(), horses.organization_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.horses
        WHERE horses.id = competitions.horse_id
          AND public.is_user_admin(auth.uid(), horses.organization_id)
    )
);

-- Admins can delete competitions
CREATE POLICY "Admins can delete competitions"
ON public.competitions FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.horses
        WHERE horses.id = competitions.horse_id
          AND public.is_user_admin(auth.uid(), horses.organization_id)
    )
);

-- =====================================================
-- 14. CREATE NEW RLS POLICIES - SHARE_LINKS
-- =====================================================

-- Enable RLS on share_links
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- Org members can view their org's share links
CREATE POLICY "Org members can view share links"
ON public.share_links FOR SELECT
USING (
    public.user_has_org_access(auth.uid(), organization_id)
    OR
    -- Public access for valid, non-expired links
    (expires_at > NOW())
);

-- Admins can create share links
CREATE POLICY "Admins can create share links"
ON public.share_links FOR INSERT
WITH CHECK (
    public.is_user_admin(auth.uid(), organization_id)
);

-- Admins can delete share links
CREATE POLICY "Admins can delete share links"
ON public.share_links FOR DELETE
USING (
    public.is_user_admin(auth.uid(), organization_id)
);

-- =====================================================
-- 15. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify migration results
SELECT 'Migration Complete!' as status;
SELECT COUNT(*) as organization_count FROM public.organizations;
SELECT COUNT(*) as membership_count FROM public.organization_users;
SELECT COUNT(*) as horses_with_org FROM public.horses WHERE organization_id IS NOT NULL;
