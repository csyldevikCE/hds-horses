-- Migration 031: Create vet_visits table for veterinary visit tracking
-- Purpose: Track veterinary visits with documents and notes

-- Create vet_visits table
CREATE TABLE IF NOT EXISTS public.vet_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  horse_id UUID NOT NULL REFERENCES public.horses(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Visit details
  visit_date DATE NOT NULL,
  visit_type TEXT, -- e.g., 'Routine Check', 'Emergency', 'Dental', 'Surgery', 'Follow-up', 'Custom'

  -- Veterinarian info
  veterinarian_name TEXT,
  veterinarian_clinic TEXT,
  veterinarian_phone TEXT,

  -- Visit information
  diagnosis TEXT,
  treatment TEXT,
  medications TEXT,
  notes TEXT,

  -- Follow-up
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,

  -- Cost tracking
  cost DECIMAL(10, 2),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vet_visit_documents table for multiple documents per visit
CREATE TABLE IF NOT EXISTS public.vet_visit_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vet_visit_id UUID NOT NULL REFERENCES public.vet_visits(id) ON DELETE CASCADE,

  -- Document details
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT, -- e.g., 'pdf', 'jpg', 'png', 'doc'
  file_size INTEGER, -- in bytes

  -- Description
  document_type TEXT, -- e.g., 'Lab Results', 'X-Ray Report', 'Invoice', 'Prescription', 'Custom'
  description TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_vet_visits_horse_id ON public.vet_visits(horse_id);
CREATE INDEX idx_vet_visits_organization_id ON public.vet_visits(organization_id);
CREATE INDEX idx_vet_visits_visit_date ON public.vet_visits(visit_date DESC);
CREATE INDEX idx_vet_visit_documents_visit_id ON public.vet_visit_documents(vet_visit_id);

-- Enable Row Level Security
ALTER TABLE public.vet_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vet_visit_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vet_visits

-- Users can view vet visits for horses in their organization
CREATE POLICY "vet_visits_select_organization"
ON public.vet_visits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE organization_users.organization_id = vet_visits.organization_id
    AND organization_users.user_id = auth.uid()
  )
);

-- Admins can insert vet visits for horses in their organization
CREATE POLICY "vet_visits_insert_admin"
ON public.vet_visits FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE organization_users.organization_id = vet_visits.organization_id
    AND organization_users.user_id = auth.uid()
    AND organization_users.role = 'admin'
  )
);

-- Admins can update vet visits for horses in their organization
CREATE POLICY "vet_visits_update_admin"
ON public.vet_visits FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE organization_users.organization_id = vet_visits.organization_id
    AND organization_users.user_id = auth.uid()
    AND organization_users.role = 'admin'
  )
);

-- Admins can delete vet visits for horses in their organization
CREATE POLICY "vet_visits_delete_admin"
ON public.vet_visits FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE organization_users.organization_id = vet_visits.organization_id
    AND organization_users.user_id = auth.uid()
    AND organization_users.role = 'admin'
  )
);

-- RLS Policies for vet_visit_documents

-- Users can view documents for vet visits in their organization
CREATE POLICY "vet_visit_documents_select_organization"
ON public.vet_visit_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vet_visits
    JOIN public.organization_users ON organization_users.organization_id = vet_visits.organization_id
    WHERE vet_visits.id = vet_visit_documents.vet_visit_id
    AND organization_users.user_id = auth.uid()
  )
);

-- Admins can insert documents for vet visits in their organization
CREATE POLICY "vet_visit_documents_insert_admin"
ON public.vet_visit_documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vet_visits
    JOIN public.organization_users ON organization_users.organization_id = vet_visits.organization_id
    WHERE vet_visits.id = vet_visit_documents.vet_visit_id
    AND organization_users.user_id = auth.uid()
    AND organization_users.role = 'admin'
  )
);

-- Admins can delete documents for vet visits in their organization
CREATE POLICY "vet_visit_documents_delete_admin"
ON public.vet_visit_documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.vet_visits
    JOIN public.organization_users ON organization_users.organization_id = vet_visits.organization_id
    WHERE vet_visits.id = vet_visit_documents.vet_visit_id
    AND organization_users.user_id = auth.uid()
    AND organization_users.role = 'admin'
  )
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vet_visits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vet_visits_updated_at
BEFORE UPDATE ON public.vet_visits
FOR EACH ROW
EXECUTE FUNCTION update_vet_visits_updated_at();

-- Helper function to get the most recent vet visit for a horse
CREATE OR REPLACE FUNCTION get_latest_vet_visit(p_horse_id UUID)
RETURNS TABLE (
  visit_date DATE,
  veterinarian_name TEXT,
  visit_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.visit_date,
    v.veterinarian_name,
    v.visit_type
  FROM public.vet_visits v
  WHERE v.horse_id = p_horse_id
  ORDER BY v.visit_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on tables and columns
COMMENT ON TABLE public.vet_visits IS 'Veterinary visit records for horses with documents and notes';
COMMENT ON TABLE public.vet_visit_documents IS 'Documents attached to veterinary visits (reports, invoices, prescriptions, etc.)';
COMMENT ON COLUMN public.vet_visits.visit_type IS 'Type of visit: Routine Check, Emergency, Dental, Surgery, Follow-up, or Custom';
COMMENT ON COLUMN public.vet_visit_documents.document_type IS 'Type of document: Lab Results, X-Ray Report, Invoice, Prescription, or Custom';
