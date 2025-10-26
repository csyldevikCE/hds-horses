-- ALTER TABLE statements to add expanded pedigree columns
-- Run these in your Supabase SQL Editor to update existing horses table

-- Add new pedigree columns for 4-generation pedigree
ALTER TABLE horses 
ADD COLUMN IF NOT EXISTS pedigree_sire_sire VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_sire_dam VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_dam_sire VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_dam_dam VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_sire_sire_sire VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_sire_sire_dam VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_sire_dam_sire VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_sire_dam_dam VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_dam_sire_sire VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_dam_sire_dam VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_dam_dam_sire VARCHAR(255),
ADD COLUMN IF NOT EXISTS pedigree_dam_dam_dam VARCHAR(255);

-- Add equipe_link column to competitions table (if not already added)
ALTER TABLE competitions 
ADD COLUMN IF NOT EXISTS equipe_link TEXT;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'horses' 
AND column_name LIKE 'pedigree%'
ORDER BY column_name; 