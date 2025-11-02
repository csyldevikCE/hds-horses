# Invitation System - Setup and Testing Guide

## Overview

The invitation system allows administrators to invite new users to their organization via shareable links. Invitations are token-based and don't require email sending infrastructure.

## Implementation Complete

✅ **Database Migration**: `database/migrations/026_create_invitations_table.sql`
✅ **AuthContext**: Updated to handle invitation-based signups
✅ **ProfileDialog**: Generate and copy invitation links
✅ **Signup Page**: Accept invitation tokens and show organization info
✅ **UI Updates**: Dynamic form that adapts for invitations vs regular signup

## Setup Instructions

### Step 1: Run Database Migration

Run this SQL in your Supabase SQL Editor:

```bash
# The migration file is located at:
database/migrations/026_create_invitations_table.sql
```

This will create:
- `invitations` table with columns: id, organization_id, token, email, role, invited_by, expires_at, used_at, used_by, created_at
- Indexes on token, organization_id, and email for performance
- RLS policies for secure access (org members, admins, anonymous users)

### Step 2: Verify Migration

Run this in Supabase SQL Editor to verify:

```sql
-- Check table exists
SELECT * FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'invitations';

-- Check policies exist
SELECT * FROM pg_policies
WHERE tablename = 'invitations';
```

## How It Works

### For Administrators

1. **Go to Profile Dialog**:
   - Click your avatar in top right
   - Go to "Organization" tab
   - Click "Invite User" button

2. **Fill Invitation Form**:
   - Enter invitee's email address
   - Select role (Admin or Read-Only)
   - Click "Send Invitation"

3. **Share the Link**:
   - Link is automatically copied to clipboard
   - Link format: `https://your-domain.com/signup?invite=<token>`
   - Link expires in 7 days
   - Share the link via email, Slack, or any communication method

### For Invited Users

1. **Click Invitation Link**:
   - Opens signup page with pre-filled information
   - Shows organization name they're being invited to
   - Shows the role they'll have

2. **Complete Signup**:
   - Enter first name and last name
   - Email is pre-filled from invitation (read-only)
   - Create password
   - Click "Create account"

3. **Automatic Setup**:
   - User account is created
   - User is added to the organization with specified role
   - Invitation is marked as used
   - User is redirected to login

## Testing the Invitation Flow

### Test Case 1: Admin Inviting a Read-Only User

1. **As Admin**:
   - Login to your account
   - Click avatar → Organization tab
   - Click "Invite User"
   - Email: `testuser@example.com`
   - Role: Read-Only
   - Click "Send Invitation"
   - Verify link is copied to clipboard

2. **As Invited User**:
   - Open invitation link in incognito/private window
   - Verify:
     - Organization name is shown
     - Email is pre-filled
     - Organization name field is hidden
     - Role is displayed ("member")
   - Fill in: First Name, Last Name, Password
   - Click "Create account"
   - Should redirect to login

3. **Verify**:
   - Login with new account
   - Verify you see the organization's horses
   - Verify you cannot edit/delete (read-only access)
   - Check admin's organization tab shows new member

### Test Case 2: Admin Inviting Another Admin

Same as above but with "Admin" role selected. New user should have full access.

### Test Case 3: Expired Invitation

1. **Create invitation** (as admin)
2. **Manually expire it** in Supabase:
   ```sql
   UPDATE invitations
   SET expires_at = NOW() - INTERVAL '1 day'
   WHERE token = 'your-token-here';
   ```
3. **Try to use link**: Should show "This invitation has expired" error

### Test Case 4: Already Used Invitation

1. **Complete signup** with invitation link
2. **Try to use same link again**: Should show "Invalid or already used invitation link" error

### Test Case 5: Regular Signup (No Invitation)

1. Go to `/signup` (no invite parameter)
2. Should show:
   - Organization Name field (required)
   - First Name / Last Name fields
   - Email field (editable)
   - Password fields
3. Complete signup
4. Should create new organization and set user as admin

## Database Validation Queries

### Check Active Invitations

```sql
SELECT
  i.email,
  i.role,
  i.expires_at,
  i.used_at,
  o.name as organization_name,
  au.email as invited_by_email
FROM invitations i
JOIN organizations o ON o.id = i.organization_id
JOIN auth.users au ON au.id = i.invited_by
WHERE i.used_at IS NULL
AND i.expires_at > NOW()
ORDER BY i.created_at DESC;
```

### Check Used Invitations

```sql
SELECT
  i.email,
  i.role,
  i.used_at,
  o.name as organization_name,
  au.email as used_by_email
FROM invitations i
JOIN organizations o ON o.id = i.organization_id
LEFT JOIN auth.users au ON au.id = i.used_by
WHERE i.used_at IS NOT NULL
ORDER BY i.used_at DESC;
```

### Check Organization Members

```sql
SELECT
  p.first_name,
  p.last_name,
  au.email,
  ou.role,
  ou.joined_at,
  o.name as organization_name
FROM organization_users ou
JOIN auth.users au ON au.id = ou.user_id
JOIN profiles p ON p.id = ou.user_id
JOIN organizations o ON o.id = ou.organization_id
WHERE o.id = 'your-org-id-here'
ORDER BY ou.joined_at DESC;
```

## Features

### Security
- ✅ Token-based with UUID (cryptographically secure)
- ✅ 7-day expiration
- ✅ One-time use (marked as used after signup)
- ✅ RLS policies prevent unauthorized access
- ✅ Email validation (must match invitation email)

### User Experience
- ✅ One-click copy to clipboard
- ✅ Pre-filled email
- ✅ Shows organization name
- ✅ Shows role they'll receive
- ✅ Clear error messages (expired, already used)
- ✅ Mobile-friendly UI

### Admin Experience
- ✅ Simple form in profile dialog
- ✅ Instant link generation
- ✅ Auto-copy to clipboard
- ✅ Clear success message with instructions
- ✅ Can track invitations in database

## Troubleshooting

### Issue: "Invalid or already used invitation link"

**Causes**:
- Link was already used
- Token doesn't exist in database
- Database migration not run

**Solution**:
1. Check if invitation exists and is unused:
   ```sql
   SELECT * FROM invitations WHERE token = 'your-token-here';
   ```
2. Verify `used_at` is NULL
3. Verify migration 026 was run

### Issue: "This invitation has expired"

**Causes**:
- More than 7 days have passed since invitation was created

**Solution**:
- Admin needs to create a new invitation link

### Issue: Email field is not editable

This is expected behavior! Email is pre-filled from the invitation and cannot be changed. The invitation is specifically for that email address.

### Issue: Organization name field is shown for invitation

This is a bug. The organization name field should be hidden when using an invitation. Check:
1. `invitation` state is properly set in Signup.tsx
2. Conditional rendering: `{!invitation && (<organizationNameField>)}`

### Issue: User is not added to organization after signup

**Check**:
1. AuthContext signUp function is handling inviteToken parameter
2. organization_users table insert is successful
3. invitation is marked as used (used_at and used_by are set)

**Debug SQL**:
```sql
-- Check if user was added to org
SELECT * FROM organization_users WHERE user_id = 'user-id-here';

-- Check if invitation was marked as used
SELECT * FROM invitations WHERE token = 'token-here';
```

## Future Enhancements

Potential improvements for later:
- [ ] Email sending integration (SendGrid, AWS SES, etc.)
- [ ] Invitation management UI (view/revoke pending invitations)
- [ ] Custom invitation messages
- [ ] Invitation analytics (views, accepts, declines)
- [ ] Bulk invitations
- [ ] Invitation templates by role
- [ ] Resend invitation button

## Files Modified

### Database
- `database/migrations/026_create_invitations_table.sql` - New table and policies

### TypeScript Types
- `src/lib/supabase.ts` - Added `invitations` table types

### Backend Logic
- `src/contexts/AuthContext.tsx` - Updated signUp() to handle invitations

### UI Components
- `src/components/ProfileDialog.tsx` - Added invitation link generation
- `src/pages/Signup.tsx` - Added invitation handling and UI

## Summary

The invitation system is now fully functional and ready to test. The implementation:

1. ✅ Generates secure, unique invitation links
2. ✅ Validates invitations (expiry, already used)
3. ✅ Pre-fills user information
4. ✅ Adds users to organizations automatically
5. ✅ Marks invitations as used
6. ✅ Supports both admin and read-only roles
7. ✅ Works alongside regular signup flow

**Next Steps**:
1. Run database migration 026
2. Test the invitation flow
3. Deploy to production
