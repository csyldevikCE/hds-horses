-- Migration: Create horse_xrays table for storing X-ray files and metadata
-- Created: 2025-10-26
-- Purpose: Enable veterinary X-ray management with DICOM support and URL linking

-- Create horse_xrays table
CREATE TABLE IF NOT EXISTS public.horse_xrays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID NOT NULL REFERENCES public.horses(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- File storage
  file_url TEXT NOT NULL, -- Supabase Storage URL or external URL
  file_type TEXT NOT NULL CHECK (file_type IN ('upload', 'url')), -- 'upload' = direct file, 'url' = external link
  format TEXT NOT NULL DEFAULT 'dicom' CHECK (format IN ('dicom', 'jpeg', 'png')), -- File format

  -- Metadata
  date_taken DATE, -- When the X-ray was taken
  body_part TEXT, -- Which part of the horse (e.g., "Left Front Leg", "Hoof", "Spine")
  veterinarian_name TEXT, -- Name of the vet who took/reviewed the X-ray
  notes TEXT, -- Clinical notes, findings, diagnosis

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX idx_horse_xrays_horse_id ON public.horse_xrays(horse_id);
CREATE INDEX idx_horse_xrays_organization_id ON public.horse_xrays(organization_id);

-- Add updated_at trigger
CREATE TRIGGER update_horse_xrays_updated_at
  BEFORE UPDATE ON public.horse_xrays
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE public.horse_xrays ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view X-rays for horses in their organization
CREATE POLICY "horse_xrays_select_own_org"
ON public.horse_xrays
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.organization_users
    WHERE user_id = auth.uid()
  )
);

-- Policy: Admins can insert X-rays for horses in their organization
CREATE POLICY "horse_xrays_insert_admin"
ON public.horse_xrays
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM public.organization_users
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
  AND
  horse_id IN (
    SELECT id
    FROM public.horses
    WHERE organization_id = horse_xrays.organization_id
  )
);

-- Policy: Admins can update X-rays for horses in their organization
CREATE POLICY "horse_xrays_update_admin"
ON public.horse_xrays
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.organization_users
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM public.organization_users
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Admins can delete X-rays for horses in their organization
CREATE POLICY "horse_xrays_delete_admin"
ON public.horse_xrays
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.organization_users
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Public can view X-rays for horses with share links (for SharedHorse.tsx)
CREATE POLICY "horse_xrays_select_public_shared"
ON public.horse_xrays
FOR SELECT
TO anon, authenticated
USING (
  horse_id IN (
    SELECT horse_id
    FROM public.share_links
    WHERE token IS NOT NULL
  )
);

-- Grant permissions to anon role for public share links
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.horse_xrays TO anon;

-- Add comment to table
COMMENT ON TABLE public.horse_xrays IS 'Stores X-ray files and metadata for horses. Supports both direct uploads to Supabase Storage and external URL links. Includes veterinary metadata like date taken, body part, vet name, and clinical notes.';

-- Create storage bucket for X-ray uploads (run separately in Supabase Dashboard > Storage)
-- Bucket name: 'horse-xrays'
-- Public: false
-- File size limit: 50MB
-- Allowed MIME types: application/dicom, image/jpeg, image/png
