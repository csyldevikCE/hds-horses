-- Migration: Add BLUP integration fields to horses table
-- Purpose: Store additional data from BLUP API for better horse tracking
-- Date: 2025-11-17

-- Add BLUP-related fields to horses table
ALTER TABLE horses
  ADD COLUMN IF NOT EXISTS regno TEXT,
  ADD COLUMN IF NOT EXISTS chip_number TEXT,
  ADD COLUMN IF NOT EXISTS wffs_status INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stud_book_no TEXT,
  ADD COLUMN IF NOT EXISTS life_no TEXT,
  ADD COLUMN IF NOT EXISTS breeder TEXT,
  ADD COLUMN IF NOT EXISTS blup_url TEXT,
  ADD COLUMN IF NOT EXISTS last_blup_sync TIMESTAMP DEFAULT NULL;

-- Create index for quick lookup by registration number
CREATE INDEX IF NOT EXISTS idx_horses_regno ON horses(regno) WHERE regno IS NOT NULL;

-- Create index for chip number lookup (used for identification)
CREATE INDEX IF NOT EXISTS idx_horses_chip_number ON horses(chip_number) WHERE chip_number IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN horses.regno IS 'BLUP registration number (e.g., 04201515)';
COMMENT ON COLUMN horses.chip_number IS 'Horse microchip number';
COMMENT ON COLUMN horses.wffs_status IS 'Warmblood Fragile Foal Syndrome status (0=clear, 1=carrier, 2=affected)';
COMMENT ON COLUMN horses.stud_book_no IS 'Studbook registration number';
COMMENT ON COLUMN horses.life_no IS 'Life number from BLUP system';
COMMENT ON COLUMN horses.breeder IS 'Breeder name from BLUP system';
COMMENT ON COLUMN horses.blup_url IS 'URL to horse page in BLUP system';
COMMENT ON COLUMN horses.last_blup_sync IS 'Timestamp of last sync from BLUP API';

-- Grant permissions (anon should not see these internal fields in shared links)
-- RLS policies will handle access control
