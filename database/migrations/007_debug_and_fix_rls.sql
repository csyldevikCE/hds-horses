-- =====================================================
-- Debug and Fix RLS Policies for Signup
-- =====================================================

-- STEP 1: Check current policies
SELECT
    '=== CURRENT POLICIES ===' as section;

SELECT
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('organizations', 'organization_users')
ORDER BY tablename, cmd, policyname;

-- STEP 2: Drop ALL policies and start fresh
SELECT '=== DROPPING ALL POLICIES ===' as section;

-- Drop all organizations policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organizations')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.organizations', r.policyname);
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- Drop all organization_users policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organization_users')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.organization_users', r.policyname);
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- STEP 3: Create SIMPLE, PERMISSIVE policies for signup
SELECT '=== CREATING NEW SIMPLE POLICIES ===' as section;

-- Organizations: SELECT - view your own
CREATE POLICY "orgs_select"
ON public.organizations FOR SELECT
USING (created_by = auth.uid());

-- Organizations: INSERT - anyone can create
CREATE POLICY "orgs_insert"
ON public.organizations FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Organizations: UPDATE - only creator
CREATE POLICY "orgs_update"
ON public.organizations FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Organizations: DELETE - only creator
CREATE POLICY "orgs_delete"
ON public.organizations FOR DELETE
USING (created_by = auth.uid());

-- Organization Users: SELECT - see your own membership
CREATE POLICY "org_users_select"
ON public.organization_users FOR SELECT
USING (user_id = auth.uid());

-- Organization Users: INSERT - anyone can add themselves
CREATE POLICY "org_users_insert"
ON public.organization_users FOR INSERT
WITH CHECK (user_id = auth.uid() OR invited_by = auth.uid());

-- Organization Users: UPDATE - admins only (we'll handle this in app)
CREATE POLICY "org_users_update"
ON public.organization_users FOR UPDATE
USING (user_id = auth.uid());

-- Organization Users: DELETE - admins only (we'll handle this in app)
CREATE POLICY "org_users_delete"
ON public.organization_users FOR DELETE
USING (user_id = auth.uid());

-- STEP 4: Verify new policies
SELECT '=== NEW POLICIES CREATED ===' as section;

SELECT
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('organizations', 'organization_users')
ORDER BY tablename, cmd;

-- STEP 5: Test if signup would work
SELECT '=== TESTING POLICIES ===' as section;

-- This should work now
EXPLAIN (FORMAT TEXT)
INSERT INTO public.organizations (name, created_by)
VALUES ('Test Org', auth.uid());

SELECT '✅ RLS policies reset! Try signing up again.' as message;
