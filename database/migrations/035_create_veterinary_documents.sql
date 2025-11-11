-- Migration 035: Create veterinary_documents table and storage bucket
-- Purpose: Standalone veterinary document storage (health certificates, insurance, etc.)
-- Created: 2025-11-10

-- Create veterinary_documents table
CREATE TABLE IF NOT EXISTS public.veterinary_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  horse_id UUID NOT NULL REFERENCES public.horses(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- File details
  file_url TEXT NOT NULL, -- Supabase storage path or external URL
  file_name TEXT NOT NULL,
  file_type TEXT, -- MIME type: 'application/pdf', 'image/jpeg', etc.
  file_size INTEGER, -- File size in bytes

  -- Document metadata
  document_type TEXT, -- 'Health Certificate', 'Insurance', 'Veterinary Report', 'Coggins Test', 'Registration Papers', 'Custom'
  description TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_veterinary_documents_horse_id ON public.veterinary_documents(horse_id);
CREATE INDEX IF NOT EXISTS idx_veterinary_documents_organization_id ON public.veterinary_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_veterinary_documents_created_at ON public.veterinary_documents(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.veterinary_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for veterinary_documents

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "veterinary_documents_select_organization" ON public.veterinary_documents;
DROP POLICY IF EXISTS "veterinary_documents_insert_admin" ON public.veterinary_documents;
DROP POLICY IF EXISTS "veterinary_documents_update_admin" ON public.veterinary_documents;
DROP POLICY IF EXISTS "veterinary_documents_delete_admin" ON public.veterinary_documents;

-- Users can view documents for horses in their organization
CREATE POLICY "veterinary_documents_select_organization"
ON public.veterinary_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE organization_users.organization_id = veterinary_documents.organization_id
    AND organization_users.user_id = auth.uid()
  )
);

-- Admins can insert documents for horses in their organization
CREATE POLICY "veterinary_documents_insert_admin"
ON public.veterinary_documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE organization_users.organization_id = veterinary_documents.organization_id
    AND organization_users.user_id = auth.uid()
    AND organization_users.role = 'admin'
  )
);

-- Admins can update documents for horses in their organization
CREATE POLICY "veterinary_documents_update_admin"
ON public.veterinary_documents FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE organization_users.organization_id = veterinary_documents.organization_id
    AND organization_users.user_id = auth.uid()
    AND organization_users.role = 'admin'
  )
);

-- Admins can delete documents for horses in their organization
CREATE POLICY "veterinary_documents_delete_admin"
ON public.veterinary_documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE organization_users.organization_id = veterinary_documents.organization_id
    AND organization_users.user_id = auth.uid()
    AND organization_users.role = 'admin'
  )
);

-- Note: Using existing 'veterinary-documents' storage bucket
-- Bucket should be configured as:
-- - private: true
-- - file_size_limit: 52428800 (50MB)
-- - allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Organization members can upload vet docs" ON storage.objects;
DROP POLICY IF EXISTS "Organization members can view vet docs" ON storage.objects;
DROP POLICY IF EXISTS "Organization members can update vet docs" ON storage.objects;
DROP POLICY IF EXISTS "Organization members can delete vet docs" ON storage.objects;

-- RLS Policy: Allow authenticated organization members to upload veterinary documents
-- Files are organized by: organization_id/horse_id/timestamp.ext
CREATE POLICY "Organization members can upload vet docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'veterinary-documents'
  AND auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE organization_id = (storage.foldername(name))[1]::uuid
  )
);

-- RLS Policy: Allow authenticated organization members to view their veterinary documents
CREATE POLICY "Organization members can view vet docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'veterinary-documents'
  AND auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE organization_id = (storage.foldername(name))[1]::uuid
  )
);

-- RLS Policy: Allow authenticated organization members to update veterinary document metadata
CREATE POLICY "Organization members can update vet docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'veterinary-documents'
  AND auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE organization_id = (storage.foldername(name))[1]::uuid
  )
);

-- RLS Policy: Allow authenticated organization members to delete veterinary documents
CREATE POLICY "Organization members can delete vet docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'veterinary-documents'
  AND auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE organization_id = (storage.foldername(name))[1]::uuid
  )
);

-- Comment on table
COMMENT ON TABLE public.veterinary_documents IS 'Standalone veterinary documents (health certificates, insurance, coggins tests, etc.) not tied to specific vet visits';
COMMENT ON COLUMN public.veterinary_documents.document_type IS 'Type of document: Health Certificate, Insurance, Veterinary Report, Coggins Test, Registration Papers, or Custom';
