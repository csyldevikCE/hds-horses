# Admin App Architecture Plan

**Document Version:** 1.0
**Date:** 2025-10-30
**Status:** Proposal - Awaiting Decision

---

## Executive Summary

As HDS Horses transitions from development to a production SaaS platform, we need a separate super admin application to manage organizations, users, system health, and support operations. This document outlines architectural options and recommendations.

---

## 🎯 Requirements

### Core Admin Functions Needed:
1. **Organization Management** - View, edit, delete organizations
2. **User Management** - Manage users across all organizations
3. **Health Monitoring** - System metrics, database health, performance
4. **Support Tools** - User impersonation, audit logs, ticket system
5. **System Settings** - Feature flags, announcements, configuration

---

## 📊 Architectural Options

### Option A: Monorepo with Turborepo ⭐ **RECOMMENDED**

#### Structure:
```
hds-horses/ (root)
├── apps/
│   ├── web/                    # Customer-facing app (current)
│   ├── admin/                  # Super admin panel (new)
│   └── api/                    # Optional: Backend API
│
├── packages/
│   ├── ui/                     # Shared UI components
│   ├── database/               # Database types & migrations
│   ├── auth/                   # Shared auth logic
│   └── config/                 # Shared configuration
│
├── package.json
├── turbo.json
└── pnpm-workspace.yaml
```

#### Pros:
- ✅ **Code Sharing**: Shared types, components, services
- ✅ **Type Safety**: Single source of truth for TypeScript types
- ✅ **Consistency**: Unified UI/UX across apps
- ✅ **DRY Principle**: No code duplication
- ✅ **Easier Development**: Run multiple apps simultaneously
- ✅ **Independent Deployment**: Deploy each app separately
- ✅ **Better Collaboration**: All code in one place
- ✅ **Shared Database Migrations**: Single migration system

#### Cons:
- ⚠️ Slightly more complex initial setup
- ⚠️ Larger repository size
- ⚠️ Need to learn Turborepo (minor learning curve)

#### Best For:
- Teams that want to maximize code reuse
- Projects with shared business logic
- Long-term scalability

---

### Option B: Separate Repository

#### Structure:
```
Repo 1: hds-horses/              # Customer app
Repo 2: hds-horses-admin/        # Admin app
```

#### Pros:
- ✅ Complete separation of concerns
- ✅ Simpler initial setup
- ✅ Smaller individual repositories
- ✅ Different teams can manage each repo independently

#### Cons:
- 🔴 **Code Duplication**: Types, services, components duplicated
- 🔴 **Sync Challenges**: Keeping types in sync is manual work
- 🔴 **More Maintenance**: Changes need to be made in multiple places
- 🔴 **Inconsistency Risk**: UIs can diverge over time
- 🔴 **Database Migration Sync**: Two separate migration systems

#### Best For:
- Different tech stacks for each app
- Completely separate teams
- Strong isolation requirements

---

## 🏗️ Detailed Monorepo Structure (Recommended)

### Apps Directory

#### `apps/web/` - Customer Application
```
Current HDS Horses application
- Organization management
- Horse management
- Team collaboration
- Share links
```

#### `apps/admin/` - Super Admin Panel
```
New administrative interface
- System-wide organization management
- Cross-organization user management
- Health monitoring
- Support tools
```

#### `apps/api/` - Backend API (Optional)
```
Shared backend services (if needed)
- Complex business logic
- Third-party integrations
- Scheduled jobs
```

### Packages Directory

#### `packages/ui/`
**Shared UI Components**
```typescript
// Shared components
- Button, Card, Input, etc.
- Forms and layouts
- Icons and assets
- Tailwind config
```

#### `packages/database/`
**Database Layer**
```typescript
// Shared database types and client
- Supabase client configuration
- TypeScript types from database
- Database migrations
- Helper functions
```

#### `packages/auth/`
**Authentication Logic**
```typescript
// Shared auth utilities
- Auth hooks (useAuth, useUser)
- Auth context
- Permission helpers
- Role-based access control
```

#### `packages/config/`
**Shared Configuration**
```
- ESLint config
- TypeScript config
- Tailwind config
- Prettier config
```

---

## 🎨 Admin App Features Specification

### 1. Dashboard (`/admin`)

**Overview Metrics:**
```
┌─────────────────────────────────────────┐
│  📊 Dashboard                            │
├─────────────────────────────────────────┤
│  Organizations: 156                      │
│  Total Users: 423                        │
│  Active (30d): 298                       │
│  Total Horses: 1,247                     │
│  Storage Used: 45.2 GB / 100 GB          │
└─────────────────────────────────────────┘

Recent Activity:
• New organization created: "Sunset Stables"
• User invitation accepted: user@example.com
• Horse added: "Thunder" by "Oak Ridge Farm"
```

**Charts:**
- User growth over time
- Organization creation trend
- Storage usage trend
- Active users daily

---

### 2. Organizations Management (`/admin/organizations`)

**List View:**
| Organization | Members | Horses | Storage | Status | Created |
|-------------|---------|--------|---------|--------|---------|
| Hannell Dressage | 4 | 22 | 2.3 GB | Active | 2024-01-15 |
| Oak Ridge Farm | 2 | 15 | 1.8 GB | Active | 2024-02-20 |

**Detail View:**
```
Organization: Hannell Dressage Stable AB
ID: d9c0b512-a649-4757-9fe6-fd27014ec524
Created: 2024-01-15
Status: Active

Members (4):
├── John Doe (Admin) - john@hannell.com
├── Jane Smith (Admin) - jane@hannell.com
├── Bob Wilson (Read-only) - bob@hannell.com
└── Alice Brown (Read-only) - alice@hannell.com

Resources:
├── Horses: 22
├── Share Links: 8 active
├── Storage: 2.3 GB
└── Invitations: 1 pending

Recent Activity:
• 2024-10-29: Horse "St. Shuffle" added
• 2024-10-28: Share link created for "Monaco"
• 2024-10-27: User "Alice Brown" joined
```

**Actions Available:**
- ✏️ Edit organization details
- 👥 Manage members
- 🔍 View audit log
- 🎭 Impersonate admin (for support)
- ⚠️ Suspend organization
- 🗑️ Delete organization (with safeguards)

---

### 3. Users Management (`/admin/users`)

**List View with Filters:**
```
Filters: [All Users ▼] [All Orgs ▼] [Active ▼]
Search: [________________] 🔍

| User | Email | Organizations | Role | Last Active | Status |
|------|-------|---------------|------|-------------|--------|
| John Doe | john@... | Hannell (Admin) | Admin | 2h ago | Active |
| Jane Smith | jane@... | Oak Ridge (Admin) | Admin | 1d ago | Active |
```

**User Detail View:**
```
User: John Doe
Email: john@hannell.com
ID: abc123...
Created: 2024-01-15
Last Login: 2024-10-30 14:23

Organizations:
├── Hannell Dressage Stable AB (Admin)
└── [No other organizations]

Activity (Last 7 days):
├── 45 logins
├── 12 horses modified
├── 3 share links created
└── 2 team invitations sent

Security:
├── 2FA: Enabled ✓
├── Email Verified: Yes ✓
├── Password Last Changed: 30 days ago
└── Failed Login Attempts: 0
```

**Actions Available:**
- ✏️ Edit user details
- 🔑 Reset password
- 📧 Resend verification email
- 🚫 Suspend account
- 🎭 Impersonate user (for support)
- 📊 View full activity log
- 🗑️ Delete user (with safeguards)

---

### 4. Health Monitoring (`/admin/health`)

**System Health Dashboard:**

**Database:**
```
PostgreSQL Status: ✓ Healthy
Connection Pool: 12/100 connections
Avg Query Time: 45ms
Slow Queries (>1s): 0

Top Tables by Size:
├── horses: 234 MB (12,470 rows)
├── horse_images: 189 MB (45,230 rows)
├── share_links: 12 MB (3,450 rows)
└── organizations: 2 MB (156 rows)
```

**API Performance:**
```
Request Rate: 1,234 req/min
Error Rate: 0.02% ✓
Avg Response Time: 120ms
P95 Response Time: 340ms
P99 Response Time: 890ms

Errors (Last Hour):
└── No critical errors ✓
```

**Storage:**
```
Total Storage: 45.2 GB / 100 GB (45%)
├── Horse Images: 38.2 GB
├── Database: 5.1 GB
└── Other: 1.9 GB

Top Organizations by Storage:
├── Hannell Dressage: 2.3 GB
├── Oak Ridge Farm: 1.8 GB
└── Sunset Stables: 1.2 GB
```

**Real-time Monitoring:**
```
Active Users: 47
Active Sessions: 52
Background Jobs: 3 running
WebSocket Connections: 12
```

**Alerts Configuration:**
- Email alerts for critical errors
- Slack notifications for downtime
- SMS for database failures
- Alert thresholds configurable

---

### 5. Support Tools (`/admin/support`)

**Support Ticket System:**
```
Open Tickets (12):
┌─────────────────────────────────────────┐
│ #1234: Can't upload horse images         │
│ User: john@example.com                    │
│ Priority: High                            │
│ Assigned: Support Team                    │
│ Created: 2h ago                           │
└─────────────────────────────────────────┘

Actions:
├── View conversation
├── Assign to team member
├── Change priority
├── Impersonate user to debug
└── Mark as resolved
```

**User Impersonation:**
```
⚠️ PRIVILEGED ACTION - LOGGED

Impersonate User:
Email: [john@example.com]
Reason: [Debugging image upload issue]
Duration: [30 minutes ▼]

[Start Impersonation Session] [Cancel]

Note: All actions during impersonation are logged
and visible to the user.
```

**Audit Logs:**
```
All Admin Actions:
┌─────────────────────────────────────────┐
│ 2024-10-30 14:23 - Admin User           │
│ Action: Impersonated john@example.com    │
│ Reason: Debug image upload               │
│ Duration: 15 minutes                      │
│ Changes Made: None                        │
└─────────────────────────────────────────┘

User Actions (Filtered):
├── Organization: Hannell Dressage
├── User: john@hannell.com
├── Action: Created horse "Monaco"
└── Timestamp: 2024-10-29 10:15
```

---

### 6. System Settings (`/admin/settings`)

**Feature Flags:**
```
┌─────────────────────────────────────────┐
│ Feature Flags                            │
├─────────────────────────────────────────┤
│ ☑ Share Links (Enabled globally)        │
│ ☑ Team Invitations (Enabled)            │
│ ☐ X-Ray Upload (Beta)                   │
│ ☐ Video Upload (Coming soon)            │
│ ☑ Password Protected Shares (Enabled)   │
└─────────────────────────────────────────┘

Per-organization overrides available
```

**System Announcements:**
```
Active Announcements:
┌─────────────────────────────────────────┐
│ ℹ️ Scheduled Maintenance                │
│ Date: Nov 1, 2024 02:00-04:00 UTC       │
│ Message: System will be down for updates│
│ Show to: All users                       │
│ [Edit] [Delete]                          │
└─────────────────────────────────────────┘

[+ Create New Announcement]
```

**Email Template Editor:**
```
Template: Invitation Email
Subject: You're invited to join [ORG_NAME]

Body:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hi {{first_name}},

You've been invited to join {{organization_name}}
as a {{role}} member.

[Accept Invitation Button]

This invitation expires in 7 days.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available Variables:
- {{first_name}}, {{last_name}}
- {{organization_name}}, {{role}}
- {{inviter_name}}, {{expiry_date}}

[Preview] [Save Template]
```

---

## 🔐 Security & Permissions

### Admin Access Levels:

**Super Admin** (Full Access):
- All organizations
- All users
- All settings
- Destructive actions
- User impersonation

**Support Admin** (Limited Access):
- View-only for organizations
- View-only for users
- User impersonation (logged)
- No destructive actions
- No settings changes

**Read-Only Admin**:
- View all data
- No modifications
- No impersonation
- Analytics access

### Security Requirements:
1. **Authentication**:
   - Separate admin auth table
   - 2FA required for all admin accounts
   - Admin sessions expire after 8 hours

2. **Audit Trail**:
   - All admin actions logged
   - User impersonation tracked with reason
   - Destructive actions require confirmation

3. **Access Control**:
   - Role-based permissions (RBAC)
   - IP whitelisting for admin panel
   - Rate limiting on admin API calls

---

## 💾 Database Requirements

### New Tables Needed:

#### `admin_users`
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'support_admin', 'read_only')),
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `admin_audit_logs`
```sql
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL, -- 'view', 'edit', 'delete', 'impersonate', etc.
  resource_type TEXT NOT NULL, -- 'organization', 'user', 'setting', etc.
  resource_id UUID,
  details JSONB, -- Additional context
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `feature_flags`
```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  organization_overrides JSONB, -- { "org_id": true/false }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `system_announcements`
```sql
CREATE TABLE system_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('info', 'warning', 'error')),
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  target_audience TEXT, -- 'all', 'admins', 'specific_orgs'
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🚀 Implementation Plan

### Phase 1: Foundation (Week 1-2)
- [ ] Set up monorepo structure with Turborepo
- [ ] Extract shared code into packages
- [ ] Create admin app skeleton
- [ ] Set up admin authentication
- [ ] Create admin database tables

### Phase 2: Core Features (Week 3-4)
- [ ] Dashboard with metrics
- [ ] Organizations list and detail views
- [ ] Users list and detail views
- [ ] Basic search and filtering

### Phase 3: Advanced Features (Week 5-6)
- [ ] Health monitoring dashboard
- [ ] User impersonation
- [ ] Audit logging
- [ ] Support ticket system (basic)

### Phase 4: System Management (Week 7-8)
- [ ] Feature flags
- [ ] System announcements
- [ ] Email template editor
- [ ] Settings management

### Phase 5: Polish & Deploy (Week 9-10)
- [ ] UI/UX refinement
- [ ] Security hardening
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deployment

---

## 📦 Technology Stack

### Admin App:
- **Framework**: React 19 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui (shared with main app)
- **Routing**: React Router v6
- **State**: TanStack Query + React Context
- **Database**: Supabase (same as main app)
- **Charts**: Recharts or Chart.js
- **Auth**: Separate admin auth system

### Monorepo:
- **Build System**: Turborepo
- **Package Manager**: pnpm (recommended for monorepos)
- **Shared Packages**: TypeScript, ESLint, Prettier configs

### Deployment:
- **Admin App**: Vercel (separate deployment)
- **Main App**: Vercel (existing)
- **Database**: Supabase (shared)
- **Domain**: admin.hdsstables.com

---

## 💰 Cost Considerations

### Monorepo Approach:
- **Additional Costs**: ~$0 (uses same infrastructure)
- **Deployment**: Free tier on Vercel for both apps
- **Database**: Shared Supabase instance (no additional cost)

### Separate Repo Approach:
- **Additional Costs**: Same as monorepo
- **Maintenance**: Higher (duplicate code, sync efforts)

---

## 🎯 Decision Points

### Questions to Consider:

1. **Team Size**:
   - Solo developer? → Monorepo easier to manage
   - Multiple teams? → Still recommend monorepo for code sharing

2. **Timeline**:
   - Need quick prototype? → Separate repo faster initially
   - Long-term project? → Monorepo saves time later

3. **Complexity**:
   - Simple admin needs? → Either approach works
   - Complex admin features? → Monorepo better for code reuse

4. **Future Plans**:
   - Mobile app planned? → Monorepo allows sharing with mobile
   - API service planned? → Monorepo makes sense

---

## 🔄 Migration Path

If starting with separate repo, migration to monorepo later:

1. Create monorepo structure
2. Move main app to `apps/web/`
3. Move admin app to `apps/admin/`
4. Extract shared code to `packages/`
5. Update imports and dependencies
6. Configure Turborepo
7. Update CI/CD pipelines

**Estimated effort**: 1-2 weeks for full migration

---

## ✅ Recommendation

**Choose Monorepo with Turborepo** because:

1. ✅ Maximizes code reuse (types, components, services)
2. ✅ Easier to keep apps in sync
3. ✅ Better long-term scalability
4. ✅ Industry best practice for multi-app projects
5. ✅ Not significantly more complex to set up
6. ✅ Future-proof for mobile app or other services

**Next Steps**:
1. Approve architecture approach
2. Set up monorepo structure
3. Create admin database schema
4. Build admin authentication
5. Implement dashboard and core features

---

## 📚 References

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Monorepo Best Practices](https://monorepo.tools/)
- [Supabase Multi-tenant Guide](https://supabase.com/docs/guides/auth/multi-tenancy)
- [React + Turborepo Starter](https://github.com/vercel/turbo/tree/main/examples/with-react)

---

**Document Owner**: Development Team
**Last Updated**: 2025-10-30
**Next Review**: After architecture decision
