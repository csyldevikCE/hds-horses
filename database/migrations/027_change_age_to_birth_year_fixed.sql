-- =====================================================
-- Change horses.age to birth_year (FIXED VERSION)
-- =====================================================
-- This migration changes the age field to birth_year
-- Age will be calculated dynamically based on birth_year

-- Step 1: Check if birth_year column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'horses'
        AND column_name = 'birth_year'
    ) THEN
        -- Add new birth_year column
        ALTER TABLE public.horses ADD COLUMN birth_year INTEGER;

        -- Step 2: Migrate existing age data to birth_year
        -- Calculate birth_year from current age
        UPDATE public.horses
        SET birth_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - age
        WHERE birth_year IS NULL AND age IS NOT NULL;

        RAISE NOTICE 'Added birth_year column and migrated data from age column';
    ELSE
        RAISE NOTICE 'birth_year column already exists';
    END IF;
END $$;

-- Step 3: Make sure all horses have birth_year set
-- (For horses inserted with birth_year directly, this does nothing)
UPDATE public.horses
SET birth_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - age
WHERE birth_year IS NULL AND age IS NOT NULL;

-- Step 4: Check if age column exists before dropping it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'horses'
        AND column_name = 'age'
    ) THEN
        -- Make birth_year NOT NULL before dropping age
        ALTER TABLE public.horses ALTER COLUMN birth_year SET NOT NULL;

        -- Drop the old age column
        ALTER TABLE public.horses DROP COLUMN age;

        RAISE NOTICE 'Dropped age column';
    ELSE
        -- If age column doesn't exist, just make sure birth_year is NOT NULL
        ALTER TABLE public.horses ALTER COLUMN birth_year SET NOT NULL;

        RAISE NOTICE 'age column already dropped';
    END IF;
END $$;

-- Step 5: Create a helper function to calculate age from birth_year
CREATE OR REPLACE FUNCTION public.calculate_horse_age(birth_year_param INTEGER)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
    SELECT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - birth_year_param;
$$;

-- Step 6: Create a view that includes calculated age for backwards compatibility
DROP VIEW IF EXISTS public.horses_with_age;
CREATE OR REPLACE VIEW public.horses_with_age AS
SELECT
    *,
    public.calculate_horse_age(birth_year) as age
FROM public.horses;

-- Verify the migration
SELECT 'Migration Complete - age changed to birth_year' as status;

-- Show summary
SELECT
    COUNT(*) as total_horses,
    MIN(birth_year) as oldest_birth_year,
    MAX(birth_year) as youngest_birth_year,
    COUNT(DISTINCT organization_id) as organizations
FROM public.horses;

-- Show a few horses with calculated ages
SELECT
    name,
    birth_year,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - birth_year as calculated_age,
    breed,
    organization_id
FROM public.horses
ORDER BY birth_year DESC
LIMIT 10;
