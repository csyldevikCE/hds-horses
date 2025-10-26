-- Migration 018: Enhance Share Links with Multiple Link Types and Customizable Content
-- Date: 2025-10-21
-- Description: Add support for one-time links, password-protected links, custom expiry times, and customizable shared fields

-- Add new columns to share_links table
ALTER TABLE public.share_links
ADD COLUMN link_type TEXT DEFAULT 'standard' CHECK (link_type IN ('standard', 'one_time', 'password_protected')),
ADD COLUMN password_hash TEXT,
ADD COLUMN view_count INTEGER DEFAULT 0,
ADD COLUMN max_views INTEGER,
ADD COLUMN shared_fields JSONB DEFAULT '["basic_info", "description", "pedigree", "training", "competitions", "images", "videos"]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.share_links.link_type IS 'Type of share link: standard (time-based), one_time (single view), password_protected';
COMMENT ON COLUMN public.share_links.password_hash IS 'Bcrypt hash of password for password-protected links';
COMMENT ON COLUMN public.share_links.view_count IS 'Number of times the link has been viewed (for one_time links)';
COMMENT ON COLUMN public.share_links.max_views IS 'Maximum number of views allowed (null = unlimited, for one_time typically 1)';
COMMENT ON COLUMN public.share_links.shared_fields IS 'JSON array of fields to share: basic_info, description, pedigree, health, training, competitions, images, videos, price';

-- Update existing share_links to have default values
UPDATE public.share_links
SET
  link_type = 'standard',
  view_count = 0,
  shared_fields = '["basic_info", "description", "pedigree", "training", "competitions", "images", "videos"]'::jsonb
WHERE link_type IS NULL;

-- Create index for faster lookups by token
CREATE INDEX IF NOT EXISTS idx_share_links_token ON public.share_links(token);

-- Add constraint: password_hash required if link_type is password_protected
ALTER TABLE public.share_links
ADD CONSTRAINT check_password_hash_for_protected_links
CHECK (
  (link_type = 'password_protected' AND password_hash IS NOT NULL)
  OR
  (link_type != 'password_protected')
);

-- Add constraint: max_views should be set for one_time links
ALTER TABLE public.share_links
ADD CONSTRAINT check_max_views_for_one_time_links
CHECK (
  (link_type = 'one_time' AND max_views IS NOT NULL AND max_views > 0)
  OR
  (link_type != 'one_time')
);
