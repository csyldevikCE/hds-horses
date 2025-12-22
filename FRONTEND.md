# Frontend Implementation Guide for Backend Agent

This document tracks frontend implementation progress and provides context for backend integration. **Backend agent should read this file** to understand frontend status and any blockers.

Last Updated: 2024-12-17

---

## Table of Contents

1. [Current Status](#current-status)
2. [Completed Items](#completed-items)
3. [Ready for Integration (Backend Complete)](#ready-for-integration)
4. [Pending Tasks](#pending-tasks)
5. [Blocked - Waiting on Backend](#blocked---waiting-on-backend)
6. [Technical Notes](#technical-notes)

---

## Current Status

| Task | Priority | Backend Ready | Frontend Status |
|------|----------|---------------|-----------------|
| Rate Limiting Integration (SEC-005) | HIGH | YES | **DONE** |
| Password Strength (SEC-004) | HIGH | N/A | **DONE** |
| ProtectedRoute Org Check (SEC-006) | HIGH | N/A | **DONE** |
| Memoization (PERF-004) | MEDIUM | N/A | **DONE** |
| Remove refetchOnMount (PERF-005) | MEDIUM | N/A | **DONE** |
| Query Invalidation (PERF-006) | MEDIUM | N/A | **DONE** |
| Share Link Password Hashing (SEC-008) | MEDIUM | YES | Pending |
| Audit Log Admin UI (SEC-010) | MEDIUM | YES | Pending |
| Privacy Consent Banner (SEC-003) | CRITICAL | N/A | Pending |

---

## Completed Items

### 1. Rate Limiting Integration (SEC-005) - DONE

**Files Created**:
- `src/services/rateLimitService.ts` - Service with `checkRateLimit()`, `getClientIP()`, `formatRetryTime()`

**Files Modified**:
- `src/pages/Login.tsx` - Rate limit check before auth
- `src/pages/Signup.tsx` - Rate limit check before signup
- `src/pages/SharedHorse.tsx` - Rate limit check for share link password

**Implementation**:
- Uses backend edge function `rate-limit`
- Caches client IP for subsequent calls
- Shows user-friendly error with retry time

---

### 2. Password Strength Requirements (SEC-004) - DONE

**Files Created**:
- `src/lib/validation.ts` - Zod schemas for password validation

**Files Modified**:
- `src/pages/Signup.tsx` - Uses strong password validation + visual indicator

**Implementation**:
- 12+ characters required
- Must contain: uppercase, lowercase, number, special character
- Visual strength bar (red/yellow/green)
- Real-time requirements checklist

---

### 3. Organization Check in ProtectedRoute (SEC-006) - DONE

**Files Modified**:
- `src/components/ProtectedRoute.tsx`

**Implementation**:
- Checks `organization` in addition to `user`
- Shows loading state while checking organization
- Displays helpful message with sign-out option if no org found
- No flash of protected content

---

### 4. Memoization (PERF-004) - DONE

**Files Modified**:
- `src/pages/Index.tsx` - Filter options and stats memoized with `useMemo`
- `src/components/HorseCard.tsx` - Wrapped with `React.memo`

**Changes**:
- Filter options (breeds, statuses, ages) memoized
- Filtered horses calculation memoized
- Stats (availableCount, avgAge, breedsCount) memoized
- HorseCard prevents unnecessary re-renders

---

### 5. Remove refetchOnMount (PERF-005) - DONE

**Files Modified**:
- `src/components/VaccinationLog.tsx` - Lines 35, 42
- `src/components/VetVisitList.tsx` - Line 35
- `src/components/ShareHorse.tsx` - Line 76

**Change**: Removed `refetchOnMount: true` - global staleTime handles freshness

---

### 6. Query Invalidation Standardization (PERF-006) - DONE

**Files Modified**:
- `src/components/VaccinationLog.tsx` - Lines 49-51
- `src/components/VetVisitList.tsx` - Lines 42-43
- `src/components/XRayUpload.tsx` - Lines 95-96

**Change**: Removed `await` from `invalidateQueries()` calls to prevent UI blocking

---

## Ready for Integration

These tasks have backend support completed per BACKEND.md.

### Share Link Password Hashing (SEC-008)

**Status**: Pending
**Backend**: Edge Function `create-share-link` deployed

**Files to Modify**:
- `src/services/shareService.ts`

**Changes Required**:
1. Remove `bcryptjs` import
2. Remove `hashPassword()` method
3. Replace `createShareLink` to call edge function instead of direct Supabase insert
4. Send plain text password to edge function (hashed server-side)

**Note for Backend**: Password verification edge function (`verify-share-password`) is marked TODO in BACKEND.md.

---

### Audit Log Admin UI (SEC-010)

**Status**: Pending
**Backend**: Database table + RPC function deployed

**Files to Create**:
- `src/services/auditService.ts` (NEW)
- `src/pages/AuditLog.tsx` (NEW) or add to existing Admin/Settings page
- `src/App.tsx` (add route)

**Features to Implement**:
- Paginated list of audit log entries
- Filters: action type, entity type, date range
- Only visible to organization admins (use `userRole` from AuthContext)
- Display: timestamp, user email, action, entity, metadata

---

## Pending Tasks

### SEC-003: Privacy Consent Banner for Share Links

**Status**: Pending
**Priority**: CRITICAL (GDPR)

**Files to Create**:
- `src/components/PrivacyConsentBanner.tsx` (NEW)

**Files to Modify**:
- `src/pages/SharedHorse.tsx`

**Requirements**:
1. Show privacy notice before viewing shared horse
2. Explain data collected (IP, user agent, referrer)
3. Provide opt-out option (default: opt-out for analytics)
4. Link to privacy policy
5. Only collect analytics if consent given

**Implementation Notes**:
- Store consent in localStorage for the session
- If no consent, skip analytics logging in `log-share-view` call
- Consider: Add `analytics_consent` param to the edge function

**Blocked on**: Need privacy policy page (GDPR-002) to link to

---

### PERF-003: Code Split DICOM/Cornerstone Libraries

**Status**: Pending
**Priority**: HIGH

**Files to Modify**:
- `vite.config.ts`
- Components using Cornerstone (XRayViewer, DicomViewer)

**Implementation**:
```typescript
const DicomViewer = lazy(() => import('@/components/DicomViewer'));

<Suspense fallback={<LoadingSpinner />}>
  <DicomViewer />
</Suspense>
```

---

## Blocked - Waiting on Backend

### Account Deletion UI (GDPR-001)

**Status**: Blocked
**Backend Status**: TODO per BACKEND.md

**Files to Create (when backend ready)**:
- `src/services/accountService.ts`
- `src/pages/Settings.tsx` or `AccountSettings.tsx`

**Design Ready**:
- Confirmation dialog with "DELETE MY ACCOUNT" phrase
- Show consequences (data that will be deleted)
- Redirect to login after successful deletion

---

### Data Export UI (GDPR-003)

**Status**: Blocked
**Backend Status**: TODO per BACKEND.md

**Files to Create (when backend ready)**:
- `src/services/dataExportService.ts`
- Settings page "Export My Data" button

---

### Password Verification for Share Links

**Status**: Blocked
**Backend Status**: `verify-share-password` edge function TODO per BACKEND.md

**Currently**: Client-side bcrypt comparison
**Target**: Server-side verification via edge function

---

## Technical Notes

### New Files Created

| File | Purpose |
|------|---------|
| `src/services/rateLimitService.ts` | Rate limiting service for auth |
| `src/lib/validation.ts` | Zod schemas for password/input validation |

### Query Client Configuration (from CLAUDE.md)

```typescript
// Global settings in App.tsx
{
  refetchOnWindowFocus: false,  // Prevents reload loops
  refetchOnMount: true,
  refetchOnReconnect: true,
  staleTime: 5 * 60 * 1000,     // 5 minutes
  retry: 1,
}
```

### Known Issues (from CLAUDE.md)

1. **Infinite Loading on Tab Switch** - FIXED: Don't refetch org on TOKEN_REFRESHED
2. **Horse Query Timeouts** - Added 5-10 second timeouts
3. **Mutation Blocking** - FIXED: Removed `await` from invalidateQueries

### File Structure Reference

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # shadcn/ui base components
│   └── *.tsx        # Feature components
├── contexts/        # React contexts (AuthContext)
├── pages/           # Route pages
├── services/        # API/Supabase service functions
├── types/           # TypeScript type definitions
├── hooks/           # Custom React hooks
└── lib/             # Utilities (supabase client, utils, validation)
```

---

## Questions for Backend Agent

1. **Privacy Consent Analytics**: Should the `log-share-view` edge function accept an `analytics_consent` param to skip logging when consent not given?

2. **verify-share-password**: Timeline for this edge function? Frontend share link validation is blocked on this.

3. **Account Deletion**: Any special handling needed for organization owners? Should they transfer ownership first?

---

## Next Actions

1. **Waiting for user testing** - All implemented features need playwright-mcp testing
2. **Next up**: Privacy Consent Banner (SEC-003) - CRITICAL GDPR requirement
3. **Then**: Share Link Password Hashing (SEC-008) - Backend ready
4. **Then**: DICOM Code Splitting (PERF-003) - Performance improvement
