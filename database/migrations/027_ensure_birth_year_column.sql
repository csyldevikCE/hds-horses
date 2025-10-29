-- =====================================================
-- Ensure birth_year column exists and is properly configured
-- =====================================================
-- This migration ensures the horses table has birth_year instead of age

-- Step 1: Add birth_year column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'horses'
        AND column_name = 'birth_year'
    ) THEN
        ALTER TABLE public.horses ADD COLUMN birth_year INTEGER;
        RAISE NOTICE 'Added birth_year column';
    ELSE
        RAISE NOTICE 'birth_year column already exists';
    END IF;
END $$;

-- Step 2: Drop age column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'horses'
        AND column_name = 'age'
    ) THEN
        -- Migrate data from age to birth_year before dropping
        UPDATE public.horses
        SET birth_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - age
        WHERE birth_year IS NULL;

        ALTER TABLE public.horses DROP COLUMN age;
        RAISE NOTICE 'Migrated data and dropped age column';
    ELSE
        RAISE NOTICE 'age column does not exist (already dropped or never existed)';
    END IF;
END $$;

-- Step 3: Ensure birth_year is NOT NULL
-- First, check if there are any NULL values
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM public.horses
    WHERE birth_year IS NULL;

    IF null_count > 0 THEN
        RAISE WARNING 'Found % horses with NULL birth_year. These need to be manually updated.', null_count;

        -- List the horses with NULL birth_year
        RAISE NOTICE 'Horses with NULL birth_year:';
        FOR rec IN (SELECT id, name FROM public.horses WHERE birth_year IS NULL)
        LOOP
            RAISE NOTICE '  - ID: %, Name: %', rec.id, rec.name;
        END LOOP;
    ELSE
        -- Only set NOT NULL if no NULL values exist
        ALTER TABLE public.horses ALTER COLUMN birth_year SET NOT NULL;
        RAISE NOTICE 'Set birth_year to NOT NULL';
    END IF;
END $$;

-- Step 4: Create helper function to calculate age from birth_year
CREATE OR REPLACE FUNCTION public.calculate_horse_age(birth_year_param INTEGER)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
    SELECT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - birth_year_param;
$$;

-- Step 5: Create a view with calculated age for backwards compatibility
DROP VIEW IF EXISTS public.horses_with_age;
CREATE OR REPLACE VIEW public.horses_with_age AS
SELECT
    h.*,
    public.calculate_horse_age(h.birth_year) as age
FROM public.horses h;

-- Verify the migration
SELECT '✓ Migration Complete - birth_year column is ready' as status;

-- Show summary of all horses
SELECT
    COUNT(*) as total_horses,
    COUNT(DISTINCT organization_id) as organizations,
    MIN(birth_year) as oldest_birth_year,
    MAX(birth_year) as newest_birth_year,
    MIN(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - birth_year) as youngest_age,
    MAX(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - birth_year) as oldest_age
FROM public.horses;

-- Show sample of horses with calculated ages
SELECT
    name,
    birth_year,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - birth_year as age,
    breed,
    status
FROM public.horses
ORDER BY birth_year DESC
LIMIT 10;
