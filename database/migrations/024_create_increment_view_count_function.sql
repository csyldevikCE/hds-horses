-- Migration 024: Create Function to Increment View Count
-- Date: 2025-10-26
-- Description: Create a PostgreSQL function to safely increment share link view count

-- Create a function to increment view count atomically
CREATE OR REPLACE FUNCTION increment_share_link_view_count(share_link_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE share_links
  SET view_count = view_count + 1
  WHERE id = share_link_id_param;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION increment_share_link_view_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_share_link_view_count(UUID) TO authenticated;

-- Test the function (optional - comment out after testing)
-- SELECT increment_share_link_view_count('your-share-link-id-here');
