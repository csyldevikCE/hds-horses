-- Migration 019: Create Share Link Views Tracking
-- Date: 2025-10-21
-- Description: Track detailed analytics for share link views (IP, location, timestamp, device info)

-- Create share_link_views table
CREATE TABLE IF NOT EXISTS public.share_link_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID NOT NULL REFERENCES public.share_links(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  region TEXT,
  referer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_share_link_views_share_link_id ON public.share_link_views(share_link_id);
CREATE INDEX IF NOT EXISTS idx_share_link_views_viewed_at ON public.share_link_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_link_views_ip_address ON public.share_link_views(ip_address);

-- Add comments for documentation
COMMENT ON TABLE public.share_link_views IS 'Tracks individual views of share links for analytics';
COMMENT ON COLUMN public.share_link_views.share_link_id IS 'Reference to the share link that was viewed';
COMMENT ON COLUMN public.share_link_views.viewed_at IS 'Timestamp when the link was accessed';
COMMENT ON COLUMN public.share_link_views.ip_address IS 'IP address of the visitor';
COMMENT ON COLUMN public.share_link_views.user_agent IS 'Browser and device information';
COMMENT ON COLUMN public.share_link_views.country IS 'Country derived from IP address (optional)';
COMMENT ON COLUMN public.share_link_views.city IS 'City derived from IP address (optional)';
COMMENT ON COLUMN public.share_link_views.region IS 'Region/state derived from IP address (optional)';
COMMENT ON COLUMN public.share_link_views.referer IS 'HTTP referer - where the visitor came from';

-- Enable RLS
ALTER TABLE public.share_link_views ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Organization members can view tracking data for their share links
CREATE POLICY "Users can view their organization's share link analytics"
ON public.share_link_views FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.share_links sl
    JOIN public.organization_users ou ON ou.organization_id = sl.organization_id
    WHERE sl.id = share_link_views.share_link_id
    AND ou.user_id = auth.uid()
  )
);

-- RLS Policy: Anyone can insert view tracking (for public share links)
CREATE POLICY "Anyone can log share link views"
ON public.share_link_views FOR INSERT
WITH CHECK (true);

-- Function to get unique visitor count for a share link
CREATE OR REPLACE FUNCTION get_unique_visitors(link_id UUID)
RETURNS BIGINT AS $$
  SELECT COUNT(DISTINCT ip_address)
  FROM public.share_link_views
  WHERE share_link_id = link_id
  AND ip_address IS NOT NULL;
$$ LANGUAGE SQL STABLE;

-- Function to get view count in last N days
CREATE OR REPLACE FUNCTION get_recent_view_count(link_id UUID, days INTEGER DEFAULT 7)
RETURNS BIGINT AS $$
  SELECT COUNT(*)
  FROM public.share_link_views
  WHERE share_link_id = link_id
  AND viewed_at >= NOW() - (days || ' days')::INTERVAL;
$$ LANGUAGE SQL STABLE;

-- Function to get top countries for a share link
CREATE OR REPLACE FUNCTION get_top_countries(link_id UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE(country TEXT, view_count BIGINT) AS $$
  SELECT country, COUNT(*) as view_count
  FROM public.share_link_views
  WHERE share_link_id = link_id
  AND country IS NOT NULL
  GROUP BY country
  ORDER BY view_count DESC
  LIMIT limit_count;
$$ LANGUAGE SQL STABLE;
