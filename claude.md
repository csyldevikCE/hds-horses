# HDS Horses - Multi-Tenant Horse Management System

## Project Overview

HDS Horses is a multi-tenant web application for managing horse listings, competitions, media, and team collaboration. Organizations can have up to 2 administrators and 2 read-only users, with role-based access control throughout the application.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **UI Components**: Radix UI, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: React Context API, TanStack Query
- **Routing**: React Router v6
- **Security**: bcryptjs for password hashing
- **Deployment**: Vercel

## Database Schema

### Core Tables

#### `profiles`
Stores user profile information (first name, last name).
- `id` (UUID, FK to auth.users)
- `first_name` (TEXT)
- `last_name` (TEXT)
- `created_at`, `updated_at`

**RLS Policies**:
- Users can view profiles of users in their organization
- Users can update/insert their own profile
- Auto-created via trigger on user signup

#### `organizations`
Multi-tenant organizations that own horses and manage team members.
- `id` (UUID, PK)
- `name` (TEXT)
- `created_by` (UUID, FK to auth.users)
- `created_at`, `updated_at`

**RLS Policies**:
- Users can view their own organization
- Users can update their organization if admin

#### `organization_users`
Junction table for organization membership and roles.
- `id` (UUID, PK)
- `organization_id` (UUID, FK to organizations)
- `user_id` (UUID, FK to auth.users)
- `role` ('admin' | 'read_only')
- `invited_by`, `invited_at`, `joined_at`

**Business Rules**:
- Maximum 2 admins per organization
- Maximum 2 read-only users per organization
- First user to sign up automatically becomes admin of new organization

**RLS Policies**:
- Users can view members of their organization
- Admins can insert/update/delete members

#### `horses`
Main horse records with detailed information.
- Basic info: `name`, `breed`, `age`, `color`, `gender`, `height`, `weight`
- Status: `status` ('Available' | 'Sold' | 'Reserved' | 'Not for Sale')
- Pedigree: 4-generation pedigree tree (sire/dam lineage)
- Health: `health_vaccinations`, `health_coggins`, `health_last_vet_check`
- Training: `training_level`, `training_disciplines` (array)
- Ownership: `user_id`, `organization_id`

**RLS Policies**:
- Users can view horses in their organization
- Admins can insert/update/delete horses
- Read-only users can only view

#### `horse_images`
Horse photo gallery with primary image support.
- `horse_id`, `url`, `caption`, `is_primary`

#### `horse_videos`
YouTube video links for horses.
- `horse_id`, `url`, `caption`, `thumbnail`

#### `competitions`
Competition results and achievements.
- `horse_id`, `event`, `date`, `discipline`, `placement`
- `notes`, `equipe_link` (external link to results)

#### `share_links`
Shareable public links for horse profiles with advanced features.
- `id`, `token` (unique identifier for URL)
- `horse_id`, `organization_id`, `created_by`
- `recipient_name`, `expires_at`, `created_at`
- `link_type` ('standard' | 'one_time' | 'password_protected')
- `password_hash` (bcrypt hash for password-protected links)
- `view_count`, `max_views` (for one-time links)
- `shared_fields` (JSONB array of fields to share)

**Link Types**:
- **Standard**: Time-based expiration, unlimited views until expiry
- **One-Time**: Limited number of views (typically 1), then becomes invalid
- **Password Protected**: Requires password to access, most secure option

**Shareable Fields** (customizable per link):
- `basic_info` - Name, breed, age, color, gender, height
- `description` - Full text description
- `pedigree` - 4-generation pedigree tree
- `health` - Vaccinations, coggins, vet check dates
- `training` - Training level and disciplines
- `competitions` - Event history and placements
- `images` - Photo gallery
- `videos` - YouTube videos
- `price` - Asking price

**RLS Policies**:
- Organization members can view their share links
- Public (anonymous) can view any share link by token
- Only admins can create/update/delete share links

#### `share_link_views`
Detailed analytics for share link tracking.
- `id`, `share_link_id` (FK to share_links)
- `viewed_at` (timestamp)
- `ip_address`, `user_agent`, `referer`
- `country`, `city`, `region` (for future IP geolocation)

**Purpose**: Track individual views with device info, location, and source.

**RLS Policies**:
- Organization members can view analytics for their share links
- Anyone (including anonymous) can insert view records

## Authentication & Authorization

### Authentication Flow

1. **Signup** (`/signup`):
   - User creates account with email/password
   - Profile record auto-created via database trigger
   - New organization created automatically
   - User added to organization_users as admin

2. **Login** (`/login`):
   - Email/password authentication via Supabase Auth
   - Session persisted in localStorage
   - Auto-refresh token enabled

3. **Session Persistence**:
   - AuthContext initializes immediately with session
   - Organization data loaded in background (non-blocking)
   - Loading state set to false after session check to prevent redirect

### Authorization Model

**Role-based Access Control**:
- `admin`: Full CRUD access to horses, can manage team members
- `read_only`: View-only access to horses, cannot edit/delete

**Helper Functions** (`src/types/organization.ts`):
```typescript
isAdmin(role): boolean
isReadOnly(role): boolean
```

### Auth Context Structure

```typescript
{
  user: User | null,
  session: Session | null,
  organization: Organization | null,
  userRole: 'admin' | 'read_only' | null,
  loading: boolean,
  signUp(email, password, firstName, lastName),
  signIn(email, password),
  signOut(),
  refreshOrganization()
}
```

## Key Features

### 1. Horse Management
- Create, edit, delete horses (admin only)
- Rich horse profiles with all breeding/health/training data
- 4-generation pedigree visualization
- Image gallery with primary photo selection
- YouTube video integration
- Competition results with external links (Equipe, USEF, FEI)
- X-ray records management

### 2. Organization & Team Management
- Profile dialog with two tabs: Profile and Organization
- First/last name management in profiles table
- Avatar displays initials from first/last name
- Team member listing with role management
- Invite users (placeholder - needs email integration)
- Change member roles (admin only)
- Remove members (admin only)

### 3. Advanced Share Links
- **Three Link Types**:
  - Standard (time-based expiration)
  - One-Time View (limited view count)
  - Password Protected (most secure)
- **Customizable Content**: Select which fields to share (pedigree, health, price, etc.)
- **Flexible Expiry Times**: Presets from 1 hour to 1 month
- **Link Management**: Edit recipient name, expiry time, and shared fields
- **View Tracking & Analytics**:
  - Total views and unique visitors
  - Views by date (last 7 days chart)
  - Geographic distribution (by country)
  - Recent views with device info (IP, user agent, referer)
  - First-seen detection for new visitors
  - Live updates (30-second refresh)
- **Security**: bcrypt password hashing (10 rounds), RLS policies, token-based access

### 4. Media Management
- Multiple images per horse with primary selection
- YouTube video embedding
- Image captions

## Important Files

### Core Application
- `src/App.tsx` - Main app with routing and providers
- `src/contexts/AuthContext.tsx` - Authentication and organization state
- `src/lib/supabase.ts` - Supabase client and TypeScript types

### Components
- `src/components/UserProfile.tsx` - Avatar dropdown with name initials
- `src/components/ProfileDialog.tsx` - Profile/organization settings modal
- `src/components/ProtectedRoute.tsx` - Auth guard for private routes
- `src/components/ShareHorse.tsx` - Share link creation/editing dialog with all link types
- `src/components/ShareLinkAnalytics.tsx` - Analytics dashboard for share link tracking
- `src/components/CompetitionManager.tsx` - Dialog for adding competition results with Equipe links

### Pages
- `src/pages/Index.tsx` - Horse listing dashboard
- `src/pages/HorseDetail.tsx` - Individual horse details
- `src/pages/SharedHorse.tsx` - Public share link view
- `src/pages/Login.tsx`, `src/pages/Signup.tsx`
- `src/pages/Profile.tsx` - User profile page

### Services
- `src/services/organizationService.ts` - Organization CRUD operations
- `src/services/horseService.ts` - Horse CRUD with organization context
- `src/services/shareService.ts` - Share link CRUD, password hashing/verification, analytics, view tracking

### Database
- `database/migrations/` - SQL migration scripts
  - `015_create_profiles_table.sql` - Profiles table with auto-creation trigger

## Common Patterns

### 1. Loading User Profile with Names

```typescript
const [profile, setProfile] = useState<{ first_name: string | null; last_name: string | null } | null>(null)

const loadProfile = async () => {
  const { data } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()

  if (data) setProfile(data)
}
```

### 2. Organization-Scoped Queries

```typescript
// Get horses for user's organization
const { data: horses } = await supabase
  .from('horses')
  .select('*')
  .eq('organization_id', organization.id)
```

RLS policies automatically enforce organization boundaries, but queries should still include organization_id for clarity.

### 3. Role-Based UI

```typescript
import { isAdmin } from '@/types/organization'

// Hide edit buttons for read-only users
{isAdmin(userRole) && (
  <Button onClick={handleEdit}>Edit</Button>
)}
```

### 4. Fetching Related Data with JOINs

Use Supabase's JOIN syntax to fetch related data in a single query:

```typescript
// Single query with JOIN via FK relationship
const { data } = await supabase
  .from('organization_users')
  .select(`
    *,
    profiles (
      first_name,
      last_name
    )
  `)
  .eq('organization_id', orgId)

// Data is already joined - no JavaScript merging needed!
const members = data.map(member => ({
  ...member,
  displayName: `${member.profiles.first_name} ${member.profiles.last_name}`
}))
```

**Key**: This works because we have a direct FK relationship: `organization_users.user_id → profiles.id` (added in migration 016).

### 5. Profile Update Pattern

```typescript
// Update profiles table (single source of truth)
await supabase
  .from('profiles')
  .upsert({ id: user.id, first_name, last_name })

// Notify other components
window.dispatchEvent(new CustomEvent('profile-updated'))
```

Profile data is stored ONLY in the `profiles` table. Auth metadata is not used.

### 6. Share Link Creation

```typescript
import { shareService, ShareLinkType, ShareableField } from '@/services/shareService'

// Create a share link
const shareLink = await shareService.createShareLink({
  horseId: horse.id,
  organizationId: organization.id,
  userId: user.id,
  recipientName: 'Client Name',
  linkType: 'password_protected', // or 'standard', 'one_time'
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  password: 'secretpass', // only for password_protected
  maxViews: 1, // only for one_time
  sharedFields: ['basic_info', 'pedigree', 'images', 'videos']
})

// Update an existing share link
await shareService.updateShareLink({
  shareLinkId: link.id,
  recipientName: 'Updated Name',
  expiresAt: newExpiryDate.toISOString(),
  sharedFields: ['basic_info', 'pedigree', 'images', 'videos', 'price']
})

// Get analytics
const analytics = await shareService.getShareLinkAnalytics(shareLinkId)
// Returns: { totalViews, uniqueVisitors, lastViewed, recentViews, viewsByDate, viewsByCountry, views, ipFirstSeen }
```

**Password Hashing**: Uses bcryptjs with 10 salt rounds. Passwords are hashed before storage, never stored in plain text.

### 7. Public Share Link Access

Share links use the anonymous (`anon`) role in Supabase. Key requirements:

```sql
-- Required: Grant SELECT permission to anon role
GRANT SELECT ON public.share_links TO anon;
GRANT SELECT ON public.horses TO anon;
GRANT SELECT ON public.horse_images TO anon;
GRANT SELECT ON public.horse_videos TO anon;
GRANT SELECT ON public.competitions TO anon;

-- Required: RLS policies that allow public access
CREATE POLICY "Public can view share links"
ON public.share_links FOR SELECT
USING (true);

CREATE POLICY "Public can view horses with share links"
ON public.horses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.share_links
    WHERE share_links.horse_id = horses.id
  )
);
```

**Testing Anonymous Access**:
```sql
-- Run in Supabase SQL Editor to test if anon role can access data
SET LOCAL ROLE anon;
SELECT * FROM public.share_links WHERE token = 'your_token_here';
RESET ROLE;
```

If this query returns nothing, RLS policies or GRANT permissions need to be fixed.

## Known Issues & Gotchas

### 1. Session Persistence
- **Issue**: Setting loading state before organization fetch caused premature redirects
- **Solution**: Set `loading = false` immediately after session check, fetch org in background
- **Location**: `src/contexts/AuthContext.tsx:125-192`

### 2. Dialog Auto-Focus
- **Issue**: Black borders appear on inputs when dialog opens
- **Solution**: Add `onOpenAutoFocus={(e) => e.preventDefault()}` to DialogContent
- **Location**: All dialog components

### 3. React Query Configuration
- **Previous Issue**: Refetching was disabled due to perceived "excessive refetching"
- **Root Cause**: Mismatched query keys between queries and invalidations (e.g., `organization.id` vs `user.id`)
- **Solution**: Fixed all query key mismatches, re-enabled refetching with proper staleTime
- **Location**: `src/App.tsx:18-30`
- **Key Pattern**: Always use `organization.id` in horses query keys, not `user.id`

### 4. Share Link Update Error (RESOLVED - 2025-11-02)
- **Issue**: "Cannot coerce the result to a single JSON object" error when updating share links
- **Root Cause**: Missing UPDATE/INSERT/DELETE RLS policies on share_links table
- **Solution**: Created migration 029 with admin-only write policies
- **Status**: ✅ Fixed and deployed
- **Related Files**:
  - `database/migrations/029_add_share_links_write_policies.sql` - Write policies
  - `docs/SHARE_LINK_UPDATE_FIX.md` - Complete documentation

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Migrations

Migrations are in `database/migrations/` and numbered sequentially:
- `001_*.sql` through `022_*.sql`
- Run in order via Supabase SQL Editor
- Each creates tables, RLS policies, triggers, and test data

### Key Migrations
- `001_organization_system.sql` - Multi-tenant organization setup
- `015_create_profiles_table.sql` - Profiles with auto-creation trigger
- `016_add_organization_users_profile_fk.sql` - FK relationship for direct JOINs
- `017_update_profile_trigger_remove_metadata.sql` - Remove auth metadata dependency
- `018_enhance_share_links.sql` - Add link_type, password_hash, view_count, max_views, shared_fields
- `019_create_share_link_views_tracking.sql` - Create share_link_views table for analytics
- `020_add_public_share_link_policies.sql` - Initial public access policies (deprecated)
- `021_fix_share_link_public_access.sql` - Comprehensive RLS policy overhaul (deprecated)
- `022_grant_anon_access_to_shares.sql` - Grant SELECT to anon role for public sharing
- `023_fix_share_link_public_access_final.sql` - Final public access RLS policies
- `029_add_share_links_write_policies.sql` - **Required**: Add INSERT/UPDATE/DELETE policies for share_links

## Running the App

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

Deployed on Vercel with:
- `vercel.json` configuration
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables set in Vercel dashboard

## Future Work

### Pending Tasks
1. Update all components to use organization and role context
2. Implement role-based UI restrictions throughout app
3. Test organization creation, user invitations, and role permissions
4. Implement actual email invitations (currently placeholder)
5. Add email verification flow
6. Add password reset functionality
7. Add organization switching (if users can belong to multiple orgs)
8. Add audit logging for admin actions

### Potential Enhancements
- Real-time collaboration with Supabase Realtime
- File upload for horse images (currently URLs only)
- Advanced search and filtering
- Export horse data to PDF
- Mobile app version
- Calendar integration for competitions
- Veterinary records management
- Training logs and progress tracking

## Architecture Decisions

### Why Multi-Tenant?
- Each organization owns their horses completely
- Data isolation enforced at database level via RLS
- Shared infrastructure reduces costs
- Easy to scale

### Why Context API over Redux?
- Simpler for auth state
- Less boilerplate
- Sufficient for current scope
- TanStack Query handles server state

### Why Supabase?
- Built-in auth with RLS integration
- PostgreSQL with full SQL support
- Real-time capabilities for future features
- Generous free tier
- Fast development

### Why Use Direct FK Relationships for JOINs?
- Direct foreign key relationship: `organization_users.user_id → profiles.id` (migration 016)
- Enables Supabase PostgREST to traverse relationships automatically
- Single query instead of multiple + JavaScript merge
- Better performance and cleaner code

## Testing Notes

### Manual Testing Checklist
- [ ] Sign up creates organization and admin user
- [ ] Login persists across page refresh
- [ ] Profile updates show in avatar initials
- [ ] Admin can see all team members
- [ ] Read-only users cannot see edit buttons
- [ ] Share links work without authentication
- [ ] Horse CRUD operations work for admins
- [ ] RLS prevents cross-organization data access

### Key Test Scenarios
1. **Multi-user**: Create 2 admin + 2 read-only accounts in same org
2. **Permissions**: Verify read-only users cannot edit/delete
3. **Organization isolation**: Create second org, verify no data leakage
4. **Session persistence**: Refresh page, verify no logout
5. **Profile sync**: Update name, verify avatar and member list update

## Recent Changes

### Share Link Write Policies Fix - COMPLETED (2025-11-02)
Fixed critical bug preventing share link updates.

**Issue**:
- Error: "Cannot coerce the result to a single JSON object" when updating share links
- Root cause: No UPDATE/INSERT/DELETE RLS policies existed on share_links table

**Solution**:
- Created migration `029_add_share_links_write_policies.sql`
- Added three new policies:
  - `share_links_insert_admin` - Admins can create share links
  - `share_links_update_admin` - Admins can update share links
  - `share_links_delete_admin` - Admins can delete share links
- All policies enforce organization membership and admin role

**Security**:
- Only authenticated admins can write to share_links
- Read-only users cannot create/update/delete
- Organization-scoped access control
- Public users can still view share links (read-only)

**Files Created**:
- `database/migrations/029_add_share_links_write_policies.sql`
- `docs/SHARE_LINK_UPDATE_FIX.md`

### Results Tab Enhancement - COMPLETED (2025-11-02)
Added comprehensive competition results management to horse detail pages.

**Changes**:
- Created `src/components/CompetitionManager.tsx` - Dialog for adding competition results
- Updated `src/pages/HorseDetail.tsx` - Results tab now always visible (not conditional)
- Competition form includes: Event name, Date, Discipline, Placement, Notes, Results link
- Empty state with helpful message when no results exist
- Admins can add results via "Add Result" button
- Enhanced result cards with better styling for notes and external links
- Results links support multiple platforms: Equipe, USEF, FEI, and others
- Links open in new tab with "View Full Results →" text and trophy icon

**Features**:
- Required fields: Event name, Date, Discipline, Placement
- Optional fields: Notes (textarea), Results link (URL validation with platform examples)
- Platform examples shown in form:
  - Equipe: `https://online.equipe.com/startlists/[id]`
  - USEF: `https://www.usef.org/...`
  - FEI: `https://data.fei.org/...`
- Real-time form validation with helpful error messages
- Automatic query invalidation to refresh horse data after adding results
- Mobile-responsive design with proper touch targets
- Special gold badge for 1st place finishes

**Files Created**:
- `src/components/CompetitionManager.tsx` (241 lines)
- `docs/RESULTS_TAB_FEATURE.md` - Technical documentation
- `docs/HOW_TO_ADD_EQUIPE_RESULTS.md` - User guide with step-by-step instructions

**Files Modified**:
- `src/pages/HorseDetail.tsx` - Updated tab structure and result display

### Modern UI Redesign - COMPLETED (2025-10-31)
Complete mobile-first redesign of landing page, horse cards, and detail page. See "Modern UI Redesign" section below for full details.

**Changes**:
- Redesigned `src/pages/Index.tsx` with stats dashboard, modern filters, responsive grid
- Redesigned `src/components/HorseCard.tsx` with hover effects and better visual hierarchy
- Redesigned `src/pages/HorseDetail.tsx` with hero section, tab navigation, and sticky action bar
- Fixed icon import issue (Horse → Zap as Horse)
- Organization name now visible on mobile in header

### Share Link Enhancement - COMPLETED (2025-10-21)
✅ **Three Link Types Implemented**:
- Standard (time-based expiration)
- One-Time View (limited view count with max_views)
- Password Protected (bcrypt hashing, 10 salt rounds)

✅ **Customizable Shared Fields**:
- JSONB array storing selected fields
- Checkbox UI with Select All/Deselect All
- 9 field options: basic_info, description, pedigree, health, training, competitions, images, videos, price

✅ **Link Management**:
- Edit functionality for recipient name, expiry time, shared fields
- Cannot change link_type after creation (security constraint)
- Visual status badges (Active, Expired, Used)

✅ **Analytics & Tracking System**:
- New `share_link_views` table with view logging
- Tracks: IP address, user agent, referer, timestamp, location
- Analytics dashboard with:
  - Total views, unique visitors, last 24h views
  - Views by date chart (last 7 days)
  - Geographic distribution (top 5 countries)
  - Recent views list with device details
  - First-seen detection for new visitors
- Auto-refresh every 30 seconds
- Helper SQL functions: get_unique_visitors(), get_recent_view_count(), get_top_countries()

✅ **Database Migrations**:
- Migration 018: Enhanced share_links table
- Migration 019: Created share_link_views tracking
- Migration 020-021: RLS policy iterations (deprecated)
- Migration 022: Anonymous role GRANT permissions

✅ **Files Created/Modified**:
- Created: `src/components/ShareLinkAnalytics.tsx`
- Modified: `src/components/ShareHorse.tsx` (complete rewrite)
- Modified: `src/pages/SharedHorse.tsx` (password UI, view logging)
- Modified: `src/services/shareService.ts` (complete rewrite with new functions)
- Modified: `src/lib/supabase.ts` (added share_link_views types)

⚠️ **In Progress**:
- Share link public access debugging (database working, frontend investigation needed)
- See "Known Issues & Gotchas" section #4 for current status

### Dependencies Added
```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

### Modern UI Redesign - COMPLETED (2025-10-31)

Complete redesign of main user-facing pages with modern, mobile-first design approach.

✅ **Landing Page Redesign** (`src/pages/Index.tsx`):
- **Sticky Header**: HDS logo, organization name (visible on mobile), user profile dropdown
- **Quick Stats Dashboard**: 4 metric cards with icon badges
  - Total Horses, Available, Breeds, Average Age
  - Color-coded icons (blue, green, purple, orange)
  - Responsive: 2 columns mobile, 4 columns desktop
- **Modern Search & Filters**:
  - Search input with icon
  - Select dropdowns for breed and status filtering
  - Active filter display with clear option
- **Horse Grid**:
  - Responsive grid (1 col mobile → 4 col desktop)
  - Staggered fade-in animations
  - Modern card hover effects
- **Empty States**: Helpful messages for no horses or no results
- **Mobile-First**: Optimized touch targets, responsive typography

✅ **Horse Card Redesign** (`src/components/HorseCard.tsx`):
- **Image Hover Effects**:
  - Image scales on hover (110% zoom)
  - Gradient overlay appears on hover
  - "View Details" button appears on hover
- **Status & Price Badges**:
  - Status badge in top-right with backdrop blur
  - Price badge appears on hover (bottom-left)
- **Better Info Display**:
  - Age and height with icons
  - Gender and color as outline badges
  - Description with line clamping
- **Default Fallback Image**: Unsplash horse photo for horses without images

✅ **Horse Detail Page Redesign** (`src/pages/HorseDetail.tsx`):
- **Hero Section**:
  - Full-width primary image (300px mobile, 400px desktop)
  - Gradient overlay (black/80 to transparent)
  - Horse name, breed, age, gender, color on image
  - Status badge with backdrop blur
  - Prominent price display in frosted glass box
- **Sticky Action Bar**:
  - Always accessible: Back, Share, Edit, YouTube manager
  - Admin-only controls properly gated
  - Compact on mobile (icons only), full on desktop
- **Tab Navigation** (5 tabs with icons):
  - **Overview**: Quick stats grid (Height, Weight, Age, Location), About section, Training & Disciplines
  - **Gallery**: HorseGallery component + admin media upload section
  - **Pedigree**: 4-generation pedigree tree (conditional - only if data exists)
  - **Health**: Visual status cards for vaccinations/coggins, last vet check, X-ray records
  - **Competitions**: Beautiful competition cards with placement badges, notes, Equipe links (conditional)
- **Quick Stats Grid**:
  - Colored icon badges for visual appeal
  - 2 columns mobile, 4 columns desktop
- **Better Visual Hierarchy**:
  - Clean card designs with proper spacing
  - Icon-labeled sections
  - Badge system for status indicators
  - Hover effects on competition cards
- **Mobile Optimization**:
  - Tab list wraps and scrolls horizontally
  - Touch-friendly spacing
  - Responsive typography (text-sm → text-lg)

**Files Modified**:
- `src/pages/Index.tsx` - Complete redesign with stats dashboard and modern filters
- `src/components/HorseCard.tsx` - Complete redesign with hover effects
- `src/pages/HorseDetail.tsx` - Complete redesign with hero section and tabs

**Design Patterns Used**:
- Mobile-first responsive design
- Icon + text labels for clarity
- Colored badge system for visual categorization
- Backdrop blur for frosted glass effects
- Gradient overlays for image text legibility
- Staggered animations for list items
- Conditional rendering based on data availability
- Admin role gating with `isAdmin(userRole)`

**Known Issue Fixed**:
- Changed Horse icon import to `Zap as Horse` (Horse doesn't exist in lucide-react)

## Contact & Support

For issues or questions, refer to the codebase or database schema. All business logic is enforced at the database level with RLS policies for security.

---

**Last Updated**: November 2, 2025
**Version**: 1.3
**Status**: Share link update fix deployed, Results tab feature complete, all systems stable
