# Share Link Update Fix

## Issue
When attempting to update a share link, users receive the error:
```
"cannot coerce the result to a single JSON object"
```

## Root Cause
The `share_links` table only has **SELECT** policies defined in migration `023_fix_share_link_public_access_final.sql`. There are **no policies for INSERT, UPDATE, or DELETE** operations.

When `shareService.updateShareLink()` tries to update a record:
```typescript
const { data, error } = await supabase
  .from('share_links')
  .update(updates)
  .eq('id', shareLinkId)
  .select()
  .single()
```

The UPDATE operation is **blocked by RLS** (Row Level Security) because no UPDATE policy exists. This causes Supabase to return an error instead of the updated row.

## Existing Policies (Before Fix)
From `database/migrations/023_fix_share_link_public_access_final.sql`:
- ✅ `share_links_select_authenticated` - SELECT for organization members
- ✅ `share_links_select_public` - SELECT for everyone (public sharing)
- ❌ No INSERT policy
- ❌ No UPDATE policy
- ❌ No DELETE policy

## Solution
Created migration `029_add_share_links_write_policies.sql` which adds three new policies:

### 1. INSERT Policy
```sql
CREATE POLICY "share_links_insert_admin"
ON public.share_links
FOR INSERT
TO authenticated
WITH CHECK (
  -- Only organization admins can create share links
  EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.organization_id = share_links.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role = 'admin'
  )
);
```

### 2. UPDATE Policy
```sql
CREATE POLICY "share_links_update_admin"
ON public.share_links
FOR UPDATE
TO authenticated
USING (
  -- Only organization admins can update share links
  EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.organization_id = share_links.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role = 'admin'
  )
)
WITH CHECK (
  -- Ensure updated record still belongs to admin's org
  EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.organization_id = share_links.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role = 'admin'
  )
);
```

### 3. DELETE Policy
```sql
CREATE POLICY "share_links_delete_admin"
ON public.share_links
FOR DELETE
TO authenticated
USING (
  -- Only organization admins can delete share links
  EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.organization_id = share_links.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role = 'admin'
  )
);
```

## How to Apply the Fix

### Step 1: Run the Migration
1. Open Supabase SQL Editor
2. Open the file `database/migrations/029_add_share_links_write_policies.sql`
3. Copy and paste the entire contents into the SQL Editor
4. Click "Run" to execute the migration

### Step 2: Verify Policies Were Created
Run this query in Supabase SQL Editor:
```sql
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'share_links'
ORDER BY cmd, policyname;
```

You should see 6 policies total:
- 2 SELECT policies (existing)
- 1 INSERT policy (new)
- 1 UPDATE policy (new)
- 1 DELETE policy (new)

### Step 3: Test the Fix
1. Log in as an admin user
2. Navigate to a horse detail page
3. Click "Share" button
4. Create a share link
5. Click "Edit" on the share link
6. Change the recipient name or expiry time
7. Click "Update Share Link"
8. ✅ Update should succeed without errors

## Security Model
All write operations (INSERT, UPDATE, DELETE) are restricted to:
- **Authenticated users only** (not anonymous)
- **Admin role required** (not read-only users)
- **Same organization** (can only modify share links for their own organization)

This ensures:
- Read-only users cannot create/edit/delete share links
- Public/anonymous users cannot modify share links
- Organizations cannot interfere with each other's share links

## Files Modified
- ✅ Created: `database/migrations/029_add_share_links_write_policies.sql`
- ✅ Created: `docs/SHARE_LINK_UPDATE_FIX.md` (this file)

## Related Code
- `src/services/shareService.ts` - Lines 189-206 (updateShareLink function)
- `src/components/ShareHorse.tsx` - Lines 150-186 (updateShareLinkMutation)
- `database/migrations/023_fix_share_link_public_access_final.sql` - Original SELECT policies

## Testing Checklist
- [ ] Admin can create new share links
- [ ] Admin can update existing share links (recipient name, expiry, shared fields)
- [ ] Admin can delete share links
- [ ] Read-only users **cannot** create/update/delete share links
- [ ] Anonymous users **cannot** create/update/delete share links
- [ ] Anonymous users **can still view** share links via public URL
- [ ] Error message is clear if non-admin tries to modify share links

## Additional Notes
This issue existed since the initial share link implementation because migration `023_fix_share_link_public_access_final.sql` focused only on fixing public SELECT access for anonymous users. Write operations were never configured.

The `shareService.ts` code was correct all along - it was the database RLS policies that were incomplete.
