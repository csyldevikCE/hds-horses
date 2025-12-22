# HDS Horses - Project Guide

## Overview

Horse management application for tracking horses, health records, competitions, and media.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query v5 (React Query)
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **Routing**: React Router v6

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # shadcn/ui base components
│   └── *.tsx        # Feature components
├── contexts/        # React contexts (AuthContext)
├── pages/           # Route pages (Index, HorseDetail, Login, etc.)
├── services/        # API/Supabase service functions
├── types/           # TypeScript type definitions
├── hooks/           # Custom React hooks
└── lib/             # Utilities (supabase client, utils)
```

## Key Files

- `src/contexts/AuthContext.tsx` - Auth state, organization loading, session management
- `src/services/horseService.ts` - Horse CRUD operations with Supabase
- `src/pages/Index.tsx` - Main horse list page
- `src/pages/HorseDetail.tsx` - Individual horse view with tabs
- `src/App.tsx` - Routes and QueryClient configuration

## Architecture Patterns

### Multi-tenant Organization System
- Users belong to organizations
- Horses are scoped to organizations via `organization_id`
- RLS (Row Level Security) enforces access control in Supabase

### Data Fetching
- TanStack Query for all data fetching
- Query keys follow pattern: `['entity', id]` or `['entity', parentId]`
- Mutations invalidate related queries after success

## Known Issues & Fixes

### 1. Infinite Loading on Tab Switch (FIXED)

**Problem**: App showed "Loading your stable..." forever when switching browser tabs.

**Root Causes**:
1. `TOKEN_REFRESHED` event from Supabase triggered org refetch
2. `organizationLoading` set to `true` but never set back to `false` on timeout
3. React Query's `isLoading` is `true` for disabled queries

**Fixes Applied**:
- Don't refetch org data on `TOKEN_REFRESHED` - it hasn't changed
- Only show loading spinner when `!organization` (no cached data)
- Disabled `refetchOnWindowFocus` in QueryClient config

### 2. Horse Query Timeouts (PARTIALLY FIXED)

**Problem**: Loading horse details sometimes hangs forever.

**Fixes Applied**:
- Added 5-second timeouts to each related data query (images, videos, competitions)
- Use `Promise.allSettled` so one failure doesn't block others
- Added 10-15 second timeouts to main queries

**Debug**: Console logging added to HorseDetail to track query state.

### 3. Mutation Blocking on Query Invalidation (FIXED)

**Problem**: "Add Result" button stayed loading after successful mutation.

**Root Cause**: `await queryClient.invalidateQueries()` blocked if the query hung.

**Fix**: Removed `await` from all `invalidateQueries({ queryKey: ['horse', horseId] })` calls.

## Configuration

### QueryClient Settings (App.tsx)
```typescript
{
  refetchOnWindowFocus: false,  // Prevents reload loops
  refetchOnMount: true,
  refetchOnReconnect: true,
  staleTime: 5 * 60 * 1000,     // 5 minutes
  retry: 1,
}
```

### Supabase Auth Events Handled
- `SIGNED_IN` - Fetch org data
- `SIGNED_OUT` - Clear all state
- `TOKEN_REFRESHED` - Update session only (don't refetch org)
- `INITIAL_SESSION` - Skipped (handled in initialization)

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```

## Deployment

Pushes to `main` branch trigger automatic deployment.
