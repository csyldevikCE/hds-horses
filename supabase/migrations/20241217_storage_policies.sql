-- Migration: Add storage bucket policies for file type validation
-- Date: 2024-12-17
-- Description: Creates storage policies to validate file types server-side
--              Prevents malicious file uploads by restricting MIME types
-- @see SEC-009 in TODO.md

-- ============================================================================
-- NOTE: Storage policies are managed in Supabase Dashboard
-- This file documents the policies that should be configured
-- ============================================================================

-- ============================================================================
-- BUCKET: horse-media
-- Purpose: Horse images and videos
-- ============================================================================

/*
In Supabase Dashboard > Storage > horse-media > Policies:

1. SELECT Policy (View files):
   - Name: "Organization members can view horse media"
   - Target roles: authenticated
   - Definition:
     bucket_id = 'horse-media' AND
     auth.uid() IN (
       SELECT user_id FROM organization_users
       WHERE organization_id = (
         SELECT organization_id FROM horses
         WHERE id::text = (storage.foldername(name))[1]
       )
     )

2. INSERT Policy (Upload files):
   - Name: "Organization members can upload horse media"
   - Target roles: authenticated
   - Definition:
     bucket_id = 'horse-media' AND
     (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm', 'avi')) AND
     auth.uid() IN (
       SELECT user_id FROM organization_users
       WHERE organization_id = (
         SELECT organization_id FROM horses
         WHERE id::text = (storage.foldername(name))[1]
       )
     )

3. DELETE Policy (Remove files):
   - Name: "Organization admins can delete horse media"
   - Target roles: authenticated
   - Definition:
     bucket_id = 'horse-media' AND
     auth.uid() IN (
       SELECT user_id FROM organization_users
       WHERE organization_id = (
         SELECT organization_id FROM horses
         WHERE id::text = (storage.foldername(name))[1]
       )
       AND role = 'admin'
     )
*/

-- ============================================================================
-- BUCKET: horse-xrays
-- Purpose: Medical imaging (DICOM, JPEG, PNG)
-- ============================================================================

/*
In Supabase Dashboard > Storage > horse-xrays > Policies:

1. SELECT Policy (View files):
   - Name: "Organization members can view xrays"
   - Target roles: authenticated
   - Definition:
     bucket_id = 'horse-xrays' AND
     auth.uid() IN (
       SELECT user_id FROM organization_users
       WHERE organization_id = (
         SELECT organization_id FROM horses
         WHERE id::text = (storage.foldername(name))[1]
       )
     )

2. INSERT Policy (Upload files):
   - Name: "Organization members can upload xrays"
   - Target roles: authenticated
   - Definition:
     bucket_id = 'horse-xrays' AND
     (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'dcm', 'dicom')) AND
     auth.uid() IN (
       SELECT user_id FROM organization_users
       WHERE organization_id = (
         SELECT organization_id FROM horses
         WHERE id::text = (storage.foldername(name))[1]
       )
     )

3. DELETE Policy (Remove files):
   - Name: "Organization admins can delete xrays"
   - Target roles: authenticated
   - Definition:
     bucket_id = 'horse-xrays' AND
     auth.uid() IN (
       SELECT user_id FROM organization_users
       WHERE organization_id = (
         SELECT organization_id FROM horses
         WHERE id::text = (storage.foldername(name))[1]
       )
       AND role = 'admin'
     )
*/

-- ============================================================================
-- BUCKET: vet-documents
-- Purpose: Veterinary documents (PDF, images)
-- ============================================================================

/*
In Supabase Dashboard > Storage > vet-documents > Policies:

1. SELECT Policy (View files):
   - Name: "Organization members can view vet documents"
   - Target roles: authenticated
   - Definition:
     bucket_id = 'vet-documents' AND
     auth.uid() IN (
       SELECT user_id FROM organization_users
       WHERE organization_id = (
         SELECT organization_id FROM horses
         WHERE id::text = (storage.foldername(name))[1]
       )
     )

2. INSERT Policy (Upload files):
   - Name: "Organization members can upload vet documents"
   - Target roles: authenticated
   - Definition:
     bucket_id = 'vet-documents' AND
     (storage.extension(name) IN ('pdf', 'jpg', 'jpeg', 'png')) AND
     auth.uid() IN (
       SELECT user_id FROM organization_users
       WHERE organization_id = (
         SELECT organization_id FROM horses
         WHERE id::text = (storage.foldername(name))[1]
       )
     )

3. DELETE Policy (Remove files):
   - Name: "Organization admins can delete vet documents"
   - Target roles: authenticated
   - Definition:
     bucket_id = 'vet-documents' AND
     auth.uid() IN (
       SELECT user_id FROM organization_users
       WHERE organization_id = (
         SELECT organization_id FROM horses
         WHERE id::text = (storage.foldername(name))[1]
       )
       AND role = 'admin'
     )
*/

-- ============================================================================
-- HELPER FUNCTION: Validate file extension
-- This function can be used in custom storage policies
-- ============================================================================

CREATE OR REPLACE FUNCTION storage.validate_file_extension(
  filename TEXT,
  allowed_extensions TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  file_ext TEXT;
BEGIN
  -- Extract extension from filename
  file_ext := LOWER(SPLIT_PART(filename, '.', ARRAY_LENGTH(STRING_TO_ARRAY(filename, '.'), 1)));

  -- Check if extension is in allowed list
  RETURN file_ext = ANY(allowed_extensions);
END;
$$;

COMMENT ON FUNCTION storage.validate_file_extension IS
'Validates that a filename has one of the allowed extensions.
Usage: storage.validate_file_extension(name, ARRAY[''jpg'', ''png'', ''pdf''])';

-- ============================================================================
-- STORAGE BUCKET CONFIGURATION
-- Run these in SQL Editor if buckets don't exist
-- ============================================================================

-- Create buckets if they don't exist (uncomment if needed)
/*
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('horse-media', 'horse-media', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo']),
  ('horse-xrays', 'horse-xrays', false, 104857600, ARRAY['image/jpeg', 'image/png', 'application/dicom']),
  ('vet-documents', 'vet-documents', false, 20971520, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = EXCLUDED.allowed_mime_types;
*/

-- ============================================================================
-- MIME TYPE VALIDATION TABLE (for reference)
-- ============================================================================

/*
Allowed MIME types by bucket:

horse-media:
  - image/jpeg
  - image/png
  - image/gif
  - image/webp
  - video/mp4
  - video/quicktime (MOV)
  - video/webm
  - video/x-msvideo (AVI)

horse-xrays:
  - image/jpeg
  - image/png
  - application/dicom

vet-documents:
  - application/pdf
  - image/jpeg
  - image/png
*/
