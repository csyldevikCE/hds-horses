# Tech Stack Summary - HDS Horses

This document provides a comprehensive overview of the technology stack, architecture patterns, and key dependencies used in the HDS Horses project. Use this as a reference for building similar multi-tenant applications.

## Core Technologies

### Frontend Framework
- **React 18.3.1** - Modern React with concurrent features
- **TypeScript 5.5.3** - Full type safety throughout the application
- **Vite 5.4.1** - Lightning-fast build tool and dev server

### Routing & Navigation
- **React Router v6.26.2** - Client-side routing with modern API

### Backend & Database
- **Supabase** - Complete backend-as-a-service solution
  - PostgreSQL database with advanced features
  - Built-in authentication with JWT tokens
  - Row Level Security (RLS) for data isolation
  - Storage buckets for file uploads (public & private)
  - Realtime capabilities (not yet utilized)
  - Auto-generated TypeScript types from database schema

### State Management
- **React Context API** - Global auth and organization state
- **TanStack Query v5.56.2** (React Query) - Server state management
  - Smart caching with 2-minute stale time
  - Automatic background refetching
  - Optimistic updates
  - Query invalidation patterns

## UI & Styling

### Component Library
- **Radix UI** - Unstyled, accessible component primitives
  - `@radix-ui/react-dialog` - Modal dialogs
  - `@radix-ui/react-dropdown-menu` - Dropdown menus
  - `@radix-ui/react-select` - Select dropdowns
  - `@radix-ui/react-tabs` - Tab navigation
  - `@radix-ui/react-avatar` - Avatar components
  - `@radix-ui/react-label` - Form labels
  - `@radix-ui/react-checkbox` - Checkboxes
  - Plus 15+ other accessible primitives

### Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **tailwindcss-animate** - Animation utilities
- **shadcn/ui** - Pre-built component templates built on Radix + Tailwind
  - 49 components in `src/components/ui/`
  - Fully customizable and owned by the codebase

### Icons
- **lucide-react 0.462.0** - Beautiful, consistent icon library
  - 1000+ icons
  - Tree-shakeable

## Authentication & Security

### Auth System
- **Supabase Auth** - Complete authentication solution
  - Email/password authentication
  - Session management with auto-refresh
  - JWT token-based security
  - Invitation-based signup flow

### Security
- **bcryptjs 2.2.6** - Password hashing for share links
  - 10 salt rounds for password-protected shares
- **Row Level Security (RLS)** - Database-level access control
  - All tables have RLS policies
  - Multi-tenant data isolation
  - Role-based access (admin, read_only)

## Specialized Features

### Medical Imaging (DICOM)
- **@cornerstonejs/core 1.95.5** - Medical image rendering engine
- **@cornerstonejs/tools 2.2.4** - Medical image manipulation tools
- **cornerstone-wado-image-loader 4.15.1** - DICOM file loader
- **dicom-parser 1.8.21** - DICOM file parsing

### Data Visualization
- **recharts 2.15.0** - Charts and graphs for analytics
- **react-simple-maps 3.0.0** - Geographic visualization for share link analytics

### Form Handling
- **react-hook-form** - Performance-focused form library (if needed)
- Custom form validation with TypeScript

## Development Tools

### Build & Dev Tools
- **Vite 5.4.1**
  - Hot Module Replacement (HMR)
  - Optimized production builds
  - Plugin ecosystem
  - `vite-plugin-static-copy` - Copy static assets

### Code Quality
- **ESLint** - Code linting with TypeScript support
- **TypeScript 5.5.3** - Static type checking
- **Prettier** (recommended) - Code formatting

## Deployment

### Hosting
- **Vercel** - Serverless deployment platform
  - Automatic deployments from Git
  - Environment variable management
  - Preview deployments for PRs
  - Edge network CDN
  - Zero-config deployment

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Architecture Patterns

### Multi-Tenancy
- **Organization-based isolation** - Each organization owns their data
- **RLS enforcement** - Database-level security prevents cross-org access
- **Automatic org context** - All queries scoped to user's organization

### Component Architecture
```
src/
├── components/          # Reusable components
│   ├── ui/             # shadcn/ui components (49 files)
│   └── *.tsx           # Feature components (25 files)
├── pages/              # Route components (13 pages)
├── contexts/           # React Context providers
├── services/           # Business logic & API calls (8 services)
├── lib/                # Utilities & Supabase client
├── types/              # TypeScript type definitions
└── hooks/              # Custom React hooks
```

### Service Layer Pattern
- **Separation of concerns** - Business logic separate from UI
- **Type-safe APIs** - Full TypeScript coverage
- **Centralized error handling**
- **Reusable across components**

Example services:
- `horseService.ts` - Horse CRUD operations
- `shareService.ts` - Share link management with bcrypt
- `vaccinationService.ts` - FEI-compliant vaccination tracking
- `vetVisitService.ts` - Veterinary visit records
- `xrayService.ts` - X-ray file management with signed URLs
- `organizationService.ts` - Organization management

### Database Schema Pattern
```typescript
// Full TypeScript types generated from Supabase schema
type Database = {
  public: {
    Tables: {
      horses: {
        Row: { /* select result */ }
        Insert: { /* insert params */ }
        Update: { /* update params */ }
      }
      // ... all tables
    }
  }
}
```

### RLS Policy Pattern
```sql
-- Example: Users can only view horses in their organization
CREATE POLICY "Users can view own org horses"
ON public.horses FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_users
    WHERE user_id = auth.uid()
  )
);
```

### Data Fetching Pattern
```typescript
// Using TanStack Query with organization context
const { data: horses } = useQuery({
  queryKey: ['horses', organization.id],
  queryFn: () => horseService.getHorses(organization.id),
  staleTime: 2 * 60 * 1000, // 2 minutes
})
```

### Role-Based Access Control
```typescript
// Helper functions
isAdmin(role): boolean
isReadOnly(role): boolean
canAddRole(currentCount, role): boolean

// Usage in components
{isAdmin(userRole) && (
  <Button onClick={handleEdit}>Edit</Button>
)}
```

## Key Features & Patterns

### 1. File Upload to Supabase Storage
```typescript
// Upload to private bucket
const { data } = await supabase.storage
  .from('horse-xrays')
  .upload(filePath, file)

// Generate signed URL (1 hour expiry)
const { data } = await supabase.storage
  .from('horse-xrays')
  .createSignedUrl(filePath, 3600)
```

### 2. Advanced Share Links
- Three link types: Standard, One-Time, Password-Protected
- Customizable shared fields (JSONB array)
- bcrypt password hashing
- View tracking with analytics
- Anonymous access via RLS policies

### 3. Direct Foreign Key JOINs
```typescript
// Efficient single-query pattern
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
```

### 4. FEI-Compliant Vaccination Tracking
- Automatic next-due-date calculation
- Protocol-based dose numbering (V1, V2, V3, Boosters)
- Compliance status tracking
- Multiple vaccine types

### 5. Medical Image Viewing
- DICOM file support with Cornerstone.js
- Zoom, Pan, Window/Level tools
- JPEG/PNG support for standard X-rays
- Private bucket with signed URLs

## Database Migration Pattern

```
database/migrations/
├── 001_organization_system.sql
├── 002_horses_table.sql
├── 003_competitions.sql
├── ...
└── 034_horse_xrays_bucket.sql
```

Each migration includes:
- Table creation with constraints
- RLS policies
- Indexes for performance
- GRANT statements for anonymous access
- Triggers for automation
- CASCADE delete rules

## Performance Optimizations

1. **TanStack Query caching** - 2-minute stale time, background refetching
2. **Database indexes** - All foreign keys and frequently queried columns
3. **Signed URL caching** - 1-hour expiry for repeated access
4. **Component code splitting** - Lazy loading with React.lazy()
5. **Image optimization** - Responsive images, lazy loading
6. **Vite production builds** - Minification, tree-shaking, chunk splitting

## Mobile Responsiveness

- **Mobile-first design** - All components responsive
- **Breakpoint system** - Tailwind's default breakpoints (sm, md, lg, xl, 2xl)
- **Touch-friendly** - Proper touch target sizes (44x44px minimum)
- **Responsive typography** - Text scales appropriately
- **Hamburger menus** - Mobile navigation patterns

## Accessibility

- **Radix UI primitives** - WAI-ARIA compliant out of the box
- **Keyboard navigation** - All interactive elements keyboard accessible
- **Focus management** - Proper focus trapping in dialogs
- **Screen reader support** - Semantic HTML and ARIA labels
- **Color contrast** - WCAG AA compliant color combinations

## Testing Strategy (Recommended)

While not currently implemented, recommended testing stack:

- **Vitest** - Fast unit testing with Vite integration
- **React Testing Library** - Component testing
- **Playwright** - E2E testing
- **MSW (Mock Service Worker)** - API mocking

## Package Manager

- **npm** - Default package manager
- Lock file: `package-lock.json`

## Browser Support

- **Modern browsers** - Chrome, Firefox, Safari, Edge (latest 2 versions)
- **ES2020+ features** - Uses modern JavaScript
- **CSS Grid & Flexbox** - Modern layout techniques

## Key Dependencies Summary

```json
{
  "dependencies": {
    "@cornerstonejs/core": "^1.95.5",
    "@cornerstonejs/tools": "^2.2.4",
    "@radix-ui/react-*": "^1.x.x",
    "@supabase/supabase-js": "^2.53.0",
    "@tanstack/react-query": "^5.56.2",
    "bcryptjs": "^2.2.6",
    "cornerstone-wado-image-loader": "^4.15.1",
    "dicom-parser": "^1.8.21",
    "lucide-react": "^0.462.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2",
    "recharts": "^2.15.0",
    "tailwindcss": "^3.4.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.5.3",
    "vite": "^5.4.1"
  }
}
```

## Project Structure Best Practices

### 1. Component Organization
- Small, focused components (< 400 lines)
- Separate UI components from business logic
- Reusable components in `/components`
- Page-specific components in `/pages`

### 2. Type Safety
- All components use TypeScript
- Database types auto-generated from Supabase
- Strict mode enabled
- No `any` types (use proper typing)

### 3. Error Handling
- Try-catch in all async operations
- User-friendly error messages via toast notifications
- Console logging for debugging
- Graceful fallbacks for missing data

### 4. Code Style
- Consistent naming conventions (camelCase for variables, PascalCase for components)
- Descriptive variable names
- Comments for complex logic
- Clean, readable code over clever code

## Common Patterns to Replicate

### 1. Protected Routes
```typescript
<Route element={<ProtectedRoute />}>
  <Route path="/horses" element={<Index />} />
  <Route path="/horses/:id" element={<HorseDetail />} />
</Route>
```

### 2. Toast Notifications
```typescript
const { toast } = useToast()

toast({
  title: 'Success',
  description: 'Operation completed successfully',
})
```

### 3. Dialog Pattern
```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### 4. Mutation Pattern
```typescript
const mutation = useMutation({
  mutationFn: (data) => service.create(data),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['items'] })
    toast({ title: 'Created successfully' })
    setOpen(false)
  },
  onError: (error) => {
    toast({ title: 'Error', description: error.message, variant: 'destructive' })
  },
})
```

## Resources & Documentation

- **Supabase Docs**: https://supabase.com/docs
- **TanStack Query**: https://tanstack.com/query/latest/docs/react/overview
- **Radix UI**: https://www.radix-ui.com/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com/
- **Cornerstone.js**: https://www.cornerstonejs.org/
- **React Router**: https://reactrouter.com/

## Environment Setup

### Prerequisites
- Node.js 18+ (20.x recommended)
- npm 9+
- Supabase account
- Vercel account (for deployment)

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

---

**Last Updated**: November 7, 2025
**Project**: HDS Horses Multi-Tenant Horse Management System
**Version**: 1.4
