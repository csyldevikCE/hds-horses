# HDS Horses - Technical Debt & Security Backlog

Target: 7,000 users | 3,000 organizations | EU/Sweden Market

Last Updated: 2025-12-15

---

## How to Use This Document

Each item below contains:
- **Title**: Short description for board item
- **Severity**: CRITICAL / HIGH / MEDIUM / LOW
- **Category**: Security, Performance, Compliance, Code Quality
- **Context**: Why this matters
- **Files Affected**: Where to make changes
- **Acceptance Criteria**: Definition of done
- **Estimated Effort**: S (1-2h) / M (2-8h) / L (1-2d) / XL (3+ days)

---

# CRITICAL ITEMS (Fix Immediately)

---

## SEC-001: Rotate Exposed Supabase API Keys

**Severity**: CRITICAL
**Category**: Security
**Effort**: S (30 min)

### Context
The `.env` file contains Supabase ANON_KEY and URL. If this file was ever committed to git or shared, these keys should be considered compromised. Attackers with these keys can bypass client-side security and make direct API calls to your database.

### Files Affected
- `.env` (local)
- Deployment environment variables (Vercel/hosting platform)
- Supabase Dashboard

### Steps to Fix
1. Go to Supabase Dashboard > Project Settings > API
2. Click "Regenerate" on the anon key
3. Update `.env.local` (NOT `.env`) with new key
4. Update Vercel environment variables
5. Verify `.env` is in `.gitignore`
6. Check git history for exposed keys: `git log -p -- .env`

### Acceptance Criteria
- [ ] New anon key generated in Supabase
- [ ] `.env.local` created with new keys (not tracked in git)
- [ ] `.env` removed or contains only placeholder values
- [ ] Deployment environment updated
- [ ] Application works with new keys

---

## SEC-002: Audit and Verify RLS Policies

**Severity**: CRITICAL
**Category**: Security
**Effort**: L (1-2 days)

### Context
The entire authorization model relies on Supabase Row Level Security (RLS). If RLS policies are missing or misconfigured, users could access data from other organizations. The current codebase trusts RLS but policies have not been audited.

### Files Affected
- Supabase Dashboard > Authentication > Policies
- All tables: `horses`, `organization_users`, `share_links`, `invitations`, `vaccinations`, `vet_visits`, `competitions`, `horse_images`, `horse_videos`, `xrays`

### Required Policies (verify each exists)
```sql
-- Example: horses table should have
CREATE POLICY "Users can only view horses in their organization"
ON horses FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_users
    WHERE user_id = auth.uid()
  )
);

-- Similar INSERT, UPDATE, DELETE policies needed
```

### Acceptance Criteria
- [ ] Document all existing RLS policies
- [ ] Verify SELECT policies filter by organization_id
- [ ] Verify INSERT policies check organization membership
- [ ] Verify UPDATE/DELETE policies check ownership
- [ ] Test: User A cannot see User B's horses (different orgs)
- [ ] Test: User cannot access horse by direct ID from another org
- [ ] Add missing policies for any unprotected tables

---

## SEC-003: Add Privacy Consent for Share Link Analytics

**Severity**: CRITICAL
**Category**: Compliance (GDPR)
**Effort**: M (4-8h)

### Context
`SharedHorse.tsx` collects IP addresses, user agents, and referrer information without explicit consent. This violates GDPR Article 6 (lawful basis for processing) and Article 13 (right to be informed). Swedish Data Protection Authority (IMY) can issue fines up to 4% of annual revenue.

### Files Affected
- `src/pages/SharedHorse.tsx:51-86`
- `supabase/functions/log-share-view/index.ts`
- New: Privacy notice component

### Steps to Fix
1. Add privacy notice banner on SharedHorse page explaining data collection
2. Make analytics opt-in (default off) or provide opt-out
3. Document data retention period (recommend 90 days max)
4. Add link to privacy policy

### Acceptance Criteria
- [ ] Privacy notice displayed before viewing shared horse
- [ ] User can opt-out of analytics tracking
- [ ] Analytics only collected if consent given
- [ ] Privacy policy linked from notice
- [ ] Data retention documented

---

## GDPR-001: Implement Right to Erasure (Account Deletion)

**Severity**: CRITICAL
**Category**: Compliance (GDPR)
**Effort**: L (1-2 days)

### Context
GDPR Article 17 requires users can delete their accounts and all associated data. Currently there is no account deletion functionality. Users must be able to remove all their personal data.

### Files Affected
- New: `src/pages/Settings.tsx` or `AccountSettings.tsx`
- New: `src/services/accountService.ts`
- `src/contexts/AuthContext.tsx`
- Supabase: CASCADE delete policies or Edge Function

### Implementation Notes
- Must delete: user profile, horses (if sole owner), images, documents
- Must handle: organization ownership transfer if user is admin
- Consider: 30-day soft delete before permanent removal
- Log: deletion requests for compliance audit

### Acceptance Criteria
- [ ] "Delete Account" button in settings
- [ ] Confirmation dialog with consequences explained
- [ ] All user data deleted from database
- [ ] Files removed from Supabase Storage
- [ ] User logged out after deletion
- [ ] Deletion logged for audit purposes

---

## GDPR-002: Create Privacy Policy Page

**Severity**: CRITICAL
**Category**: Compliance (GDPR)
**Effort**: M (4-8h)

### Context
GDPR Article 13 requires clear information about data processing. No privacy policy currently exists. Required for any EU-targeted application.

### Files Affected
- New: `src/pages/PrivacyPolicy.tsx`
- `src/App.tsx` (add route)
- Footer component (add link)

### Required Content
1. Data controller identity and contact
2. Types of data collected (name, email, horse data, analytics)
3. Purpose of processing
4. Legal basis (consent, contract, legitimate interest)
5. Data retention periods
6. User rights (access, rectification, erasure, portability)
7. How to exercise rights
8. Third parties (Supabase, Vercel, etc.)
9. International transfers
10. Cookie policy

### Acceptance Criteria
- [ ] Privacy policy page accessible at /privacy
- [ ] Link in footer on all pages
- [ ] Link in signup flow
- [ ] Covers all data processing activities
- [ ] Swedish/English versions if needed

---

# HIGH PRIORITY ITEMS

---

## SEC-004: Strengthen Password Requirements

**Severity**: HIGH
**Category**: Security
**Effort**: S (1-2h)

### Context
Current password validation only requires 6 characters (`Signup.tsx:101`). This allows extremely weak passwords like "123456" which appear in every password breach database. OWASP recommends minimum 12 characters with complexity requirements.

### Files Affected
- `src/pages/Signup.tsx:101`
- `src/pages/ResetPassword.tsx` (if exists)
- Consider: `src/lib/validation.ts` (new shared validation)

### Current Code (weak)
```typescript
if (password.length < 6) {
  setError('Password must be at least 6 characters');
}
```

### Recommended Code
```typescript
import { z } from 'zod';

const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character');
```

### Acceptance Criteria
- [ ] Minimum 12 characters enforced
- [ ] Requires uppercase, lowercase, number, special char
- [ ] Clear error messages for each requirement
- [ ] Password strength indicator in UI (optional)
- [ ] Applied to signup and password reset

---

## SEC-005: Add Rate Limiting to Authentication

**Severity**: HIGH
**Category**: Security
**Effort**: M (4-8h)

### Context
No rate limiting exists on login, signup, or password reset endpoints. Attackers can attempt unlimited password guesses (brute force) or create spam accounts. This is a common attack vector.

### Files Affected
- New: `supabase/functions/rate-limit/index.ts` or use Supabase Auth settings
- `src/pages/Login.tsx`
- `src/pages/Signup.tsx`
- `src/services/shareService.ts` (password verification)

### Implementation Options
1. **Supabase Auth Settings**: Enable built-in rate limiting in dashboard
2. **Edge Function**: Create rate limiting middleware
3. **Client-side**: Track attempts in localStorage (weak, easily bypassed)

### Recommended Limits
- Login: 5 failed attempts per IP per 15 minutes
- Signup: 3 accounts per IP per hour
- Password reset: 3 requests per email per hour
- Share link password: 5 attempts per link per hour

### Acceptance Criteria
- [ ] Failed login attempts limited
- [ ] Signup rate limited
- [ ] Share link password verification rate limited
- [ ] User sees friendly error after limit reached
- [ ] Limits reset after timeout period

---

## SEC-006: Add Organization Check to ProtectedRoute

**Severity**: HIGH
**Category**: Security
**Effort**: S (1-2h)

### Context
`ProtectedRoute.tsx` only checks if a user is authenticated, not if they have an active organization. Users without organization membership could access protected routes in an inconsistent state.

### Files Affected
- `src/components/ProtectedRoute.tsx`
- `src/contexts/AuthContext.tsx`

### Current Code
```typescript
// Only checks user exists
if (!user) {
  return <Navigate to="/login" />;
}
```

### Recommended Code
```typescript
const { user, organization, organizationLoading } = useAuth();

if (!user) {
  return <Navigate to="/login" />;
}

if (organizationLoading) {
  return <LoadingSpinner />;
}

if (!organization) {
  return <Navigate to="/select-organization" />;
}
```

### Acceptance Criteria
- [ ] ProtectedRoute checks organization membership
- [ ] Users without org redirected to org selection/creation
- [ ] Loading state handled gracefully
- [ ] No flash of protected content

---

## PERF-001: Fix N+1 Query Pattern in horseService

**Severity**: HIGH
**Category**: Performance
**Effort**: M (4-8h)

### Context
`horseService.ts` makes 3 separate queries (images, videos, competitions) for EACH horse in `mapHorseRowToHorse`. Loading 100 horses = 300+ API calls. This causes slow page loads and excessive Supabase usage.

### Files Affected
- `src/services/horseService.ts:108-134` (mapHorseRowToHorse)
- `src/services/horseService.ts:192-260` (getHorses)

### Current Pattern (slow)
```typescript
const results = await Promise.allSettled([
  supabase.from('horse_images').select('*').eq('horse_id', row.id),
  supabase.from('horse_videos').select('*').eq('horse_id', row.id),
  supabase.from('competitions').select('*').eq('horse_id', row.id),
]);
```

### Recommended Pattern (fast)
```typescript
// Single query with JOINs
const { data } = await supabase
  .from('horses')
  .select(`
    *,
    horse_images (*),
    horse_videos (*),
    competitions (*)
  `)
  .eq('organization_id', organizationId);
```

### Acceptance Criteria
- [ ] Horse list loads with single query
- [ ] Related data (images, videos, competitions) included via JOIN
- [ ] Page load time reduced by 50%+
- [ ] Supabase usage reduced significantly
- [ ] Existing functionality unchanged

---

## PERF-002: Add Pagination to Horse List

**Severity**: HIGH
**Category**: Performance
**Effort**: M (4-8h)

### Context
`getHorses()` loads ALL horses into memory. With 1000+ horses, this causes memory issues, slow initial load, and poor UX. Pagination limits data transfer and improves performance.

### Files Affected
- `src/services/horseService.ts:189-260`
- `src/pages/Index.tsx`
- Consider: `src/hooks/usePaginatedHorses.ts` (new)

### Implementation Notes
```typescript
// Service
async getHorses(orgId: string, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return supabase
    .from('horses')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)
    .range(from, to)
    .order('created_at', { ascending: false });
}

// Component - infinite scroll or "Load More" button
```

### Acceptance Criteria
- [ ] Initial load fetches max 50 horses
- [ ] "Load More" button or infinite scroll
- [ ] Total count displayed
- [ ] Search/filter works with pagination
- [ ] Memory usage stays constant regardless of total horses

---

## PERF-003: Code Split DICOM/Cornerstone Libraries

**Severity**: HIGH
**Category**: Performance
**Effort**: M (4-8h)

### Context
Cornerstone.js (medical imaging) is ~2.6MB and loaded for ALL users on initial page load, even if they never view X-rays. This significantly impacts Time to Interactive (TTI) and Core Web Vitals.

### Files Affected
- `vite.config.ts:33-42`
- Components using Cornerstone (XRayViewer, DicomViewer)
- `package.json` (verify cornerstone imports)

### Implementation
```typescript
// Instead of static import
import { DicomViewer } from '@/components/DicomViewer';

// Use dynamic import
const DicomViewer = lazy(() => import('@/components/DicomViewer'));

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <DicomViewer />
</Suspense>
```

### Acceptance Criteria
- [ ] Cornerstone not in main bundle
- [ ] DICOM viewer loads on-demand
- [ ] Initial bundle size reduced by ~2MB
- [ ] Loading state shown while DICOM loads
- [ ] X-ray viewing still works correctly

---

## GDPR-003: Implement Data Export

**Severity**: HIGH
**Category**: Compliance (GDPR)
**Effort**: M (4-8h)

### Context
GDPR Article 20 (Right to Data Portability) requires users can download their data in a machine-readable format. This enables users to move their data to competing services.

### Files Affected
- New: `src/services/dataExportService.ts`
- New: Settings page or dedicated export page
- Supabase Edge Function (if server-side generation needed)

### Data to Include
- User profile
- All horses and their details
- Images (as URLs or downloadable zip)
- Vaccinations, vet visits, competitions
- Organization membership

### Export Format
```json
{
  "exportDate": "2025-12-15",
  "user": { ... },
  "horses": [ ... ],
  "vaccinations": [ ... ],
  "documents": [ ... ]
}
```

### Acceptance Criteria
- [ ] "Export My Data" button in settings
- [ ] JSON export with all user data
- [ ] Optional: Include image files as zip
- [ ] Download triggers immediately or sends email
- [ ] Export logged for audit purposes

---

# MEDIUM PRIORITY ITEMS

---

## SEC-007: Add Input Validation with Zod Schemas

**Severity**: MEDIUM
**Category**: Security
**Effort**: M (4-8h)

### Context
Form inputs are sent directly to Supabase without validation. While Supabase prevents SQL injection, lack of validation allows invalid data, potential NoSQL-like injection, and poor data quality.

### Files Affected
- `src/components/CreateHorseForm.tsx`
- `src/components/EditHorseForm.tsx`
- `src/services/horseService.ts`
- All form components
- New: `src/lib/schemas.ts`

### Implementation
```typescript
// src/lib/schemas.ts
import { z } from 'zod';

export const horseSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  breed: z.string().min(1).max(100).trim(),
  birth_year: z.number().min(1900).max(new Date().getFullYear()),
  color: z.string().max(50).optional(),
  registration_number: z.string().max(50).optional(),
});

// Usage in form
const result = horseSchema.safeParse(formData);
if (!result.success) {
  setErrors(result.error.flatten());
  return;
}
```

### Acceptance Criteria
- [ ] Zod schemas for Horse, Vaccination, VetVisit, Competition
- [ ] Validation on form submit (frontend)
- [ ] Clear error messages for invalid fields
- [ ] Max length limits prevent abuse
- [ ] Trim whitespace on string fields

---

## SEC-008: Move Share Link Password Hashing to Backend

**Severity**: MEDIUM
**Category**: Security
**Effort**: M (4-8h)

### Context
`shareService.ts:156-165` uses bcryptjs to hash passwords client-side. Client-side hashing is visible in browser devtools, computationally slow in JS, and the plaintext password is still transmitted. Server-side hashing is more secure.

### Files Affected
- `src/services/shareService.ts:156-165`
- New: `supabase/functions/hash-password/index.ts`

### Current Code (client-side)
```typescript
const passwordHash = await bcrypt.hash(password, 10);
```

### Recommended Approach
```typescript
// Edge Function handles hashing
const response = await supabase.functions.invoke('create-share-link', {
  body: { horseId, password, expiresAt }
});
```

### Acceptance Criteria
- [ ] Password sent over HTTPS to Edge Function
- [ ] Hashing done server-side with bcrypt
- [ ] Client never receives or stores hash
- [ ] Share link creation still works
- [ ] Password verification also server-side

---

## SEC-009: Server-Side File Type Validation

**Severity**: MEDIUM
**Category**: Security
**Effort**: M (4-8h)

### Context
`fileUploadService.ts:84-114` validates file types client-side only. Attackers can bypass this by modifying requests directly. Malicious files (executables disguised as images) could be uploaded.

### Files Affected
- `src/services/fileUploadService.ts`
- Supabase Storage policies
- Consider: Edge Function for upload handling

### Implementation
1. Keep client-side validation (UX)
2. Add Supabase Storage policy for allowed MIME types
3. Consider: Virus scanning for uploaded files

### Acceptance Criteria
- [ ] Storage policy restricts file types
- [ ] Only allow: image/*, video/*, application/pdf, application/dicom
- [ ] Rejected files return clear error
- [ ] Existing uploads still accessible

---

## PERF-004: Add Memoization to Index Page

**Severity**: MEDIUM
**Category**: Performance
**Effort**: S (1-2h)

### Context
`Index.tsx:36-58` recalculates filter options (breeds, statuses, ages) on every render. With 500+ horses, this causes noticeable lag when typing in search or clicking filters.

### Files Affected
- `src/pages/Index.tsx:36-58`
- `src/components/HorseCard.tsx`

### Current Code (recalculates every render)
```typescript
const breeds = ['all', ...new Set(horses.map(h => h.breed))];
const statuses = ['all', ...new Set(horses.map(h => h.status))];
```

### Recommended Code
```typescript
const breeds = useMemo(
  () => ['all', ...new Set(horses.map(h => h.breed))],
  [horses]
);

const statuses = useMemo(
  () => ['all', ...new Set(horses.map(h => h.status))],
  [horses]
);

// Also wrap HorseCard
export const HorseCard = memo(function HorseCard({ horse }) {
  // ...
});
```

### Acceptance Criteria
- [ ] Filter options memoized with useMemo
- [ ] HorseCard wrapped with React.memo
- [ ] No lag when typing in search field
- [ ] React DevTools shows fewer re-renders

---

## PERF-005: Remove Unnecessary refetchOnMount

**Severity**: MEDIUM
**Category**: Performance
**Effort**: S (1-2h)

### Context
Multiple queries use `refetchOnMount: true` which refetches data every time a component mounts, even if data was just fetched. Combined with the global `staleTime: 5min`, this causes redundant network requests.

### Files Affected
- `src/components/VaccinationLog.tsx:35,42`
- `src/components/VetVisitList.tsx:35`
- `src/components/ShareHorse.tsx:76`

### Current Code
```typescript
const { data } = useQuery({
  queryKey: ['vaccinations', horseId],
  queryFn: () => getVaccinations(horseId),
  refetchOnMount: true, // Unnecessary with staleTime
});
```

### Recommended Code
```typescript
const { data } = useQuery({
  queryKey: ['vaccinations', horseId],
  queryFn: () => getVaccinations(horseId),
  // Remove refetchOnMount - let staleTime handle it
});
```

### Acceptance Criteria
- [ ] Remove refetchOnMount from listed components
- [ ] Verify data still loads correctly
- [ ] Network tab shows fewer requests on tab switches
- [ ] No regression in data freshness

---

## PERF-006: Standardize Query Invalidation (Remove await)

**Severity**: MEDIUM
**Category**: Performance
**Effort**: S (1-2h)

### Context
Per CLAUDE.md, `await queryClient.invalidateQueries()` can block UI if queries hang. Some components await, others don't. This inconsistency causes some mutations to appear stuck.

### Files Affected
- `src/components/VaccinationLog.tsx:49-51`
- `src/components/VetVisitList.tsx:42-43`
- `src/components/XRayUpload.tsx:95-96`
- All components with mutations

### Current Code (inconsistent)
```typescript
onSuccess: async () => {
  await queryClient.invalidateQueries({ queryKey: ['vaccinations'] }); // Blocks
  queryClient.invalidateQueries({ queryKey: ['horse'] }); // Doesn't block
}
```

### Recommended Code
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['vaccinations'] });
  queryClient.invalidateQueries({ queryKey: ['horse'] });
  // No await - let queries refetch in background
}
```

### Acceptance Criteria
- [ ] No `await` before invalidateQueries
- [ ] All mutation handlers consistent
- [ ] Mutations complete without hanging
- [ ] Data still refreshes after mutations

---

## SEC-010: Add Audit Logging for Sensitive Operations

**Severity**: MEDIUM
**Category**: Security / Compliance
**Effort**: L (1-2 days)

### Context
No audit trail exists for sensitive operations like horse deletion, share link creation, role changes, or data exports. This makes security investigations and compliance audits impossible.

### Files Affected
- New: `supabase/migrations/xxx_audit_log.sql`
- New: `src/services/auditService.ts`
- All services performing sensitive operations

### Database Table
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users,
  organization_id UUID REFERENCES organizations,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT
);
```

### Operations to Log
- Horse create/update/delete
- Share link create/delete
- User invitation/role change
- Account deletion request
- Data export request
- Failed login attempts

### Acceptance Criteria
- [ ] Audit log table created
- [ ] Key operations logged automatically
- [ ] Admin UI to view audit log
- [ ] Logs retained for 90+ days
- [ ] PII handling compliant (anonymize where needed)

---

# LOW PRIORITY ITEMS

---

## PERF-007: Optimize Image Thumbnails

**Severity**: LOW
**Category**: Performance
**Effort**: M (4-8h)

### Context
`HorseGallery.tsx` displays full-resolution images as small thumbnails (h-16). This wastes bandwidth, especially on mobile. Supabase Storage can transform images on-the-fly.

### Files Affected
- `src/components/HorseGallery.tsx:171-202`
- Image upload service

### Implementation
```typescript
// Use Supabase image transforms
const thumbnailUrl = supabase.storage
  .from('horse-media')
  .getPublicUrl(path, {
    transform: { width: 150, height: 150, resize: 'cover' }
  });
```

### Acceptance Criteria
- [ ] Thumbnails request smaller images
- [ ] Bandwidth reduced on gallery load
- [ ] Full images still available on click
- [ ] Mobile data usage reduced

---

## CODE-001: Enable TypeScript Strict Mode

**Severity**: LOW
**Category**: Code Quality
**Effort**: L (1-2 days)

### Context
`tsconfig.json` has `strict: false`. Strict mode catches more bugs at compile time (null checks, implicit any, etc.). Enabling now prevents future bugs.

### Files Affected
- `tsconfig.json`
- Multiple files will show new errors

### Steps
1. Enable strict mode
2. Fix errors iteratively
3. Consider enabling incrementally (strictNullChecks first)

### Acceptance Criteria
- [ ] `strict: true` in tsconfig.json
- [ ] All type errors resolved
- [ ] Build passes
- [ ] No runtime regressions

---

## CODE-002: Set Up Error Monitoring (Sentry/LogRocket)

**Severity**: LOW
**Category**: Operations
**Effort**: M (4-8h)

### Context
Production errors are invisible without monitoring. Users may experience issues silently. Error tracking enables proactive bug fixing.

### Files Affected
- `package.json` (add Sentry SDK)
- `src/main.tsx` or `src/App.tsx`
- Error boundaries

### Acceptance Criteria
- [ ] Sentry/LogRocket account created
- [ ] SDK integrated
- [ ] Errors captured with stack traces
- [ ] Source maps uploaded for readable traces
- [ ] Alert notifications configured

---

## DB-001: Add Database Indexes

**Severity**: LOW
**Category**: Performance
**Effort**: S (1-2h)

### Context
Frequently queried columns may lack indexes, causing slow queries as data grows. `horses.organization_id` and `share_links.token` should be indexed.

### Files Affected
- `supabase/migrations/xxx_add_indexes.sql`

### SQL
```sql
CREATE INDEX IF NOT EXISTS idx_horses_organization_id ON horses(organization_id);
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
CREATE INDEX IF NOT EXISTS idx_vaccinations_horse_id ON vaccinations(horse_id);
CREATE INDEX IF NOT EXISTS idx_competitions_horse_id ON competitions(horse_id);
```

### Acceptance Criteria
- [ ] Indexes created
- [ ] Query performance improved
- [ ] No impact on write performance

---

# COMPLETED ITEMS

## Code Quality (Previously Completed)

- [x] **Fix N+1 queries in vetVisitService.ts** - Changed to single JOIN query
- [x] **Implement secure token generation** - Replaced Math.random() with crypto.getRandomValues()
- [x] **Remove sensitive console.log statements** - Cleaned up SharedHorse, shareService, HorseDetail, blupService, EditHorseForm
- [x] **Add URL validation utility** - Created isValidExternalUrl() and safeOpenUrl()
- [x] **Configure security headers in Vercel** - Added X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
- [x] **Optimize AuthContext organization queries** - Reduced timeout, used JOIN query
- [x] **Add image lazy loading** - HorseDetail hero, HorseGallery thumbnails

## Already Good (From Initial Review)

- [x] Multi-tenant RLS in Supabase
- [x] Supabase Auth with proper session management
- [x] No XSS vulnerabilities (React auto-escaping)
- [x] Protected routes with auth checks
- [x] Error boundaries for crash handling
- [x] Query timeouts to prevent hanging
- [x] Non-blocking query invalidation patterns

---

# PROGRESS SUMMARY

| Priority | Total | Done | Remaining |
|----------|-------|------|-----------|
| CRITICAL | 5 | 0 | 5 |
| HIGH | 8 | 0 | 8 |
| MEDIUM | 7 | 0 | 7 |
| LOW | 4 | 0 | 4 |
| **TOTAL** | **24** | **0** | **24** |

---

# DEPLOYMENT BLOCKERS

Before going to production, these MUST be completed:

1. SEC-001: Rotate Supabase keys
2. SEC-002: Verify RLS policies
3. GDPR-001: Account deletion
4. GDPR-002: Privacy policy
5. SEC-003: Share link consent

---

# SUGGESTED SPRINT PLANNING

## Sprint 1: Security Foundation (1 week)
- SEC-001: Rotate keys (30 min)
- SEC-002: RLS audit (2 days)
- SEC-004: Password strength (2h)
- SEC-006: ProtectedRoute org check (2h)

## Sprint 2: GDPR Compliance (1 week)
- GDPR-001: Account deletion (2 days)
- GDPR-002: Privacy policy (1 day)
- GDPR-003: Data export (1 day)
- SEC-003: Consent banner (4h)

## Sprint 3: Performance (1 week)
- PERF-001: Fix N+1 queries (1 day)
- PERF-002: Pagination (1 day)
- PERF-003: Code split DICOM (4h)
- PERF-004-006: Memoization/cleanup (4h)

## Sprint 4: Hardening (1 week)
- SEC-005: Rate limiting (1 day)
- SEC-007: Input validation (1 day)
- SEC-010: Audit logging (2 days)
