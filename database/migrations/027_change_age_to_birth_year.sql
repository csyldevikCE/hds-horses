-- =====================================================
-- Change horses.age to birth_year
-- =====================================================
-- This migration changes the age field to birth_year
-- Age will be calculated dynamically based on birth_year

-- Step 1: Add new birth_year column
ALTER TABLE public.horses
ADD COLUMN IF NOT EXISTS birth_year INTEGER;

-- Step 2: Migrate existing age data to birth_year
-- Calculate birth_year from current age (assuming current year is 2025)
UPDATE public.horses
SET birth_year = EXTRACT(YEAR FROM CURRENT_DATE) - age
WHERE birth_year IS NULL AND age IS NOT NULL;

-- Step 3: Make birth_year NOT NULL (after migration)
ALTER TABLE public.horses
ALTER COLUMN birth_year SET NOT NULL;

-- Step 4: Drop the old age column
ALTER TABLE public.horses
DROP COLUMN IF EXISTS age;

-- Step 5: Create a helper function to calculate age from birth_year
CREATE OR REPLACE FUNCTION public.calculate_horse_age(birth_year_param INTEGER)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
    SELECT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - birth_year_param;
$$;

-- Step 6: Create a view that includes calculated age for backwards compatibility
CREATE OR REPLACE VIEW public.horses_with_age AS
SELECT
    *,
    public.calculate_horse_age(birth_year) as age
FROM public.horses;

-- Verify the migration
SELECT 'Migration Complete - age changed to birth_year' as status;
SELECT COUNT(*) as horses_with_birth_year FROM public.horses WHERE birth_year IS NOT NULL;
