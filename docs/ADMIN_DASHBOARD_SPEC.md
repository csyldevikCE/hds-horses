# Admin Dashboard - Technical Specification

**Version**: 1.0
**Date**: November 3, 2025
**Purpose**: Super admin portal for platform management and monitoring

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Feature Specifications](#feature-specifications)
4. [API Endpoints](#api-endpoints)
5. [Security Model](#security-model)
6. [UI Components](#ui-components)
7. [Implementation Plan](#implementation-plan)

---

## Architecture Overview

### Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite (same as main app)
- TanStack Query for data fetching
- Recharts for analytics visualization
- shadcn/ui + Tailwind CSS

**Backend:**
- Supabase (PostgreSQL + Auth + RLS)
- Same database as main app, separate admin schema
- Supabase Edge Functions for complex operations

**Deployment:**
- Vercel (separate project)
- Domain: `admin.hds-horses.com`
- Protected with 2FA

### High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│           admin.hds-horses.com                  │
│         (Separate Vercel Project)               │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│            Supabase Backend                     │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  public   │  │  admin   │  │ Edge         │ │
│  │  schema   │  │  schema  │  │ Functions    │ │
│  └───────────┘  └──────────┘  └──────────────┘ │
└─────────────────────────────────────────────────┘
```

**Key Principles:**
- Separate admin role in Supabase Auth
- RLS policies enforce admin-only access
- Read-only access to main app tables
- Admin-specific tables for logs, settings
- No shared code between main app and admin (separate repos)

---

## Database Schema

### New Tables (admin schema)

#### `admin.super_admins`
Super admin users with special permissions.

```sql
CREATE TABLE admin.super_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'support', 'finance', 'read_only')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,

  UNIQUE(user_id)
);

-- RLS: Only super admins can view
CREATE POLICY "Super admins can view super_admins"
ON admin.super_admins FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin.super_admins
    WHERE user_id = auth.uid() AND is_active = true
  )
);
```

---

#### `admin.audit_logs`
Track all admin actions for accountability.

```sql
CREATE TABLE admin.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'suspend_org', 'change_plan', 'impersonate', 'refund', etc.
  entity_type TEXT NOT NULL, -- 'organization', 'user', 'subscription', etc.
  entity_id UUID NOT NULL,
  details JSONB, -- Additional context (old_value, new_value, reason, etc.)
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_admin ON admin.audit_logs(admin_user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON admin.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON admin.audit_logs(action, created_at DESC);

-- RLS: Read-only for all admins
CREATE POLICY "Admins can view audit logs"
ON admin.audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin.super_admins
    WHERE user_id = auth.uid() AND is_active = true
  )
);
```

---

#### `admin.platform_settings`
Global configuration and feature flags.

```sql
CREATE TABLE admin.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example settings:
-- { key: 'maintenance_mode', value: { enabled: false, message: '' } }
-- { key: 'feature_flags', value: { share_links: true, xrays: true } }
-- { key: 'rate_limits', value: { share_links_per_month: { starter: 10, pro: 50 } } }
-- { key: 'trial_duration_days', value: 14 }
```

---

#### `admin.organization_notes`
Internal notes about organizations (customer success, support issues, etc.)

```sql
CREATE TABLE admin.organization_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  note TEXT NOT NULL,
  type TEXT CHECK (type IN ('general', 'support', 'sales', 'billing', 'churn_risk')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_org_notes ON admin.organization_notes(organization_id, created_at DESC);
```

---

#### `admin.promo_codes`
Discount codes for marketing campaigns.

```sql
CREATE TABLE admin.promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC NOT NULL, -- 50 (50% off) or 10 ($10 off)
  applies_to TEXT[] NOT NULL, -- ['starter', 'professional'] or ['all']
  max_uses INTEGER, -- NULL = unlimited
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### `admin.promo_redemptions`
Track who used promo codes.

```sql
CREATE TABLE admin.promo_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_code_id UUID REFERENCES admin.promo_codes(id),
  organization_id UUID REFERENCES public.organizations(id),
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Enhanced Existing Tables

#### Add admin fields to `organizations`

```sql
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'business', 'enterprise'));

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS
  billing_status TEXT DEFAULT 'active' CHECK (billing_status IN ('active', 'trial', 'overdue', 'suspended', 'canceled'));

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS
  trial_ends_at TIMESTAMPTZ;

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS
  subscription_id TEXT; -- Stripe subscription ID

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS
  mrr NUMERIC DEFAULT 0; -- Monthly recurring revenue

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS
  last_active_at TIMESTAMPTZ;

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS
  suspended_at TIMESTAMPTZ;

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS
  suspended_reason TEXT;
```

---

#### Add tracking to `organization_users`

```sql
ALTER TABLE public.organization_users ADD COLUMN IF NOT EXISTS
  last_login TIMESTAMPTZ;

ALTER TABLE public.organization_users ADD COLUMN IF NOT EXISTS
  login_count INTEGER DEFAULT 0;
```

---

### Analytics Tables (Materialized Views)

#### `admin.analytics_daily_snapshot`
Daily aggregated metrics for fast dashboard loading.

```sql
CREATE TABLE admin.analytics_daily_snapshot (
  date DATE PRIMARY KEY,
  total_organizations INTEGER,
  active_organizations INTEGER,
  trial_organizations INTEGER,
  total_users INTEGER,
  total_horses INTEGER,
  total_share_links_created INTEGER,
  total_mrr NUMERIC,
  new_signups INTEGER,
  churned_organizations INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Populated by scheduled Edge Function daily
```

---

## Feature Specifications

### 1. Organizations Dashboard

#### List View

**Columns:**
- Organization Name (clickable → detail view)
- Plan (Badge: Starter, Pro, Business, Enterprise)
- Status (Badge: Active, Trial, Suspended, Canceled)
- MRR ($79/mo)
- Users (3/4)
- Horses (12/20)
- Last Active (2 hours ago)
- Created (Jan 15, 2025)
- Actions (•••)

**Filters:**
- Plan: All, Starter, Professional, Business, Enterprise
- Status: All, Active, Trial, Overdue, Suspended, Canceled
- Billing: All, Current, Overdue (7+ days), Canceled
- Activity: All, High (daily login), Medium (weekly), Low (monthly), Inactive (30+ days)
- Date Range: Custom, Last 7 days, Last 30 days, Last 90 days
- MRR: Custom range ($0-$1000+)

**Search:**
- By organization name, email domain, contact name

**Sort:**
- MRR (high to low)
- Created date (newest first)
- Last active (most recent)
- Horses count (high to low)

**Actions (Dropdown):**
- View Details
- Impersonate (login as admin user)
- Change Plan
- Suspend / Unsuspend
- Add Note
- View Audit Log
- Delete (with confirmation)

---

#### Detail View

**Layout: Tabs**

**Tab 1: Overview**

**Top Cards (4 Metrics):**
- MRR: $79/mo (↑ from $29)
- Users: 3/4 (75% of limit)
- Horses: 12/20 (60% of limit)
- Share Links: 23 this month

**Organization Info:**
- Name, Created date, Plan, Status
- Billing cycle (Monthly/Annual)
- Next billing date
- Trial ends (if applicable)
- Edit button (change name, plan)

**Usage Metrics:**
- Total horses created (lifetime)
- Total share links created
- Total views on share links
- Total images uploaded
- Storage used (MB)

**Recent Activity (Timeline):**
- User "John Smith" logged in (2 hours ago)
- Created horse "Thunder" (Yesterday)
- Sent share link to "client@email.com" (2 days ago)
- Upgraded to Professional (7 days ago)

**Actions:**
- Change Plan
- Suspend Account
- Send Message
- Add Internal Note
- View Full Audit Log

---

**Tab 2: Users**

**Table:**
- Name (First Last)
- Email
- Role (Admin, Read-only)
- Last Login (2 hours ago)
- Login Count (43 total)
- Status (Active, Suspended)
- Actions (View, Suspend, Remove)

**Actions:**
- Impersonate user
- Reset password
- Suspend user
- Remove from organization

---

**Tab 3: Horses**

**Table:**
- Name
- Breed
- Status (Available, Sold, Reserved)
- Created Date
- Share Links (2 active)
- Actions (View, Delete)

**Metrics:**
- Total: 12 horses
- Available: 8
- Sold: 2
- Reserved: 2

---

**Tab 4: Share Links**

**Table:**
- Recipient Name
- Horse Name
- Link Type (Standard, One-time, Password)
- Created Date
- Expiry Date
- Views (23)
- Status (Active, Expired, Used)
- Actions (View Analytics, Copy Link, Deactivate)

**Metrics:**
- Total created: 45
- Active: 12
- Expired: 30
- Total views: 567

---

**Tab 5: Billing**

**Current Subscription:**
- Plan: Professional ($79/mo)
- Billing Cycle: Monthly
- Next Billing: Dec 1, 2025
- Payment Method: Visa •••• 4242
- Actions: Change Plan, Update Payment

**Invoices (Table):**
- Date
- Amount
- Status (Paid, Pending, Failed)
- Invoice PDF (download)

**Payment History:**
- Date, Amount, Method, Status
- Refunds issued

**Actions:**
- Issue refund
- Add promo credit
- Generate invoice

---

**Tab 6: Notes**

**Internal Notes (CRM-style):**
- Author, Date, Note content, Type (General, Support, Sales, Billing, Churn Risk)
- Add new note (textarea, type selector)
- Filter by type

---

### 2. Analytics Dashboard

**Layout: Grid of Cards + Charts**

#### Top Metrics Row (5 Cards)

1. **Total MRR**
   - Value: $24,350
   - Change: ↑ 12% from last month
   - Sparkline (last 30 days)

2. **Active Customers**
   - Value: 312
   - Change: ↑ 8% from last month
   - Breakdown: 120 Starter, 150 Pro, 40 Business, 2 Enterprise

3. **Total Horses**
   - Value: 4,523
   - Avg per org: 14.5

4. **Share Links (30d)**
   - Value: 1,234 created
   - Total views: 8,900

5. **Trial Conversion**
   - Value: 28%
   - Target: 25% (exceeded)

---

#### Charts Section

**1. Revenue Chart (Line Chart)**
- X-axis: Last 12 months
- Y-axis: MRR ($)
- Lines: Total MRR, New MRR (from new customers), Expansion MRR (upgrades), Churn MRR (lost)
- Stacked area variant: MRR by plan tier

**2. Customer Growth (Line Chart)**
- X-axis: Last 12 months
- Lines: Total customers, New signups, Churned, Net growth

**3. Plan Distribution (Pie Chart)**
- Slices: Starter (38%), Professional (48%), Business (13%), Enterprise (1%)
- Show both count and % of total

**4. Engagement Metrics (Bar Chart)**
- X-axis: DAU, WAU, MAU
- Y-axis: User count
- Target lines

**5. Cohort Retention (Heatmap)**
- Rows: Signup cohort (Jan 2025, Feb 2025, etc.)
- Columns: Month 0, Month 1, Month 2, ... Month 6
- Cell color: Retention % (green = high, red = low)

**6. Top Organizations (Table)**
- Rank, Name, Plan, MRR, Horses, Users, Last Active
- Top 10 by MRR

---

#### Filters (Apply to all charts)

- Date range: Last 7 days, 30 days, 90 days, 12 months, All time, Custom
- Plan: All, Starter, Professional, Business, Enterprise
- Status: All, Active, Trial, Churned

---

### 3. User Management

#### All Users View

**Table:**
- Name (First Last)
- Email
- Organization (link to org detail)
- Role (Admin, Read-only, Super Admin)
- Last Login (2 hours ago)
- Status (Active, Suspended)
- Actions (View, Suspend, Delete)

**Search:**
- By name, email

**Filters:**
- Role: All, Admin, Read-only, Super Admin
- Status: All, Active, Suspended
- Last Login: Last 24h, Last 7 days, Last 30 days, 30+ days

---

#### User Detail View

**Profile:**
- Name, Email, Phone
- Organization membership (with role)
- Account created date
- Last login
- Total logins

**Activity:**
- Recent logins (IP, device, timestamp)
- Recent actions (created horse, sent share link)

**Organizations:**
- List of orgs user belongs to (if multiple in future)

**Actions:**
- Send email
- Reset password
- Suspend / unsuspend
- Delete user (with confirmation)

---

### 4. Billing & Revenue

#### Overview

**Top Metrics (Cards):**
- MRR: $24,350
- ARR: $292,200
- Total Revenue (Lifetime): $150,000
- Outstanding Invoices: $523 (3 invoices)
- Churn Rate: 4.2% (monthly)

**Charts:**
- Revenue by month (bar chart)
- Revenue by plan (stacked bar)
- Payment success rate (line chart, %)

---

#### Subscriptions

**Table:**
- Organization
- Plan
- Billing Cycle (Monthly, Annual)
- Status (Active, Trial, Canceled, Overdue)
- Next Billing Date
- MRR
- Actions (View, Change Plan, Cancel, Refund)

**Filters:**
- Plan, Status, Billing Cycle
- Sort by MRR, Next billing date

---

#### Failed Payments

**Table:**
- Organization
- Amount
- Attempt Date
- Reason (Card declined, insufficient funds, etc.)
- Next Retry (in 3 days)
- Actions (Retry now, Contact customer, Cancel subscription)

**Dunning Management:**
- Automated retry schedule (Day 1, 3, 7, 14)
- Email templates sent at each retry
- Manual retry button

---

#### Promo Codes

**List:**
- Code (LAUNCH50)
- Discount (50% off for 3 months)
- Applies To (All plans / Starter only)
- Uses (45 / 100)
- Valid Until (Dec 31, 2025)
- Status (Active, Expired)
- Actions (Edit, Deactivate, View Redemptions)

**Create New Promo:**
- Code (auto-generate or custom)
- Discount type (%, fixed $)
- Applies to (select plans)
- Max uses (unlimited or #)
- Valid date range
- Notes

---

### 5. Support & Communication

#### Support Tickets (Integration with Zendesk/Intercom)

**Table:**
- ID, Subject, Organization, Status, Priority, Created, Last Update
- Actions (View, Respond, Close)

**Filters:**
- Status: Open, In Progress, Waiting on Customer, Closed
- Priority: Low, Medium, High, Urgent
- Assigned to: All, Me, Unassigned

**Metrics:**
- Open tickets: 23
- Avg response time: 3.2 hours
- Avg resolution time: 18 hours
- CSAT score: 4.8/5

---

#### In-App Messages

**Compose Message:**
- To: Select organization(s) or segment
- Subject
- Message (rich text)
- Schedule: Send now or schedule
- Send

**Segment Options:**
- All organizations
- By plan (Starter, Pro, Business, Enterprise)
- By status (Active, Trial, At-risk)
- By usage (High, Medium, Low)
- Custom (select specific orgs)

**Message History:**
- Sent messages with open rate, click rate

---

#### Feature Requests

**Table:**
- Title, Description, Requested By (org), Votes, Status, Priority
- Actions (View, Change Status, Comment)

**Statuses:**
- Submitted
- Under Review
- Planned (on roadmap)
- In Progress
- Shipped
- Declined

**Voting:**
- Users can upvote (count shown)
- Sort by votes (most popular first)

---

### 6. System Health & Monitoring

#### Performance Dashboard

**Real-Time Metrics (Auto-refresh every 10s):**
- Response Time: 245ms (avg, p50, p95, p99)
- Error Rate: 0.02% (5xx errors)
- Request Rate: 150 req/min
- Active WebSocket Connections: 45

**Charts:**
- Response time over last hour (line chart)
- Error rate over last 24h (line chart)
- Requests by endpoint (bar chart, top 10)

---

#### System Status

**Services:**
- Supabase (Database): ✅ Healthy (Response time: 12ms)
- Supabase (Auth): ✅ Healthy
- Vercel (Frontend): ✅ Healthy
- Stripe (Payments): ✅ Healthy
- Email Service: ✅ Healthy

**Uptime:**
- Last 24 hours: 100%
- Last 7 days: 99.98%
- Last 30 days: 99.92%

---

#### Real-Time Activity Feed

**Live stream of events:**
- New signup: "Acme Farms" (Starter plan, trial)
- Share link created: "Thunder" → client@email.com
- Horse created: "Shadow" by "John Smith"
- Login: "Jane Doe" (Acme Farms)
- Payment received: $79 from "Green Acres"

**Filters:**
- Event type: All, Signups, Share Links, Payments, Logins

---

#### Alerts & Notifications

**Active Alerts:**
- ⚠️ High error rate (0.5% in last 5 min) - Investigate
- ⚠️ Payment failure spike (5 failures in last hour)
- ✅ All systems operational

**Configure Alerts:**
- Error rate > 1%
- Response time > 2s
- Failed payments > 10 per hour
- Low disk space
- Unauthorized access attempts

**Notification Channels:**
- Email
- Slack webhook
- SMS (Twilio)

---

#### Logs Viewer

**Application Logs:**
- Timestamp, Level (Info, Warning, Error), Message, Stack Trace
- Search and filter by level, date, user, endpoint
- Export to CSV

**Audit Logs:**
- Admin action logs (who did what, when)
- Searchable by admin, action type, date

---

### 7. Content Management

#### Blog Posts (If building CMS)

**List:**
- Title, Author, Status (Draft, Published), Published Date, Views
- Actions (Edit, Publish, Delete)

**Editor:**
- Title, Slug, Content (Markdown or rich text)
- SEO: Meta title, description, keywords
- Featured image
- Categories, Tags
- Publish date (schedule)
- Save as draft / Publish

---

#### Help Center Articles

**List:**
- Title, Category, Views, Helpful votes, Last updated
- Actions (Edit, Delete)

**Editor:**
- Title, Content (Markdown)
- Category (Getting Started, Features, Billing, etc.)
- Search keywords
- Publish / Unpublish

---

#### Email Templates

**Onboarding Sequence:**
- Welcome email (Day 0)
- Feature spotlight (Day 2)
- Trial reminder (Day 10)
- Trial ending (Day 13)

**Billing:**
- Payment received
- Payment failed
- Subscription canceled

**Marketing:**
- New feature announcement
- Webinar invitation
- Case study

**Editor:**
- Subject line
- Preheader text
- HTML content (with variables: {{org_name}}, {{user_name}})
- Plain text version
- Send test email

---

## API Endpoints

### Admin-Only Endpoints

All admin endpoints require super admin role, verified via RLS.

#### Organizations

```typescript
GET    /api/admin/organizations
       ?plan=professional&status=active&page=1&limit=50
       → List organizations with filters

GET    /api/admin/organizations/:id
       → Organization detail with metrics

PATCH  /api/admin/organizations/:id
       { plan: 'business', suspended: false }
       → Update organization

POST   /api/admin/organizations/:id/impersonate
       → Generate impersonation token

POST   /api/admin/organizations/:id/notes
       { note: "Customer wants feature X", type: "general" }
       → Add internal note
```

#### Analytics

```typescript
GET    /api/admin/analytics/overview
       ?date_range=30d
       → Dashboard metrics (MRR, customers, etc.)

GET    /api/admin/analytics/revenue
       ?start_date=2025-01-01&end_date=2025-12-31
       → Revenue chart data

GET    /api/admin/analytics/cohorts
       → Cohort retention matrix
```

#### Users

```typescript
GET    /api/admin/users
       ?org_id=xxx&role=admin&page=1&limit=50
       → List users

GET    /api/admin/users/:id
       → User detail

PATCH  /api/admin/users/:id
       { suspended: true }
       → Suspend/unsuspend user

POST   /api/admin/users/:id/reset-password
       → Send password reset email
```

#### Billing

```typescript
GET    /api/admin/billing/subscriptions
       ?status=active&plan=professional
       → List subscriptions

GET    /api/admin/billing/failed-payments
       → Failed payments requiring action

POST   /api/admin/billing/retry-payment
       { subscription_id: "sub_xxx" }
       → Retry failed payment

POST   /api/admin/billing/refund
       { charge_id: "ch_xxx", amount: 7900, reason: "..." }
       → Issue refund
```

#### Promo Codes

```typescript
GET    /api/admin/promo-codes
       → List promo codes

POST   /api/admin/promo-codes
       { code: "LAUNCH50", discount_type: "percent", value: 50, ... }
       → Create promo code

GET    /api/admin/promo-codes/:code/redemptions
       → Who used this code
```

---

## Security Model

### Authentication

**Super Admin Role:**
- Separate from regular users
- Stored in `admin.super_admins` table
- 2FA required (TOTP via Google Authenticator)
- Session timeout: 30 minutes of inactivity
- IP whitelist (optional)

**Login Flow:**
1. Email + Password (Supabase Auth)
2. Verify user has super admin role
3. Prompt for 2FA code
4. Generate session token (JWT with admin role)

---

### Authorization

**Row-Level Security (RLS):**
- All admin tables check for super admin role
- Main app tables: Admin has read-only access (via RLS)
- Impersonation: Generate temporary JWT with org user's permissions

**Example RLS Policy:**
```sql
CREATE POLICY "Admins can read all organizations"
ON public.organizations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin.super_admins
    WHERE user_id = auth.uid() AND is_active = true
  )
);
```

---

### Audit Trail

**All admin actions logged:**
- Who (admin user ID)
- What (action: suspend_org, change_plan, impersonate)
- When (timestamp)
- Where (IP address, user agent)
- Context (entity type, entity ID, details JSON)

**Retention:**
- Audit logs kept for 2 years
- Exported monthly to S3 for compliance

---

### Impersonation

**How it works:**
1. Admin clicks "Impersonate" on organization
2. Backend generates temporary JWT with target user's permissions
3. Admin redirected to main app with impersonation token
4. Banner shows "Impersonating: John Smith @ Acme Farms" with Exit button
5. All actions logged with "impersonated_by: admin_user_id"

**Restrictions:**
- Time-limited (1 hour)
- Cannot change password or billing
- Audit log records all actions during impersonation

---

## UI Components

### Reusable Components

All built with shadcn/ui and Tailwind.

#### Metrics Card
```tsx
<MetricCard
  title="Total MRR"
  value="$24,350"
  change="+12%"
  trend="up"
  sparkline={[...data]}
/>
```

#### Data Table with Filters
```tsx
<DataTable
  columns={columns}
  data={organizations}
  filters={[
    { key: 'plan', options: ['starter', 'professional', ...] },
    { key: 'status', options: ['active', 'trial', ...] }
  ]}
  searchPlaceholder="Search organizations..."
  onRowClick={(org) => navigate(`/organizations/${org.id}`)}
/>
```

#### Chart Wrapper
```tsx
<ChartCard title="Revenue Over Time">
  <LineChart data={revenue} xKey="month" yKey="mrr" />
</ChartCard>
```

#### Status Badge
```tsx
<StatusBadge status="active" /> // Green
<StatusBadge status="trial" /> // Blue
<StatusBadge status="suspended" /> // Red
```

---

## Implementation Plan

### Phase 1: MVP (Weeks 1-4)

**Week 1:**
- [ ] Set up separate admin repo and Vercel project
- [ ] Create `admin.hds-horses.com` subdomain
- [ ] Set up super admin authentication with 2FA
- [ ] Create admin schema and tables in Supabase
- [ ] Build base layout (sidebar, top bar, routing)

**Week 2:**
- [ ] Organizations list view with filters
- [ ] Organization detail view (Overview tab)
- [ ] Basic analytics dashboard (MRR, customers, horses)
- [ ] Search and pagination

**Week 3:**
- [ ] User management (list, detail, suspend)
- [ ] Billing overview (revenue, subscriptions)
- [ ] Audit log viewer
- [ ] Add internal notes to organizations

**Week 4:**
- [ ] Impersonate functionality
- [ ] System health monitoring basics
- [ ] Deploy to production
- [ ] Testing and bug fixes

---

### Phase 2: Enhanced Features (Weeks 5-8)

**Week 5:**
- [ ] Advanced analytics (cohorts, retention)
- [ ] Charts and data visualization
- [ ] Export to CSV

**Week 6:**
- [ ] Promo codes management
- [ ] Failed payments dashboard
- [ ] Dunning automation

**Week 7:**
- [ ] Support ticket integration (Zendesk/Intercom)
- [ ] In-app messaging
- [ ] Email templates

**Week 8:**
- [ ] Real-time activity feed
- [ ] Alerts and notifications
- [ ] Performance optimizations

---

### Phase 3: Advanced (Weeks 9-12)

**Week 9:**
- [ ] Feature flags management
- [ ] A/B testing framework
- [ ] Customer health scoring

**Week 10:**
- [ ] Content management (blog, help center)
- [ ] Email campaign builder
- [ ] Marketing automation

**Week 11:**
- [ ] API rate limiting
- [ ] Advanced reporting
- [ ] Custom dashboards

**Week 12:**
- [ ] Mobile optimization
- [ ] Security audit
- [ ] Documentation and training

---

## Technical Decisions

### Why Separate Admin App?

**Pros:**
- Security isolation (separate deployment, different domain)
- Independent scaling and monitoring
- Clear separation of concerns
- Different user experience needs
- Easier to restrict access (IP whitelist, 2FA)

**Cons:**
- Code duplication (components, utilities)
- More complex deployment
- Separate maintenance

**Decision:** Separate app for better security and flexibility.

---

### Why Same Database?

**Pros:**
- Direct access to all data (no API needed)
- Real-time consistency
- Simpler architecture
- Cost-effective

**Cons:**
- Need careful RLS policies
- Schema migrations affect both apps

**Decision:** Same database, separate `admin` schema for admin-only tables.

---

### Why Recharts for Visualization?

**Alternatives:** Chart.js, D3.js, Nivo

**Chosen:** Recharts
- React-first (built for React)
- Declarative API (easy to use)
- Responsive out of the box
- Good documentation
- Wide adoption

---

## Questions & Next Steps

### Questions for Review

1. **Scope**: Is Phase 1 MVP enough to launch? What's missing?
2. **Timeline**: 4 weeks for MVP realistic? Need more/less?
3. **Features**: Any must-have features not covered?
4. **Security**: Additional security requirements?
5. **Analytics**: What metrics are most important to track?
6. **Integrations**: Which third-party tools are essential (Stripe, support, email)?

### Next Steps

1. Review and approve this spec
2. Set up admin project infrastructure
3. Create admin Figma designs
4. Start Phase 1 development
5. Set up staging environment for testing

---

**End of Specification**
