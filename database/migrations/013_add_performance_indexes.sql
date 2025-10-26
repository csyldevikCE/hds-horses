-- =====================================================
-- Add Performance Indexes
-- =====================================================
-- This migration adds indexes to improve query performance
-- The organization_users.user_id query was taking 10+ seconds
-- due to missing indexes

-- Check existing indexes
SELECT
    '=== EXISTING INDEXES ===' as section;

SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('organization_users', 'organizations', 'horses')
ORDER BY tablename, indexname;

-- Add index on organization_users.user_id for fast user lookup
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id
ON public.organization_users(user_id);

-- Add index on organization_users.organization_id for fast org member lookup
CREATE INDEX IF NOT EXISTS idx_organization_users_org_id
ON public.organization_users(organization_id);

-- Add index on horses.organization_id for fast horse queries by org
CREATE INDEX IF NOT EXISTS idx_horses_organization_id
ON public.horses(organization_id);

-- Add index on horses.user_id for fast horse queries by user
CREATE INDEX IF NOT EXISTS idx_horses_user_id
ON public.horses(user_id);

-- Add composite index for common horse query pattern
CREATE INDEX IF NOT EXISTS idx_horses_org_created
ON public.horses(organization_id, created_at DESC);

-- Show new indexes
SELECT
    '=== NEW INDEXES CREATED ===' as section;

SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('organization_users', 'organizations', 'horses')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

SELECT '✅ Performance indexes created!' as message;
SELECT 'Organization queries should now be much faster' as result;
