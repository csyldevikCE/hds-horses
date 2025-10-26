-- Migration 022: Grant Anonymous Access to Share Links and Related Data
-- Date: 2025-10-21
-- Description: Explicitly grant SELECT permission to anonymous role for public sharing

-- Grant anonymous users SELECT access to share_links
GRANT SELECT ON public.share_links TO anon;

-- Grant anonymous users SELECT access to horses
GRANT SELECT ON public.horses TO anon;

-- Grant anonymous users SELECT access to horse_images
GRANT SELECT ON public.horse_images TO anon;

-- Grant anonymous users SELECT access to horse_videos
GRANT SELECT ON public.horse_videos TO anon;

-- Grant anonymous users SELECT access to competitions
GRANT SELECT ON public.competitions TO anon;

-- Grant anonymous users INSERT access to share_link_views (for tracking)
GRANT INSERT ON public.share_link_views TO anon;
GRANT SELECT ON public.share_link_views TO anon;
