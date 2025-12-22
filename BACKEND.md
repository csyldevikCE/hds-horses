# Backend Implementation Guide for Frontend Agent

This document describes all backend implementations created for security, GDPR compliance, and performance improvements. **Frontend agent should read this file** to understand how to integrate with the new backend services.

**Documentation Location**: `/BACKEND.md` (project root)

Last Updated: 2024-12-17

---

## Table of Contents

1. [Audit Logging](#1-audit-logging-sec-010)
2. [Rate Limiting](#2-rate-limiting-sec-005)
3. [Share Link Password Hashing](#3-share-link-password-hashing-sec-008)
4. [Share Link Password Verification](#4-share-link-password-verification-sec-008)
5. [Account Deletion (GDPR)](#5-account-deletion-gdpr-001)
6. [Data Export (GDPR)](#6-data-export-gdpr-003)
7. [Storage File Validation](#7-storage-file-validation-sec-009)
8. [Deployment Instructions](#8-deployment-instructions)
9. [Implementation Status](#9-implementation-status)

---

## 1. Audit Logging (SEC-010)

### Overview
Automatic audit logging for sensitive operations. Logs are immutable and only viewable by organization admins.

### Files
- Migration: `supabase/migrations/20241217_audit_logging.sql`
- Table: `audit_log`

### Automatically Logged Operations
These operations are automatically logged via database triggers:
- Horse CREATE/UPDATE/DELETE
- Share link CREATE/DELETE
- Organization user ADD/REMOVE/ROLE_CHANGE

### Frontend Integration

#### Create Audit Service
```typescript
// src/services/auditService.ts
import { supabase } from '@/lib/supabase'

export interface AuditLogEntry {
  id: string
  timestamp: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  metadata: Record<string, unknown>
  user_email: string
}

export interface GetAuditLogsParams {
  organizationId: string
  limit?: number
  offset?: number
  action?: string
  entityType?: string
  startDate?: string
  endDate?: string
}

export async function getOrganizationAuditLogs(params: GetAuditLogsParams): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase.rpc('get_organization_audit_logs', {
    p_organization_id: params.organizationId,
    p_limit: params.limit || 100,
    p_offset: params.offset || 0,
    p_action: params.action || null,
    p_entity_type: params.entityType || null,
    p_start_date: params.startDate || null,
    p_end_date: params.endDate || null,
  })

  if (error) throw error
  return data
}
```

#### Action Types
- `CREATE`, `UPDATE`, `DELETE` - Entity operations
- `USER_ADDED`, `USER_REMOVED`, `ROLE_CHANGED` - Organization user changes
- `LOGIN`, `LOGOUT` - Authentication (if manually logged)
- `DATA_EXPORT` - Data exports
- `ACCOUNT_DELETION_REQUESTED`, `ACCOUNT_DELETED` - Account deletion

#### Entity Types
- `horse`, `share_link`, `organization_user`, `user`

#### UI Component Suggestion
Create an admin-only "Audit Log" tab in organization settings that displays:
- Timeline of actions
- Filter by action type, entity type, date range
- Show user email, action, entity, and timestamp

---

## 2. Rate Limiting (SEC-005)

### Overview
Prevents brute force attacks on authentication and sensitive operations.

### Files
- Edge Function: `supabase/functions/rate-limit/index.ts`
- Migration: `supabase/migrations/20241217_rate_limits.sql`

### Rate Limits
| Action | Max Attempts | Window | Block Duration |
|--------|--------------|--------|----------------|
| `login` | 5 | 15 min | 15 min |
| `signup` | 3 | 60 min | 60 min |
| `password_reset` | 3 | 60 min | 60 min |
| `share_link_password` | 5 | 60 min | 60 min |

### API

**Endpoint**: `POST /functions/v1/rate-limit`

**Request Body**:
```typescript
{
  action: 'login' | 'signup' | 'password_reset' | 'share_link_password'
  identifier: string  // IP address, email, or share link ID
  increment?: boolean // Default: true. Set false to check without incrementing
}
```

**Response**:
```typescript
{
  allowed: boolean
  remaining: number
  resetAt: string      // ISO timestamp
  retryAfter?: number  // Seconds (only if blocked)
}
```

### Frontend Integration

#### Create Rate Limit Service
```typescript
// src/services/rateLimitService.ts
import { supabase } from '@/lib/supabase'

export type RateLimitAction = 'login' | 'signup' | 'password_reset' | 'share_link_password'

export interface RateLimitResponse {
  allowed: boolean
  remaining: number
  resetAt: string
  retryAfter?: number
}

export async function checkRateLimit(
  action: RateLimitAction,
  identifier: string,
  increment: boolean = true
): Promise<RateLimitResponse> {
  const { data, error } = await supabase.functions.invoke('rate-limit', {
    body: { action, identifier, increment }
  })

  if (error) {
    console.error('Rate limit check failed:', error)
    return { allowed: true, remaining: 5, resetAt: new Date().toISOString() }
  }

  return data
}

// Helper to get client IP
export async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch {
    return 'unknown'
  }
}
```

#### Update Login.tsx
```typescript
import { checkRateLimit, getClientIP } from '@/services/rateLimitService'

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')

  const clientIP = await getClientIP()
  const rateCheck = await checkRateLimit('login', clientIP)

  if (!rateCheck.allowed) {
    const minutes = Math.ceil((rateCheck.retryAfter || 900) / 60)
    setError(`Too many login attempts. Please try again in ${minutes} minutes.`)
    return
  }

  // ... existing login logic ...
}
```

#### Update Signup.tsx
```typescript
const rateCheck = await checkRateLimit('signup', clientIP)
if (!rateCheck.allowed) {
  setError(`Too many signup attempts. Please try again later.`)
  return
}
```

---

## 3. Share Link Password Hashing (SEC-008)

### Overview
Server-side password hashing for share links. More secure than client-side hashing because the password hash is never visible in browser devtools.

### Files
- Edge Function: `supabase/functions/create-share-link/index.ts`

### API

**Endpoint**: `POST /functions/v1/create-share-link`

**Headers**: `Authorization: Bearer <user_token>`

**Request Body**:
```typescript
{
  horseId: string
  organizationId: string
  recipientName: string
  linkType: 'standard' | 'one_time' | 'password_protected'
  expiresAt: string      // ISO date
  password?: string      // Plain text (only for password_protected)
  maxViews?: number      // For one_time links
  sharedFields: string[]
}
```

**Response**: ShareLink object (without password_hash)

### Frontend Integration

#### Replace createShareLink in shareService.ts
```typescript
// In src/services/shareService.ts - REPLACE the createShareLink method

async createShareLink(params: CreateShareLinkParams): Promise<ShareLink> {
  const { data, error } = await supabase.functions.invoke('create-share-link', {
    body: {
      horseId: params.horseId,
      organizationId: params.organizationId,
      recipientName: params.recipientName,
      linkType: params.linkType,
      expiresAt: params.expiresAt,
      password: params.password,  // Plain text - hashed server-side
      maxViews: params.maxViews,
      sharedFields: params.sharedFields,
    }
  })

  if (error) throw error
  return data
}
```

#### Remove Client-Side Dependencies
Remove from `shareService.ts`:
- `import bcrypt from 'bcryptjs'`
- `hashPassword()` method
- Any `bcrypt.hash()` calls

You can also remove `bcryptjs` from `package.json` if no other files use it.

---

## 4. Share Link Password Verification (SEC-008)

### Overview
Server-side password verification with built-in rate limiting.

### Files
- Edge Function: `supabase/functions/verify-share-password/index.ts`

### API

**Endpoint**: `POST /functions/v1/verify-share-password`

**Request Body**:
```typescript
{
  token: string    // Share link token
  password: string // Plain text password to verify
}
```

**Response**:
```typescript
{
  valid: boolean
  error?: string
  rateLimited?: boolean
  retryAfter?: number  // Seconds until retry allowed
}
```

### Frontend Integration

#### Update shareService.ts
```typescript
// Add this method to shareService.ts

async verifySharePassword(token: string, password: string): Promise<{ valid: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('verify-share-password', {
    body: { token, password }
  })

  if (error) {
    console.error('Password verification failed:', error)
    return { valid: false, error: 'Failed to verify password' }
  }

  if (data.rateLimited) {
    const minutes = Math.ceil((data.retryAfter || 3600) / 60)
    return { valid: false, error: `Too many attempts. Try again in ${minutes} minutes.` }
  }

  return { valid: data.valid, error: data.error }
}
```

#### Update SharedHorse.tsx
```typescript
// Replace the password verification logic

const handlePasswordSubmit = async () => {
  setPasswordError('')

  const result = await shareService.verifySharePassword(token, passwordInput)

  if (!result.valid) {
    setPasswordError(result.error || 'Incorrect password')
    return
  }

  // Password correct - now fetch the horse data
  setPasswordVerified(true)
  // ... fetch horse data ...
}
```

---

## 5. Account Deletion (GDPR-001)

### Overview
Allows users to delete their account and all associated data per GDPR Article 17 (Right to Erasure).

### Files
- Edge Function: `supabase/functions/delete-account/index.ts`

### What Gets Deleted
1. User's horses (if sole owner)
2. All horse images/videos from Storage
3. All X-rays from Storage
4. All vet documents from Storage
5. Vaccinations, vet visits, competitions
6. Share links
7. Organization memberships
8. Invitations sent by user
9. User auth profile

### API

**Endpoint**: `POST /functions/v1/delete-account`

**Headers**: `Authorization: Bearer <user_token>`

**Request Body**:
```typescript
{
  confirmation: "DELETE MY ACCOUNT"  // Exact phrase required
}
```

**Response**:
```typescript
{
  success: boolean
  deletedEntities: {
    horses: number
    images: number
    videos: number
    documents: number
    vaccinations: number
    vetVisits: number
    competitions: number
    shareLinks: number
    xrays: number
  }
  error?: string
}
```

### Frontend Integration

#### Create Account Service
```typescript
// src/services/accountService.ts
import { supabase } from '@/lib/supabase'

export interface DeleteAccountResult {
  success: boolean
  deletedEntities: {
    horses: number
    images: number
    videos: number
    documents: number
    vaccinations: number
    vetVisits: number
    competitions: number
    shareLinks: number
    xrays: number
  }
}

export async function deleteAccount(confirmationPhrase: string): Promise<DeleteAccountResult> {
  if (confirmationPhrase !== 'DELETE MY ACCOUNT') {
    throw new Error('Invalid confirmation phrase')
  }

  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: { confirmation: confirmationPhrase }
  })

  if (error) throw error
  return data
}
```

#### Settings Page Component
```tsx
// Add to Settings.tsx or create AccountSettings.tsx

const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
const [confirmPhrase, setConfirmPhrase] = useState('')
const [isDeleting, setIsDeleting] = useState(false)
const [deleteError, setDeleteError] = useState('')

const handleDeleteAccount = async () => {
  if (confirmPhrase !== 'DELETE MY ACCOUNT') {
    setDeleteError('Please type "DELETE MY ACCOUNT" to confirm')
    return
  }

  setIsDeleting(true)
  setDeleteError('')

  try {
    const result = await deleteAccount(confirmPhrase)

    if (result.success) {
      // Sign out and redirect
      await supabase.auth.signOut()
      navigate('/login', {
        state: { message: 'Your account has been deleted.' }
      })
    }
  } catch (error) {
    setDeleteError('Failed to delete account. Please contact support.')
  } finally {
    setIsDeleting(false)
  }
}

// UI:
// - Warning about permanent deletion
// - List what will be deleted
// - Text input for confirmation phrase
// - Delete button (red, disabled until phrase matches)
```

---

## 6. Data Export (GDPR-003)

### Overview
Allows users to export all their data in JSON format per GDPR Article 20 (Right to Data Portability).

### Files
- Edge Function: `supabase/functions/export-data/index.ts`

### Export Format
```typescript
{
  exportDate: string        // ISO timestamp
  exportVersion: "1.0"
  user: {
    id: string
    email: string
    created_at: string
  }
  organizations: Array<{
    id: string
    name: string
    role: string
    joined_at: string
  }>
  horses: Array<{
    id: string
    name: string
    breed: string
    // ... all horse fields
    images: Array<{ id, url, caption, is_primary }>
    videos: Array<{ id, url, caption }>
    vaccinations: Array<{ ... }>
    vet_visits: Array<{ ... }>
    competitions: Array<{ ... }>
    xrays: Array<{ id, url, date_taken, body_part, notes }>
  }>
  shareLinks: Array<{
    id: string
    horse_name: string
    recipient_name: string
    link_type: string
    created_at: string
    expires_at: string
    view_count: number
  }>
}
```

### API

**Endpoint**: `POST /functions/v1/export-data`

**Headers**: `Authorization: Bearer <user_token>`

**Response**: JSON object with all user data. Images/videos include signed URLs valid for 24 hours.

### Frontend Integration

#### Create Data Export Service
```typescript
// src/services/dataExportService.ts
import { supabase } from '@/lib/supabase'

export async function exportUserData(): Promise<Blob> {
  const { data, error } = await supabase.functions.invoke('export-data')

  if (error) throw error

  const jsonString = JSON.stringify(data, null, 2)
  return new Blob([jsonString], { type: 'application/json' })
}

export function downloadExport(blob: Blob, filename?: string) {
  const date = new Date().toISOString().split('T')[0]
  const finalFilename = filename || `hds-horses-export-${date}.json`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = finalFilename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

#### Settings Page Component
```tsx
const [isExporting, setIsExporting] = useState(false)

const handleExportData = async () => {
  setIsExporting(true)
  try {
    const blob = await exportUserData()
    downloadExport(blob)
  } catch (error) {
    // Show error toast
  } finally {
    setIsExporting(false)
  }
}

// UI:
// - "Export My Data" button
// - Explanation of what's included
// - Loading state during export
```

---

## 7. Storage File Validation (SEC-009)

### Overview
Server-side file type validation for uploads. Configured via Supabase Storage bucket settings.

### Files
- Migration (documentation): `supabase/migrations/20241217_storage_policies.sql`

### Allowed File Types

| Bucket | Allowed Extensions | Allowed MIME Types |
|--------|-------------------|-------------------|
| `horse-media` | jpg, jpeg, png, gif, webp, mp4, mov, webm, avi | `image/*`, `video/*` |
| `horse-xrays` | jpg, jpeg, png, dcm, dicom | `image/*`, `application/dicom` |
| `vet-documents` | pdf, jpg, jpeg, png | `application/pdf`, `image/*` |

### Configuration
Storage policies must be configured in Supabase Dashboard > Storage > [bucket] > Policies.
See `supabase/migrations/20241217_storage_policies.sql` for policy definitions.

### Frontend Integration
No code changes needed. Existing client-side validation remains for UX.

Handle upload errors:
```typescript
try {
  await uploadFile(file)
} catch (error) {
  if (error.message?.includes('mime type') || error.message?.includes('not allowed')) {
    setError('This file type is not allowed.')
  } else {
    setError('Upload failed. Please try again.')
  }
}
```

---

## 8. Deployment Instructions

### 1. Run Database Migrations

In Supabase Dashboard > SQL Editor, run in order:
1. `20241217_rate_limits.sql`
2. `20241217_audit_logging.sql`
3. Configure storage policies from `20241217_storage_policies.sql`

### 2. Deploy Edge Functions

```bash
# From project root
cd supabase

# Deploy all functions
supabase functions deploy rate-limit
supabase functions deploy create-share-link
supabase functions deploy verify-share-password
supabase functions deploy delete-account
supabase functions deploy export-data
```

Or deploy all at once:
```bash
supabase functions deploy
```

### 3. Configure Storage Buckets

In Supabase Dashboard > Storage:
1. Click on each bucket (horse-media, horse-xrays, vet-documents)
2. Go to "Policies" tab
3. Add the policies documented in `20241217_storage_policies.sql`
4. Update bucket settings to restrict `allowed_mime_types`

### 4. Environment Variables

Edge functions automatically have access to:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

No additional configuration needed.

---

## 9. Implementation Status

| Feature | Backend | Migration | Edge Function | Frontend Integration |
|---------|---------|-----------|---------------|---------------------|
| Audit Logging | DONE | DONE | N/A (triggers) | **TODO**: Admin UI |
| Rate Limiting | DONE | DONE | DONE | **TODO** |
| Share Link Creation | DONE | N/A | DONE | **TODO**: Update shareService |
| Password Verification | DONE | N/A | DONE | **TODO**: Update SharedHorse |
| Account Deletion | DONE | N/A | DONE | **TODO**: Settings page |
| Data Export | DONE | N/A | DONE | **TODO**: Settings page |
| Storage Validation | DONE | DONE (docs) | N/A (dashboard) | N/A |

### Files to Modify (Frontend)

1. **`src/services/shareService.ts`**
   - Replace `createShareLink` to use Edge Function
   - Add `verifySharePassword` method
   - Remove bcrypt import and `hashPassword` method

2. **`src/services/rateLimitService.ts`** (new file)
   - Create rate limit checking functions

3. **`src/services/accountService.ts`** (new file)
   - Create account deletion function

4. **`src/services/dataExportService.ts`** (new file)
   - Create data export and download functions

5. **`src/services/auditService.ts`** (new file)
   - Create audit log query function

6. **`src/pages/Login.tsx`**
   - Add rate limiting before login attempt

7. **`src/pages/Signup.tsx`**
   - Add rate limiting before signup attempt

8. **`src/pages/SharedHorse.tsx`**
   - Use `verifySharePassword` Edge Function

9. **`src/pages/Settings.tsx`** (or new AccountSettings.tsx)
   - Add "Delete Account" section
   - Add "Export My Data" section

10. **Admin UI** (new component)
    - Create audit log viewer for organization admins

---

## Questions?

If you have questions about integrating these backend services:
1. Check the Edge Function source code in `supabase/functions/`
2. Check the migration files in `supabase/migrations/`
3. Review the TODO.md for original requirements and acceptance criteria
