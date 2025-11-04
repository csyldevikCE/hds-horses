-- =====================================================
-- Fix Invitations Table Foreign Keys
-- =====================================================
-- This migration fixes the foreign key constraints on the invitations table
-- to allow user deletion by setting invited_by and used_by to NULL when the user is deleted
-- Run this in your Supabase SQL Editor

-- =====================================================
-- DROP EXISTING FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Drop the existing foreign key constraints
ALTER TABLE public.invitations
DROP CONSTRAINT IF EXISTS invitations_invited_by_fkey;

ALTER TABLE public.invitations
DROP CONSTRAINT IF EXISTS invitations_used_by_fkey;

-- =====================================================
-- RECREATE FOREIGN KEYS WITH ON DELETE SET NULL
-- =====================================================

-- Make invited_by nullable first (it was NOT NULL before)
ALTER TABLE public.invitations
ALTER COLUMN invited_by DROP NOT NULL;

-- Add foreign key with ON DELETE SET NULL for invited_by
ALTER TABLE public.invitations
ADD CONSTRAINT invitations_invited_by_fkey
FOREIGN KEY (invited_by)
REFERENCES auth.users(id)
ON DELETE SET NULL;

-- Add foreign key with ON DELETE SET NULL for used_by
ALTER TABLE public.invitations
ADD CONSTRAINT invitations_used_by_fkey
FOREIGN KEY (used_by)
REFERENCES auth.users(id)
ON DELETE SET NULL;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

SELECT 'Invitations foreign keys fixed! Users can now be deleted safely.' as status;
