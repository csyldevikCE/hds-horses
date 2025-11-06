-- Migration 034: Configure private horse-xrays storage bucket with RLS policies
-- Purpose: Secure storage for sensitive X-ray medical records
-- Created: 2025-11-06

-- Check if bucket exists, if not create it, otherwise update to private
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'horse-xrays',
  'horse-xrays',
  false, -- PRIVATE bucket for security
  524288000, -- 500MB limit (X-rays/DICOM files can be large)
  ARRAY['application/dicom', 'image/jpeg', 'image/png']
)
ON CONFLICT (id)
DO UPDATE SET
  public = false, -- Ensure it's private
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['application/dicom', 'image/jpeg', 'image/png'];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Organization members can upload X-rays" ON storage.objects;
DROP POLICY IF EXISTS "Organization members can view X-rays" ON storage.objects;
DROP POLICY IF EXISTS "Organization members can update X-rays" ON storage.objects;
DROP POLICY IF EXISTS "Organization members can delete X-rays" ON storage.objects;

-- RLS Policy: Allow authenticated organization members to upload X-rays
-- Files are organized by: organization_id/horse_id/timestamp.ext
CREATE POLICY "Organization members can upload X-rays"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'horse-xrays'
  AND auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE organization_id = (storage.foldername(name))[1]::uuid
  )
);

-- RLS Policy: Allow authenticated organization members to view their X-rays
CREATE POLICY "Organization members can view X-rays"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'horse-xrays'
  AND auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE organization_id = (storage.foldername(name))[1]::uuid
  )
);

-- RLS Policy: Allow authenticated organization members to update X-ray metadata
CREATE POLICY "Organization members can update X-rays"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'horse-xrays'
  AND auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE organization_id = (storage.foldername(name))[1]::uuid
  )
);

-- RLS Policy: Allow authenticated organization members to delete X-rays
CREATE POLICY "Organization members can delete X-rays"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'horse-xrays'
  AND auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE organization_id = (storage.foldername(name))[1]::uuid
  )
);

-- Test query to verify bucket was created
-- SELECT * FROM storage.buckets WHERE id = 'horse-xrays';
