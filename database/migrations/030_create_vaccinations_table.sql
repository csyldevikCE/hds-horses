-- Migration 030: Create vaccinations table for FEI-compliant vaccination tracking
-- Purpose: Track all vaccinations with FEI compliance rules for equine influenza

-- Create vaccinations table
CREATE TABLE IF NOT EXISTS public.vaccinations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  horse_id UUID NOT NULL REFERENCES public.horses(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Vaccination details
  vaccine_type TEXT NOT NULL, -- e.g., 'Equine Influenza', 'Tetanus', 'EHV', 'Rabies', 'West Nile Virus', 'Custom'
  vaccine_name TEXT, -- Brand/product name (optional)
  dose_number TEXT, -- e.g., 'V1', 'V2', 'V3', 'Booster 1', 'Booster 2', or custom

  -- Dates
  administered_date DATE NOT NULL,
  next_due_date DATE, -- When next dose/booster is due

  -- Veterinarian info
  veterinarian_name TEXT,
  veterinarian_license TEXT,

  -- Additional info
  batch_number TEXT, -- Vaccine batch/lot number for traceability
  notes TEXT,

  -- FEI compliance fields
  recorded_in_passport BOOLEAN DEFAULT false,
  recorded_in_fei_app BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_vaccinations_horse_id ON public.vaccinations(horse_id);
CREATE INDEX idx_vaccinations_organization_id ON public.vaccinations(organization_id);
CREATE INDEX idx_vaccinations_administered_date ON public.vaccinations(administered_date);
CREATE INDEX idx_vaccinations_next_due_date ON public.vaccinations(next_due_date);
CREATE INDEX idx_vaccinations_vaccine_type ON public.vaccinations(vaccine_type);

-- Enable Row Level Security
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vaccinations

-- Users can view vaccinations for horses in their organization
CREATE POLICY "vaccinations_select_organization"
ON public.vaccinations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE organization_users.organization_id = vaccinations.organization_id
    AND organization_users.user_id = auth.uid()
  )
);

-- Admins can insert vaccinations for horses in their organization
CREATE POLICY "vaccinations_insert_admin"
ON public.vaccinations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE organization_users.organization_id = vaccinations.organization_id
    AND organization_users.user_id = auth.uid()
    AND organization_users.role = 'admin'
  )
);

-- Admins can update vaccinations for horses in their organization
CREATE POLICY "vaccinations_update_admin"
ON public.vaccinations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE organization_users.organization_id = vaccinations.organization_id
    AND organization_users.user_id = auth.uid()
    AND organization_users.role = 'admin'
  )
);

-- Admins can delete vaccinations for horses in their organization
CREATE POLICY "vaccinations_delete_admin"
ON public.vaccinations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE organization_users.organization_id = vaccinations.organization_id
    AND organization_users.user_id = auth.uid()
    AND organization_users.role = 'admin'
  )
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vaccinations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vaccinations_updated_at
BEFORE UPDATE ON public.vaccinations
FOR EACH ROW
EXECUTE FUNCTION update_vaccinations_updated_at();

-- Helper function to check FEI compliance status for equine influenza
-- Returns: 'compliant', 'due_soon' (within 30 days), 'overdue', 'incomplete_primary', 'not_applicable'
CREATE OR REPLACE FUNCTION get_fei_influenza_compliance_status(p_horse_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
  v_latest_date DATE;
  v_days_until_due INTEGER;
BEGIN
  -- Count influenza vaccinations
  SELECT COUNT(*), MAX(administered_date)
  INTO v_count, v_latest_date
  FROM public.vaccinations
  WHERE horse_id = p_horse_id
  AND vaccine_type = 'Equine Influenza';

  -- No vaccinations
  IF v_count = 0 THEN
    RETURN 'not_applicable';
  END IF;

  -- Check if primary course is complete (need at least 3 doses: V1, V2, V3)
  IF v_count < 3 THEN
    RETURN 'incomplete_primary';
  END IF;

  -- Check days since last vaccination
  v_days_until_due := (v_latest_date + INTERVAL '6 months 21 days')::DATE - CURRENT_DATE;

  IF v_days_until_due < 0 THEN
    RETURN 'overdue';
  ELSIF v_days_until_due <= 30 THEN
    RETURN 'due_soon';
  ELSE
    RETURN 'compliant';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on table and columns
COMMENT ON TABLE public.vaccinations IS 'Vaccination records for horses with FEI compliance tracking';
COMMENT ON COLUMN public.vaccinations.vaccine_type IS 'Type of vaccine: Equine Influenza, Tetanus, EHV, Rabies, West Nile Virus, or Custom';
COMMENT ON COLUMN public.vaccinations.dose_number IS 'Dose in series: V1, V2, V3, Booster 1, etc.';
COMMENT ON COLUMN public.vaccinations.next_due_date IS 'Date when next dose/booster is due based on FEI rules or vaccine protocol';
COMMENT ON COLUMN public.vaccinations.recorded_in_passport IS 'Whether vaccination is recorded in horse passport (required by FEI)';
COMMENT ON COLUMN public.vaccinations.recorded_in_fei_app IS 'Whether vaccination is recorded in FEI HorseApp (required from Feb 1, 2025)';
