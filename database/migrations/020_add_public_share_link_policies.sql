-- Migration 020: Add Public Access Policies for Share Links
-- Date: 2025-10-21
-- Description: Allow public access to share links and associated horse data

-- Policy: Anyone can view share links by token (for public sharing)
CREATE POLICY "Anyone can view share links by token"
ON public.share_links FOR SELECT
USING (true);

-- Policy: Anyone can read horses that have valid share links
CREATE POLICY "Anyone can view horses through share links"
ON public.horses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.share_links
    WHERE share_links.horse_id = horses.id
  )
);

-- Policy: Anyone can view horse images through share links
CREATE POLICY "Anyone can view horse images through share links"
ON public.horse_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.share_links
    WHERE share_links.horse_id = horse_images.horse_id
  )
);

-- Policy: Anyone can view horse videos through share links
CREATE POLICY "Anyone can view horse videos through share links"
ON public.horse_videos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.share_links
    WHERE share_links.horse_id = horse_videos.horse_id
  )
);

-- Policy: Anyone can view competitions through share links
CREATE POLICY "Anyone can view competitions through share links"
ON public.competitions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.share_links
    WHERE share_links.horse_id = competitions.horse_id
  )
);
