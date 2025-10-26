# Inviting Users to Your Organization (Manual Process)

The "Invite User" button in the Organization tab currently shows a placeholder. Here's how to manually add users to your organization until the full invitation system is implemented.

## Option 1: Manual Database Update (Current Workaround)

### Steps:

1. **Have the new user create an account:**
   - They go to `/signup` and create their account normally
   - They'll create their own organization (which we'll ignore)

2. **Get their User ID:**
   - Go to Supabase Dashboard → Authentication → Users
   - Find the new user by email
   - Copy their `ID` (UUID)

3. **Add them to your organization:**
   - Go to Supabase Dashboard → Table Editor → `organization_users`
   - Click "Insert" → "Insert row"
   - Fill in:
     - `organization_id`: Your organization ID (copy from an existing row)
     - `user_id`: The new user's ID (from step 2)
     - `role`: Either `admin` or `read_only`
     - `invited_by`: Your user ID
     - Leave other fields as default

4. **Remove their old organization (optional):**
   - Go to Table Editor → `organizations`
   - Find and delete the organization they auto-created
   - Their horses will remain in their old organization, so this step is optional

### To Find Your Organization ID:

```sql
-- Run in Supabase SQL Editor
SELECT organization_id
FROM organization_users
WHERE user_id = 'YOUR_USER_ID_HERE';
```

## Option 2: SQL Script

Run this in Supabase SQL Editor:

```sql
-- Replace these values:
-- NEW_USER_EMAIL: The email of the user you want to add
-- YOUR_EMAIL: Your email (the admin)
-- ROLE: Either 'admin' or 'read_only'

INSERT INTO public.organization_users (organization_id, user_id, role, invited_by)
SELECT
  ou.organization_id,  -- Your organization ID
  (SELECT id FROM auth.users WHERE email = 'NEW_USER_EMAIL'),  -- New user's ID
  'read_only'::TEXT,  -- Change to 'admin' if needed
  ou.user_id  -- Your user ID (the inviter)
FROM public.organization_users ou
WHERE ou.user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL')
LIMIT 1;
```

### Example:

```sql
INSERT INTO public.organization_users (organization_id, user_id, role, invited_by)
SELECT
  ou.organization_id,
  (SELECT id FROM auth.users WHERE email = 'newuser@example.com'),
  'read_only'::TEXT,
  ou.user_id
FROM public.organization_users ou
WHERE ou.user_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com')
LIMIT 1;
```

## Verification

After adding the user, verify they're in your organization:

```sql
SELECT
  ou.role,
  au.email,
  o.name as organization_name
FROM organization_users ou
JOIN auth.users au ON au.id = ou.user_id
JOIN organizations o ON o.id = ou.organization_id
WHERE ou.organization_id = 'YOUR_ORG_ID';
```

## Limitations

- **No email notification**: Users won't receive an email, so you'll need to tell them manually
- **Manual process**: Requires database access (Supabase Dashboard)
- **No expiration**: No automatic cleanup of old invitations

## Future Enhancement

A full invitation system with email sending is planned for a future update. This will include:
- Email invitations with signup links
- Automatic organization assignment
- Invitation expiration
- Invitation management UI

## Role Permissions

### Admin
- Full access to all horses
- Can create, edit, and delete horses
- Can upload media and X-rays
- Can manage team members (invite, remove, change roles)
- Can create and manage share links

### Read-Only
- Can view all horses
- Cannot create, edit, or delete
- Cannot upload media or X-rays
- Cannot manage team members
- Cannot create share links

## Support

If you have any issues with this process, please reach out to support with:
- Your email address
- The new user's email address
- The role you want to assign them
