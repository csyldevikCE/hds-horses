-- Migration 021: Fix Share Link Public Access
-- Date: 2025-10-21
-- Description: Drop existing restrictive policies and create proper public access policies

-- First, drop all existing SELECT policies on share_links
DROP POLICY IF EXISTS "Users can view their organization's share links" ON public.share_links;
DROP POLICY IF EXISTS "Anyone can view share links by token" ON public.share_links;

-- Create new policies for share_links
-- Policy 1: Organization members can view all their share links
CREATE POLICY "Organization members can view their share links"
ON public.share_links FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE organization_users.organization_id = share_links.organization_id
    AND organization_users.user_id = auth.uid()
  )
);

-- Policy 2: Anyone (including anonymous) can view share links (for public sharing)
CREATE POLICY "Public can view share links"
ON public.share_links FOR SELECT
USING (true);

-- Drop existing SELECT policies on horses that might conflict
DROP POLICY IF EXISTS "Users can view their organization's horses" ON public.horses;
DROP POLICY IF EXISTS "Anyone can view horses through share links" ON public.horses;

-- Recreate horses policies
-- Policy 1: Organization members can view their horses
CREATE POLICY "Organization members can view their horses"
ON public.horses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE organization_users.organization_id = horses.organization_id
    AND organization_users.user_id = auth.uid()
  )
);

-- Policy 2: Anyone can view horses that have share links
CREATE POLICY "Public can view horses with share links"
ON public.horses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.share_links
    WHERE share_links.horse_id = horses.id
  )
);

-- Fix horse_images policies
DROP POLICY IF EXISTS "Users can view their organization's horse images" ON public.horse_images;
DROP POLICY IF EXISTS "Anyone can view horse images through share links" ON public.horse_images;

CREATE POLICY "Organization members can view horse images"
ON public.horse_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.horses
    JOIN public.organization_users ON organization_users.organization_id = horses.organization_id
    WHERE horses.id = horse_images.horse_id
    AND organization_users.user_id = auth.uid()
  )
);

CREATE POLICY "Public can view horse images with share links"
ON public.horse_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.share_links
    WHERE share_links.horse_id = horse_images.horse_id
  )
);

-- Fix horse_videos policies
DROP POLICY IF EXISTS "Users can view their organization's horse videos" ON public.horse_videos;
DROP POLICY IF EXISTS "Anyone can view horse videos through share links" ON public.horse_videos;

CREATE POLICY "Organization members can view horse videos"
ON public.horse_videos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.horses
    JOIN public.organization_users ON organization_users.organization_id = horses.organization_id
    WHERE horses.id = horse_videos.horse_id
    AND organization_users.user_id = auth.uid()
  )
);

CREATE POLICY "Public can view horse videos with share links"
ON public.horse_videos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.share_links
    WHERE share_links.horse_id = horse_videos.horse_id
  )
);

-- Fix competitions policies
DROP POLICY IF EXISTS "Users can view their organization's competitions" ON public.competitions;
DROP POLICY IF EXISTS "Anyone can view competitions through share links" ON public.competitions;

CREATE POLICY "Organization members can view competitions"
ON public.competitions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.horses
    JOIN public.organization_users ON organization_users.organization_id = horses.organization_id
    WHERE horses.id = competitions.horse_id
    AND organization_users.user_id = auth.uid()
  )
);

CREATE POLICY "Public can view competitions with share links"
ON public.competitions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.share_links
    WHERE share_links.horse_id = competitions.horse_id
  )
);
