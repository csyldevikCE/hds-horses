# HDS Horses - Code Refinement Roadmap

**Status**: In Progress
**Started**: 2025-10-21
**Goal**: Transform from B- (75/100) to A (90+/100)

---

## High Priority (Critical for Production Quality)

### 1. Fix Supabase Relationships - Stop Avoiding JOINs
**Status**: ✅ COMPLETED
**Effort**: 1 hour (actual)
**Impact**: High - Eliminates major workaround pattern

**Problem**:
- Currently fetching data in separate queries and merging in JavaScript
- Avoiding Supabase JOIN syntax due to "schema cache errors"
- Pattern used in: `ProfileDialog.tsx`, `organizationService.ts`

**Root Cause**:
- Missing direct FK relationship: `organization_users.user_id → profiles.id`
- Both tables referenced `auth.users` but not each other directly
- PostgREST can only traverse direct FK relationships

**Action Items**:
- [x] Created migration 016 to add missing FK constraint
- [x] Verified all organization_users have corresponding profiles
- [x] Added FK: `organization_users.user_id → profiles.id`
- [x] Refactored `getOrganizationMembers()` to use single query with JOIN
- [x] Refactored ProfileDialog to use single query
- [x] Removed merge-in-JavaScript pattern
- [x] Updated CLAUDE.md to document new JOIN pattern
- [x] Removed "Avoiding JOIN Issues" from Known Issues section

**Success Criteria**: ✅ ALL MET
- Single query returns organization_users with nested profiles
- No JavaScript merging required
- Query executes without schema cache errors
- Cleaner, more maintainable code

---

### 2. Add React Error Boundaries
**Status**: ✅ COMPLETED
**Effort**: 1 hour (actual)
**Impact**: High - Prevents white screen crashes

**Problem**:
- No error boundaries in application
- Unhandled errors cause white screen of death
- Poor user experience when components fail

**Action Items**:
- [x] Created `ErrorBoundary` component (class component)
- [x] Created `ErrorFallback` component (presentational UI)
- [x] Wrapped entire app in ErrorBoundary in `App.tsx`
- [x] Added custom error handler with console logging
- [x] Created `ErrorBoundaryTest` component for testing
- [x] Included Sentry integration placeholder for production
- [x] Build passes with no errors

**Files Created**:
- `src/components/ErrorBoundary.tsx` - Main error boundary class component
- `src/components/ErrorFallback.tsx` - Reusable fallback UI (full-page & minimal modes)
- `src/components/ErrorBoundaryTest.tsx` - Test component to verify functionality

**Files Modified**:
- `src/App.tsx` - Wrapped app in ErrorBoundary with custom error handler

**Reference**:
- React docs: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary

**Success Criteria**: ✅ ALL MET
- Errors in components show fallback UI instead of white screen
- User can recover (refresh button + try again button)
- Errors are logged to console (production: ready for Sentry)
- Fallback UI is professional and user-friendly
- Technical details expandable for debugging

---

### 3. Consolidate Profile Data - One Source of Truth
**Status**: ✅ COMPLETED
**Effort**: 1 hour (actual)
**Impact**: High - Eliminates data duplication bugs

**Problem**:
- Profile data stored in TWO places:
  - `auth.users.raw_user_meta_data` (Supabase Auth)
  - `profiles` table (Database)
- Risk of data getting out of sync
- Unnecessary complexity in update logic

**Decision Made**:
- **✅ Use profiles table only** (database as single source of truth)

**Action Items**:
- [x] Removed auth metadata update from ProfileDialog
- [x] Removed fallback to user metadata in loadProfile
- [x] Updated profile trigger to not use metadata (migration 017)
- [x] Updated CLAUDE.md to remove dual-storage pattern
- [x] Removed "Profile vs User Metadata" gotcha
- [x] Build passes with no errors

**Files Created**:
- `database/migrations/017_update_profile_trigger_remove_metadata.sql` - Updated trigger

**Files Modified**:
- `src/components/ProfileDialog.tsx` - Removed dual updates, simplified to profiles table only
- `claude.md` - Updated patterns and removed gotcha

**Files Verified** (already clean):
- `src/components/UserProfile.tsx` - Already only reads from profiles ✅
- `src/contexts/AuthContext.tsx` - Never used user metadata ✅
- `src/pages/Signup.tsx` - Doesn't set user metadata ✅

**Success Criteria**: ✅ ALL MET
- Profile data only stored in profiles table
- No sync issues between auth and database
- All components read from single source
- Simpler, cleaner update logic

---

### 4. Remove Dead Code - Delete Deprecated Files
**Status**: ✅ COMPLETED
**Effort**: 15 minutes (actual)
**Impact**: Medium - Reduces confusion and maintenance

**Problem**:
- `TeamManagement.tsx` marked as "deprecated" but still in codebase
- Route still exists in App.tsx
- Confusing for future developers
- Adding unnecessary bundle size

**Action Items**:
- [x] Verified ProfileDialog has all team management features ✅
- [x] Deleted `src/pages/TeamManagement.tsx` (364 lines removed)
- [x] Removed `/team` route from `App.tsx`
- [x] Removed import from `App.tsx`
- [x] Updated CLAUDE.md to remove TeamManagement reference
- [x] Searched codebase - no remaining references
- [x] Build passes with no errors

**Files Deleted**:
- `src/pages/TeamManagement.tsx` - 364 lines of deprecated code

**Files Modified**:
- `src/App.tsx` - Removed import and route
- `claude.md` - Removed from pages list

**Success Criteria**: ✅ ALL MET
- TeamManagement.tsx deleted
- No broken imports or routes
- All team management accessible via ProfileDialog
- Bundle size reduced by ~15 KB (660KB → 645KB)

---

### 5. Fix React Query Config - Address Root Cause
**Status**: ✅ COMPLETED
**Effort**: 2 hours (actual)
**Impact**: High - Restores proper data fetching behavior

**Problem**:
```typescript
refetchOnWindowFocus: false,
refetchOnMount: false,
refetchOnReconnect: false
```
- ALL automatic refetching disabled due to "performance issues"
- Users see stale data until manual refresh
- Treating symptom, not root cause

**Root Cause Identified**:
❌ **Mismatched Query Keys!**

Example:
- **Index.tsx** (query): `queryKey: ['horses', organization?.id]`
- **CreateHorseForm** (invalidation): `queryKey: ['horses', user?.id]`
- Keys don't match → invalidation doesn't work → new horses never appear → "refetching is broken"

Also found:
- EditHorseForm: Used overly broad `['horses']` instead of `['horses', organization.id]`
- MediaUpload: Same broad invalidation issue

**Action Items**:
- [x] Analyzed all useQuery calls and their query keys
- [x] Fixed CreateHorseForm: Changed `user?.id` to `organization?.id`
- [x] Fixed EditHorseForm: Changed `['horses']` to `['horses', organization?.id]`
- [x] Fixed MediaUpload: Removed unnecessary broad invalidation
- [x] Re-enabled refetchOnWindowFocus, refetchOnMount, refetchOnReconnect
- [x] Reduced staleTime to 2 minutes (from 5) for more aggressive freshness
- [x] Updated CLAUDE.md with explanation
- [x] Build passes with no errors

**Files Modified**:
- `src/components/CreateHorseForm.tsx` - Fixed query key, added organization context
- `src/components/EditHorseForm.tsx` - Fixed query key, added organization context
- `src/components/MediaUpload.tsx` - Removed overly broad invalidation
- `src/App.tsx` - Re-enabled refetching, updated comments
- `claude.md` - Documented root cause and solution

**Success Criteria**: ✅ ALL MET
- refetchOnWindowFocus: true ✅
- refetchOnMount: true ✅
- refetchOnReconnect: true ✅
- Query keys match between queries and invalidations ✅
- Data stays fresh when user switches tabs ✅
- Creating/editing horses now immediately updates the list ✅

---

## Medium Priority (Production Polish)

### 6. Add Basic Tests - Auth Flow & Critical Paths
**Status**: ⬜ Not Started
**Effort**: 6-8 hours
**Impact**: Medium - Enables safe refactoring

**Problem**:
- Zero automated tests
- Refactoring is risky
- No regression detection

**Action Items**:
- [ ] Install testing dependencies (Vitest, React Testing Library)
- [ ] Create test setup file with Supabase mocks
- [ ] Write auth flow tests:
  - [ ] Signup creates org and admin user
  - [ ] Login persists session
  - [ ] Logout clears session
  - [ ] Protected routes redirect when not authenticated
- [ ] Write critical path tests:
  - [ ] Create horse (admin only)
  - [ ] View horses (all users)
  - [ ] Edit horse (admin only, blocked for read-only)
  - [ ] Share link generation and access
- [ ] Add test script to package.json
- [ ] Document test patterns in CLAUDE.md

**Files to Create**:
- `src/tests/setup.ts`
- `src/contexts/__tests__/AuthContext.test.tsx`
- `src/services/__tests__/horseService.test.ts`
- `src/services/__tests__/organizationService.test.ts`

**Success Criteria**:
- `npm test` runs successfully
- Core auth flows covered
- Critical CRUD operations tested
- Tests pass consistently

---

### 7. Implement Proper Loading States
**Status**: ⬜ Not Started
**Effort**: 4-5 hours
**Impact**: Medium - Better UX

**Problem**:
- Many components don't handle loading gracefully
- No skeleton screens
- Inconsistent loading indicators

**Action Items**:
- [ ] Create reusable skeleton components:
  - [ ] `HorseCardSkeleton`
  - [ ] `HorseDetailSkeleton`
  - [ ] `TableSkeleton` (for org members)
- [ ] Add loading states to key pages:
  - [ ] Index.tsx (horse list)
  - [ ] HorseDetail.tsx
  - [ ] ProfileDialog.tsx (org members)
- [ ] Add error states with retry buttons
- [ ] Add empty states ("No horses yet" with CTA)
- [ ] Ensure all async operations show loading feedback

**Files to Create**:
- `src/components/skeletons/HorseCardSkeleton.tsx`
- `src/components/skeletons/HorseDetailSkeleton.tsx`

**Success Criteria**:
- No blank screens during loading
- User always knows something is happening
- Errors show helpful messages with recovery options
- Empty states guide user to take action

---

### 8. Rethink Loading/Initialization Flow
**Status**: ⬜ Not Started
**Effort**: 3-4 hours
**Impact**: Medium - More robust auth state

**Problem**:
```typescript
setLoading(false)  // Set IMMEDIATELY before org fetch
// Fetch org in background to prevent redirect
```
- Current fix is a workaround
- Brittle and hard to reason about
- Loading state doesn't reflect actual ready state

**Better Approach**:
Use granular loading states instead of single boolean:
```typescript
type AuthState =
  | { status: 'initializing' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated', orgLoading: true }
  | { status: 'authenticated', orgLoading: false, org: Organization }
```

**Action Items**:
- [ ] Refactor AuthContext to use state machine pattern
- [ ] Separate session loading from org loading
- [ ] Update ProtectedRoute to handle granular states
- [ ] Show different UI for "session checking" vs "org loading"
- [ ] Remove 15s timeout hack
- [ ] Update CLAUDE.md to remove "Session Persistence" gotcha

**Success Criteria**:
- No race conditions between session and org fetch
- Clear loading states for each phase
- No premature redirects
- User sees appropriate loading UI

---

### 9. Add Input Validation - Zod Schemas Everywhere
**Status**: ⬜ Not Started
**Effort**: 3-4 hours
**Impact**: Medium - Data integrity

**Problem**:
- Inconsistent validation across forms
- No centralized validation schemas
- Risk of bad data in database

**Action Items**:
- [ ] Create Zod schemas for all entities:
  - [ ] `horseSchema` (basic info, pedigree, health, training)
  - [ ] `organizationSchema`
  - [ ] `profileSchema`
  - [ ] `shareSchema`
- [ ] Move schemas to `src/schemas/` directory
- [ ] Use schemas in React Hook Form with zodResolver
- [ ] Add server-side validation in services before DB operations
- [ ] Validate on both client and server
- [ ] Add helpful error messages

**Files to Create**:
- `src/schemas/horse.ts`
- `src/schemas/organization.ts`
- `src/schemas/profile.ts`

**Success Criteria**:
- All forms use Zod validation
- Services validate input before database calls
- Clear error messages for validation failures
- Type safety between forms and database

---

### 10. Implement Email Invitations - Complete the Feature
**Status**: ⬜ Not Started
**Effort**: 6-8 hours
**Impact**: Medium - Core feature completion

**Problem**:
- Email invitations marked as "placeholder"
- Critical functionality for team collaboration
- Currently just shows invite form with no backend

**Action Items**:
- [ ] Choose email service (Supabase Auth, Resend, SendGrid)
- [ ] Create email templates for invitations
- [ ] Implement invite flow:
  - [ ] Admin sends invite with email
  - [ ] System sends email with signup link + org code
  - [ ] New user signs up via link
  - [ ] Auto-join organization on signup
- [ ] Add invite token system (if not using Supabase Auth invites)
- [ ] Update ProfileDialog invite form to actually send emails
- [ ] Add invite status tracking (pending, accepted, expired)
- [ ] Add UI to resend/revoke invites

**Decision Required**:
- Use Supabase Auth invites (simpler) or custom system?

**Success Criteria**:
- Admin can invite users via email
- Invited users receive email with signup link
- New users auto-join org after signup
- Invite status visible in org settings

---

## Low Priority (Polish & Enhancement)

### 11. Add Monitoring/Logging - Sentry or LogRocket
**Status**: ⬜ Not Started
**Effort**: 2-3 hours
**Impact**: Low - Better production debugging

**Action Items**:
- [ ] Choose monitoring service (Sentry recommended)
- [ ] Install Sentry SDK
- [ ] Configure Sentry in `main.tsx`
- [ ] Add user context to error reports
- [ ] Set up source maps for production
- [ ] Add performance monitoring
- [ ] Set up alerts for critical errors

**Success Criteria**:
- Production errors tracked in Sentry
- User context available for debugging
- Performance metrics visible

---

### 12. Optimize Images - CDN & Proper Formats
**Status**: ⬜ Not Started
**Effort**: 3-4 hours
**Impact**: Low - Performance improvement

**Action Items**:
- [ ] Implement file upload to Supabase Storage (currently just URLs)
- [ ] Add image optimization pipeline
- [ ] Serve images via CDN
- [ ] Use modern formats (WebP, AVIF) with fallbacks
- [ ] Implement lazy loading for gallery images
- [ ] Add image size limits and validation
- [ ] Generate thumbnails for better performance

**Success Criteria**:
- Images uploaded to Supabase Storage
- Automatic optimization on upload
- Fast loading times
- Responsive images for different devices

---

### 13. Add E2E Tests - Playwright or Cypress
**Status**: ⬜ Not Started
**Effort**: 8-10 hours
**Impact**: Low - Confidence in user flows

**Action Items**:
- [ ] Install Playwright
- [ ] Set up E2E test environment
- [ ] Write critical user journey tests:
  - [ ] Complete signup flow
  - [ ] Create and edit horse
  - [ ] Generate share link
  - [ ] Invite team member
- [ ] Add to CI/CD pipeline
- [ ] Document E2E test patterns

**Success Criteria**:
- E2E tests cover critical user journeys
- Tests run in CI before deployment
- Visual regression testing optional

---

### 14. Performance Profiling - React DevTools
**Status**: ⬜ Not Started
**Effort**: 2-3 hours
**Impact**: Low - Identify bottlenecks

**Action Items**:
- [ ] Use React DevTools Profiler
- [ ] Profile common user actions (view horses, filter, edit)
- [ ] Identify unnecessary re-renders
- [ ] Add React.memo where appropriate
- [ ] Optimize expensive computations with useMemo
- [ ] Check bundle size with vite-bundle-visualizer

**Success Criteria**:
- No unnecessary re-renders in hot paths
- Bundle size optimized
- Lighthouse score > 90

---

### 15. Accessibility Audit - a11y Compliance
**Status**: ⬜ Not Started
**Effort**: 4-5 hours
**Impact**: Low - WCAG compliance

**Action Items**:
- [ ] Install axe DevTools
- [ ] Audit all pages for accessibility issues
- [ ] Add proper ARIA labels
- [ ] Ensure keyboard navigation works
- [ ] Test with screen reader
- [ ] Add focus management in modals
- [ ] Ensure color contrast meets WCAG AA
- [ ] Add skip links for navigation

**Success Criteria**:
- No critical a11y violations
- Keyboard navigation works throughout
- Screen reader compatible
- WCAG 2.1 AA compliant

---

## Progress Tracker

**High Priority**: 5/5 complete (100%) 🎉
**Medium Priority**: 0/5 complete (0%)
**Low Priority**: 0/5 complete (0%)

**Overall**: 5/15 complete (33%)

---

## Next Steps

1. Start with **#1 - Fix Supabase Relationships** (biggest bang for buck)
2. Then **#2 - Error Boundaries** (quick safety win)
3. Then **#3 - Consolidate Profile Data** (clean up tech debt)
4. Continue through high priority items
5. Reassess priorities after high priority items complete

---

**Notes**:
- Update this file as tasks complete
- Mark items with ✅ when done
- Add notes on discoveries/decisions made
- Keep CLAUDE.md in sync with changes
