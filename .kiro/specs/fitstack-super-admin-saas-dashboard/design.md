# Design Document: FitStack Super Admin SaaS Dashboard

## Overview

The FitStack Super Admin SaaS Dashboard replaces the existing 4-tab panel with a
production-grade multi-tenant control center. The platform owner (Super_Admin) gains
full visibility into all tenant Businesses, financials, subscriptions, analytics,
security, and global settings — without touching any existing end-user or admin flows.

The design extends the existing MERN stack (MongoDB, Express, React 18, Node.js),
Tailwind CSS dark theme, React Router v6, and JWT auth. Charts use `react-chartjs-2`
with `chart.js` (already in `package.json`). No new charting library is introduced.

### Guiding principles

- **Additive-only backend**: new models and routes are added under `super-admin`
  namespaces; existing models (User, Workout, Nutrition, Progress, Fee, Attendance)
  are never modified.
- **Multi-tenant by identity**: every Business-scoped query is always filtered by the
  Business's admin `_id`. The `role: admin` User record _is_ the Business entity;
  a separate `Business` model carries extended SaaS metadata.
- **Audit-first writes**: every Super_Admin mutation writes an AuditLog entry before
  committing the change.
- **Role guard at route level**: all `/api/super-admin/*` routes are protected by
  the existing `protect + superAdminOnly` middleware chain.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      React Frontend (Vite)                       │
│                                                                   │
│  /super-admin/*  ← SuperAdminRoute guard (role: super_admin)     │
│  SuperAdminLayout (collapsible sidebar + outlet)                  │
│                                                                   │
│  Pages: Overview │ Businesses │ Plans │ Requests │ Payments       │
│         Users │ Analytics │ Notifications │ Settings │ Security   │
│                                                                   │
│  Services: superAdminAPI (axios, Bearer JWT)                      │
│  State:    React hooks + Context (no Redux)                       │
│  Charts:   react-chartjs-2 / chart.js (already installed)        │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS REST  /api/super-admin/*
┌────────────────────────▼────────────────────────────────────────┐
│                   Express API (Node.js)                           │
│                                                                   │
│  middleware: protect → superAdminOnly → auditLog (write ops)     │
│  router:     /api/super-admin/*                                   │
│  controllers: superAdminController (extended)                     │
│               businessController, planController,                 │
│               paymentController, auditController,                 │
│               settingsController, sessionController               │
└────────────────────────┬────────────────────────────────────────┘
                         │ Mongoose
┌────────────────────────▼────────────────────────────────────────┐
│                     MongoDB Atlas                                  │
│                                                                   │
│  Existing: User, Workout, Nutrition, Progress, Fee, Attendance   │
│  New:      Business, SubscriptionPlan, SubscriptionRequest,      │
│            Payment, AuditLog, GlobalSettings, SuperAdminSession  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components and Interfaces

### Frontend route tree (React Router v6)

```
/super-admin                        ← SuperAdminLayout (outlet)
  index                             ← SAOverviewPage
  businesses                        ← SABusinessListPage
  businesses/:id                    ← SABusinessDetailPage
  plans                             ← SAPlansPage
  subscription-requests             ← SASubscriptionRequestsPage
  payments                          ← SAPaymentsPage
  users                             ← SAUserMonitorPage
  analytics                         ← SAAnalyticsPage
  notifications                     ← SANotificationsPage
  settings                          ← SASettingsPage (tabbed)
  security                          ← SASecurityPage
  audit-logs                        ← SAAuditLogsPage
```

### SuperAdminLayout (enhanced from existing)

The existing `SuperAdminLayout.jsx` is extended — not replaced:
- Sidebar gains all new nav items (collapsible on desktop, drawer on mobile — existing behaviour preserved)
- A `NotificationBell` component is added to the top bar
- A `GlobalSearchModal` (Ctrl+K / Cmd+K) is added via a portal

### Component hierarchy (new files only)

```
pages/SuperAdmin/
  SA_Overview/
    SAOverviewPage.jsx          ← assembles KPI grid + chart grid
    KPIGrid.jsx                 ← renders KPICard[] from stats data
    KPICard.jsx                 ← single metric card w/ trend badge + skeleton
    ChartGrid.jsx               ← renders all overview charts
    charts/
      BusinessGrowthChart.jsx
      UserGrowthChart.jsx
      RevenueChart.jsx
      PlanDistributionChart.jsx  ← Doughnut
      ActiveVsInactiveChart.jsx  ← Bar
      LoginStatsChart.jsx
      CountryDistributionChart.jsx
      DeviceUsageChart.jsx
      FeatureUsageChart.jsx
  SA_Businesses/
    SABusinessListPage.jsx
    BusinessTable.jsx           ← paginated table w/ sort/filter/search
    BusinessRowActions.jsx      ← View/Edit/Suspend/Delete dropdown
    BusinessEditModal.jsx
    BusinessChangePlanModal.jsx
    BusinessExtendModal.jsx
  SA_BusinessDetail/
    SABusinessDetailPage.jsx
    BusinessProfileCard.jsx
    BusinessSubscriptionCard.jsx
    BusinessPaymentHistoryTable.jsx
    BusinessTrainersTable.jsx
    BusinessUsersTable.jsx
    BusinessStatsCard.jsx
    BusinessAuditTable.jsx
  SA_Plans/
    SAPlansPage.jsx
    PlanCard.jsx
    PlanFormModal.jsx
  SA_SubscriptionRequests/
    SASubscriptionRequestsPage.jsx
    RequestQueueTable.jsx
    RequestActionModal.jsx
  SA_Payments/
    SAPaymentsPage.jsx
    PaymentsKPIRow.jsx
    PaymentsTable.jsx
  SA_Users/
    SAUserMonitorPage.jsx
    UserMonitorTable.jsx
    UserMonitorDetailDrawer.jsx  ← read-only
  SA_Analytics/
    SAAnalyticsPage.jsx
    AnalyticsMetricsGrid.jsx
    MRRARRCard.jsx
    ChurnCard.jsx
    GeoDistributionChart.jsx
  SA_Notifications/
    SANotificationsPage.jsx
    NotificationBell.jsx         ← rendered in layout top bar
    NotificationPanel.jsx
  SA_Settings/
    SASettingsPage.jsx           ← tabbed layout
    tabs/
      BrandingTab.jsx
      SmtpTab.jsx
      PaymentGatewaysTab.jsx
      SecurityPoliciesTab.jsx
      ApiKeysTab.jsx
      MaintenanceTab.jsx
      LanguagesCurrenciesTab.jsx
  SA_Security/
    SASecurityPage.jsx
    SessionsTable.jsx
    AuditLogTable.jsx
  shared/
    ConfirmDialog.jsx            ← reusable destructive-action modal
    DateRangeFilter.jsx
    ExportButton.jsx
    SkeletonTable.jsx
    SkeletonKPI.jsx
    StatusBadge.jsx
    GlobalSearchModal.jsx
```

### Backend API Endpoints

All routes prefixed `/api/super-admin/` and protected by `protect + superAdminOnly`.

| Method | Path | Controller function | Description |
|--------|------|---------------------|-------------|
| GET | `/dashboard/stats` | `getDashboardStats` | All KPIs + all chart series |
| GET | `/businesses` | `listBusinesses` | Paginated, filtered, sorted |
| GET | `/businesses/:id` | `getBusinessDetail` | Full tenant detail |
| PUT | `/businesses/:id` | `updateBusiness` | Edit profile fields |
| PUT | `/businesses/:id/suspend` | `suspendBusiness` | Set status=suspended |
| PUT | `/businesses/:id/activate` | `activateBusiness` | Set status=active |
| DELETE | `/businesses/:id` | `softDeleteBusiness` | deletedAt timestamp |
| PUT | `/businesses/:id/change-plan` | `changeBusinessPlan` | Switch subscription plan |
| PUT | `/businesses/:id/extend` | `extendSubscription` | Add N days to endDate |
| POST | `/businesses/:id/reset-password` | `resetAdminPassword` | Sends reset email |
| GET | `/plans` | `listPlans` | All subscription plans |
| POST | `/plans` | `createPlan` | Create new plan |
| PUT | `/plans/:id` | `updatePlan` | Edit plan fields |
| PUT | `/plans/:id/toggle` | `togglePlanStatus` | Enable/disable |
| DELETE | `/plans/:id` | `deletePlan` | Delete if no active subs |
| GET | `/subscription-requests` | `listRequests` | Paginated queue |
| PUT | `/subscription-requests/:id/approve` | `approveRequest` | Activate plan + payment |
| PUT | `/subscription-requests/:id/reject` | `rejectRequest` | Reject with reason |
| PUT | `/subscription-requests/:id/info` | `requestMoreInfo` | Set info-requested |
| GET | `/payments` | `listPayments` | Paginated + filtered |
| PUT | `/payments/:id/refund` | `refundPayment` | Mark refunded |
| GET | `/payments/export` | `exportPayments` | CSV/PDF download |
| GET | `/users` | `listUsers` | Platform-wide, read-only |
| GET | `/audit-logs` | `listAuditLogs` | Paginated audit trail |
| GET | `/settings` | `getSettings` | All settings categories |
| PATCH | `/settings` | `updateSettings` | Partial update by category |
| POST | `/settings/smtp/test` | `testSmtp` | Test SMTP connection |
| POST | `/settings/api-keys` | `createApiKey` | Generate key (shown once) |
| DELETE | `/settings/api-keys/:id` | `revokeApiKey` | Invalidate key |
| GET | `/sessions` | `listSessions` | Active super_admin sessions |
| DELETE | `/sessions/:id` | `forceLogoutSession` | Invalidate JWT |
| GET | `/notifications` | (reuse existing) | Super_admin's notifications |

---

## Data Models

### How User maps to Business tenants

The existing `User` model is not modified. A `User` record with `role: admin` IS a
Business_Admin. The new `Business` model carries a 1-to-1 reference to that User via
`adminUser` field. Every Trainer and End_User belonging to that Business stores a
`business` ObjectId. This preserves full backward compatibility.

```
User (role:admin)  ←──adminUser──  Business  ←──business──  User (role:trainer/user)
```

Existing Fee, Attendance, Workout, Nutrition, Progress records reference `user`
(the individual User _id). Multi-tenant queries resolve the set of user IDs for a
given Business first, then filter the existing collections by those IDs.

### New Mongoose Models

#### Business

```js
// backend/models/Business.js
{
  adminUser:      ObjectId → User (role:admin),  // 1-to-1
  name:           String,
  logoUrl:        String,
  country:        String,
  city:           String,
  phone:          String,
  website:        String,
  status:         String, // 'active' | 'suspended' | 'trial' | 'expired' | 'deleted'
  currentPlan:    ObjectId → SubscriptionPlan,
  subscriptionStart: Date,
  subscriptionEnd:   Date,
  isTrial:        Boolean, default false,
  trialEndDate:   Date,
  storageUsedMB:  Number, default 0,
  deletedAt:      Date,   // soft-delete
  metadata: {
    registrationIp: String,
    lastLoginAt:    Date,
    deviceType:     String,
    country:        String,
  },
  timestamps: true
}
indexes: adminUser (unique), status, currentPlan
```

#### SubscriptionPlan

```js
// backend/models/SubscriptionPlan.js
{
  name:           String, required,
  type:           String, enum['Monthly','Yearly','Lifetime','Trial','Enterprise'],
  price:          Number,
  currency:       String, default 'USD',
  billingInterval: String, enum['monthly','yearly','once'],
  maxUsers:       Number,
  maxTrainers:    Number,
  storageLimitGB: Number,
  features: {
    aiEnabled:         Boolean,
    analyticsEnabled:  Boolean,
    whiteLabelEnabled: Boolean,
    customDomain:      Boolean,
    apiAccess:         Boolean,
    emailNotifLimit:   Number,
    pushNotifLimit:    Number,
  },
  isEnabled: Boolean, default true,
  timestamps: true
}
```

#### SubscriptionRequest

```js
// backend/models/SubscriptionRequest.js
{
  business:       ObjectId → Business, required,
  requestedPlan:  ObjectId → SubscriptionPlan, required,
  currentPlan:    ObjectId → SubscriptionPlan,
  status:         String, enum['pending','approved','rejected','info-requested'],
  requestedAt:    Date, default Date.now,
  processedAt:    Date,
  processedBy:    ObjectId → User,
  rejectionReason: String,
  infoMessage:    String,
  timestamps: true
}
indexes: business, status
```

#### Payment

```js
// backend/models/Payment.js
{
  business:       ObjectId → Business, required,
  plan:           ObjectId → SubscriptionPlan,
  amount:         Number, required,
  currency:       String, default 'USD',
  status:         String, enum['pending','completed','failed','refunded'],
  paymentMethod:  String, enum['stripe','paypal','manual'],
  transactionId:  String,
  invoiceUrl:     String,
  refundedAt:     Date,
  refundReason:   String,
  metadata:       Mixed,
  timestamps: true
}
indexes: business, status, createdAt
```

#### AuditLog

```js
// backend/models/AuditLog.js
{
  actor:          ObjectId → User, required,  // super_admin user
  actionType:     String, required,
    // e.g. 'SUSPEND_BUSINESS', 'CHANGE_PLAN', 'DELETE_BUSINESS',
    //      'APPROVE_REQUEST', 'REVOKE_KEY', 'UPDATE_SETTINGS'
  targetEntity:   String, required,  // 'Business' | 'User' | 'Plan' | 'Setting' | 'Payment'
  targetId:       ObjectId,
  targetName:     String,
  description:    String,
  ipAddress:      String,
  outcome:        String, enum['success','failure'],
  metadata:       Mixed,
  timestamps: true
}
// Immutable: no update/delete operations allowed on this collection
indexes: actor, actionType, targetEntity, createdAt
```

#### GlobalSettings

```js
// backend/models/GlobalSettings.js
// Single document (upserted by key), singleton pattern
{
  key: String, unique, required,
    // 'branding' | 'smtp' | 'fcm' | 'stripe' | 'paypal' | 'google_oauth'
    // 'languages' | 'currencies' | 'timezone' | 'maintenance' | 'security'
    // 'api_keys' | 'email_templates' | 'backup'
  value: Mixed,
  updatedBy: ObjectId → User,
  timestamps: true
}
// Sensitive fields (smtp password, stripe secret) stored encrypted via crypto.
// GET responses omit these fields (never returned to client).
```

#### SuperAdminSession

```js
// backend/models/SuperAdminSession.js
{
  user:       ObjectId → User, required,
  jti:        String, required, unique,  // JWT ID claim
  device:     String,
  browser:    String,
  ipAddress:  String,
  lastSeenAt: Date,
  isActive:   Boolean, default true,
  expiresAt:  Date,
  timestamps: true
}
indexes: user, jti, isActive
```

---

## Multi-Tenant Data Isolation Strategy

### How tenant scope is enforced

1. **Business resolution**: every Business-scoped endpoint resolves the Business doc
   first: `const biz = await Business.findById(req.params.id)`.

2. **User set derivation**: the set of User IDs belonging to a Business is the
   Business_Admin _id plus all Users/Trainers whose `business` field equals the
   Business `_id`.

   ```js
   // backend/utils/getTenantUserIds.js
   async function getTenantUserIds(businessId) {
     const biz = await Business.findById(businessId).select('adminUser');
     const members = await User.find({ business: businessId }).select('_id');
     return [biz.adminUser, ...members.map(u => u._id)];
   }
   ```

3. **Scoped queries on existing collections**: Fee, Attendance, Workout, etc. are
   always queried with `{ user: { $in: tenantUserIds } }`. If `getTenantUserIds`
   returns an empty array (business not found), the query returns zero results —
   never cross-tenant data.

4. **Business_Admin isolation**: the existing `adminOnly` middleware is used on
   `/api/admin/*` routes. It does NOT include super_admin data. A Business_Admin
   calling a super_admin endpoint receives 403 from `superAdminOnly`.

5. **Audit before commit**: a `withAudit(action, fn)` helper wraps every Super_Admin
   mutation. It writes the AuditLog entry first, then awaits `fn()`. If `fn` throws,
   the AuditLog entry is marked `outcome: 'failure'`.

   ```js
   // backend/utils/withAudit.js
   async function withAudit(req, action, targetEntity, targetId, fn) {
     const log = await AuditLog.create({
       actor: req.user._id, actionType: action,
       targetEntity, targetId, ipAddress: req.ip,
       outcome: 'failure', // updated to 'success' after fn resolves
     });
     const result = await fn();
     log.outcome = 'success';
     await log.save();
     return result;
   }
   ```

### New `business` field on User

When a new Trainer or End_User is created under an Admin's gym, the admin's
`createUser` / `createTrainer` flows (existing `adminController`) should populate
`business: adminUser._id` (the admin's Business _id). This is a **one-line additive
change** to existing controller functions — no schema modification to User model.

Actually, to keep the User model truly unchanged, a `business` field is added to the
`Business` model's member list instead of on the User. The `getTenantUserIds` helper
resolves membership via a `BusinessMember` embedded array on the Business doc or a
separate lookup by querying `User.find({ assignedAdmin: businessAdminId })`. Since
the existing system already stores `assignedTrainer` on users and `assignedUsers` on
trainers, the tenant can be derived from the admin relationship:

```js
// Resolve all users who belong to an admin's business
const adminUser = await User.findById(biz.adminUser);
// Trainers: users created/managed under this admin
// Users: the admin's Users (no direct link in existing schema — use Fee.recordedBy)
```

**Design decision**: Because the existing User model has no `business` field and we
cannot modify existing models, the `Business` doc will maintain an `members` array
of User ObjectIds (populated when the admin creates users). Alternatively, the
Business-scoped queries use `Fee.recordedBy == adminUserId` to infer membership for
Fee data. For a clean solution, a lightweight `businessId` field is added to User as
a **new optional field** (default: null) — this is a strictly additive change that
does not break any existing index or query.

```js
// Additive field added to User schema (does not break existing code):
businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', default: null }
```

This field is populated whenever an admin creates a trainer or user. Existing users
(created before this feature) have `businessId: null` and are treated as platform-
level users not belonging to any specific tenant — which is correct for the
pre-multi-tenant legacy data.

---

## Folder Structure for New Files

```
backend/
  models/
    Business.js               ← new
    SubscriptionPlan.js       ← new
    SubscriptionRequest.js    ← new
    Payment.js                ← new
    AuditLog.js               ← new
    GlobalSettings.js         ← new
    SuperAdminSession.js      ← new
  controllers/
    superAdminController.js   ← extended (dashboard stats)
    businessController.js     ← new
    planController.js         ← new
    subscriptionRequestController.js ← new
    superAdminPaymentController.js   ← new
    auditController.js        ← new
    settingsController.js     ← new
    sessionController.js      ← new
  routes/
    superAdmin.js             ← extended with all new sub-routers
  middleware/
    auditMiddleware.js        ← new: auto-log write operations
  utils/
    getTenantUserIds.js       ← new
    withAudit.js              ← new
    encryptSettings.js        ← new (AES-256 for sensitive config values)

frontend/src/
  pages/SuperAdmin/
    SA_Overview/              ← new
    SA_Businesses/            ← new
    SA_BusinessDetail/        ← new
    SA_Plans/                 ← new
    SA_SubscriptionRequests/  ← new
    SA_Payments/              ← new
    SA_Users/                 ← new
    SA_Analytics/             ← new
    SA_Notifications/         ← new
    SA_Settings/              ← new
    SA_Security/              ← new
    shared/                   ← new shared SA components
    SuperAdminLayout.jsx      ← extended (new nav items, NotificationBell)
  services/
    api.js                    ← extended: superAdminAPI gains new methods
  context/
    SuperAdminContext.jsx     ← new: global search state, notification count
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid
executions of a system — essentially, a formal statement about what the system should
do. Properties serve as the bridge between human-readable specifications and
machine-verifiable correctness guarantees.*

### Property 1: Dashboard stats response completeness

*For any* valid super_admin JWT, a `GET /api/super-admin/dashboard/stats` call must
return a response body that contains every required KPI field (totalBusinesses,
activeBusinesses, suspendedBusinesses, trialBusinesses, expiredBusinesses,
totalAdmins, totalTrainers, totalUsers, activeUsersToday, newUsersThisMonth,
totalRevenue, monthlyRevenue, pendingRequests) as numeric values, and every required
chart series (businessGrowth, userGrowth, revenueOverTime, planDistribution,
activeVsInactive) as non-null arrays.

**Validates: Requirements 1.1, 2.1, 15.1**

---

### Property 2: KPI trend direction is consistent

*For any* two numeric values `current` and `previous`, the `computeTrend(current,
previous)` utility must return `{ direction: 'up', color: 'green' }` when
`current > previous`, `{ direction: 'down', color: 'red' }` when
`current < previous`, and `{ direction: 'neutral' }` when they are equal.

**Validates: Requirements 1.3**

---

### Property 3: Date-range filter excludes out-of-range data points

*For any* chart series returned by `GET /api/super-admin/dashboard/stats?from=F&to=T`,
every data point in every returned series must have a `date` value satisfying
`F <= date <= T`. No data point outside the requested window may appear.

**Validates: Requirements 2.2**

---

### Property 4: Business list search matches at least one indexed field

*For any* non-empty search string `q`, every Business object returned by
`GET /api/super-admin/businesses?search=q` must satisfy at least one of:
`name` contains `q` (case-insensitive), `ownerEmail` contains `q`, or
`_id.toString()` contains `q`.

**Validates: Requirements 3.2**

---

### Property 5: Multi-filter conjunction invariant

*For any* combination of active filters `{ status, plan, country, paymentStatus }`,
every Business returned in the result set must simultaneously satisfy all non-null
filter conditions. No result may violate any active filter criterion.

**Validates: Requirements 3.3**

---

### Property 6: Pagination size upper bound

*For any* page query with `limit = L` (where L ∈ {10, 25, 50}), the `items` array
in the response must have length ≤ L. The `total` field must accurately reflect the
count of all matching documents regardless of pagination.

**Validates: Requirements 3.5**

---

### Property 7: Business detail scoping

*For any* valid business `id`, the response from
`GET /api/super-admin/businesses/:id` must contain only sub-entities (trainers,
users, payments, fees) whose `businessId` (or derivable tenant membership) equals
that `id`. No cross-tenant entity may appear in the response.

**Validates: Requirements 4.1, 14.2**

---

### Property 8: Subscription plan round-trip

*For any* valid plan creation payload `P`, after `POST /api/super-admin/plans` with
body `P` succeeds, a subsequent `GET /api/super-admin/plans/:newId` must return an
object that contains every submitted field with the same value as submitted, with no
submitted field dropped or silently mutated.

**Validates: Requirements 5.2**

---

### Property 9: Notification badge display rule

*For any* integer `unreadCount >= 0`, the `NotificationBell` component must display
the string `"99+"` when `unreadCount >= 100`, and the exact string representation of
`unreadCount` when `unreadCount < 100`.

**Validates: Requirements 10.5**

---

### Property 10: Super_Admin RBAC enforcement

*For any* HTTP request to any `/api/super-admin/*` endpoint accompanied by a valid
JWT whose decoded `role` is NOT `super_admin`, the API must respond with HTTP 403.
No endpoint under this prefix may return 200 for a non-super_admin token.

**Validates: Requirements 12.1, 14.3**

---

### Property 11: Multi-tenant isolation — no cross-tenant data

*For any* Business-scoped data endpoint called with a specific `businessId = X`,
every entity in the response array must have a derivable tenant membership equal to
X. If no membership can be established, the endpoint must return an empty array
rather than returning entities from other tenants.

**Validates: Requirements 14.1, 14.2**

---

## Error Handling

### Backend

| Scenario | HTTP Status | Response shape |
|----------|-------------|----------------|
| Non-super_admin accesses `/api/super-admin/*` | 403 | `{ success:false, message:'Super Admin access required.' }` |
| Business not found | 404 | `{ success:false, message:'Business not found' }` |
| Delete plan with active subscriptions | 409 | `{ success:false, message:'X businesses have active subscriptions on this plan' }` |
| SMTP test times out (>10s) | 408 | `{ success:false, message:'SMTP connection timed out' }` |
| Invalid date range filter | 400 | `{ success:false, message:'Invalid date range: from must be before to' }` |
| Soft-deleted Business accessed | 410 | `{ success:false, message:'Business has been deleted' }` |
| Cross-tenant access by Business_Admin | 403 | `{ success:false, message:'Forbidden' }` |
| AuditLog write failure | 500 | Mutation is aborted; error propagated to client |

All errors are handled by the existing `errorHandler` middleware.
New controllers follow the existing `try/catch → next(err)` pattern.

### Frontend

- Every API call is wrapped in `try/catch` with `toast.error(err.response?.data?.message)`.
- KPI cards individually catch their data slice; one card failure does not crash the grid.
- Destructive actions (Suspend, Delete, Force Logout, Revoke Key) display `ConfirmDialog`
  before firing the API call.
- A deleted-business guard: if a notification links to a business whose detail page
  returns 410, a "Business no longer exists" inline message is shown instead of
  navigating.
- The maintenance mode flag (from GlobalSettings) is read on every page load; if set,
  all non-`/super-admin/*` routes render a `MaintenanceBanner` overlay.

---

## Testing Strategy

### Unit tests (example-based)

Focus on:
- `computeTrend(current, previous)` utility with concrete inputs
- `KPICard` renders skeleton in loading state (mock hook)
- `NotificationBell` renders "99+" for count = 100 and exact string for count = 5
- `ConfirmDialog` fires `onConfirm` only after user types confirmation string
- `BusinessRowActions` dropdown renders correct items for active vs suspended status
- API rejection when plan has active subscriptions (mock Mongoose query)

### Property-based tests (`fast-check`)

The project currently has no PBT setup. `fast-check` is the recommended library for
JavaScript — it integrates with Vitest (which is a natural add for this Vite project)
and does not require a full Jest setup.

Install: `npm install --save-dev fast-check vitest @vitest/coverage-v8`

Each property test runs a **minimum of 100 iterations** (fast-check default: 100).

Tag format: `// Feature: fitstack-super-admin-saas-dashboard, Property N: <text>`

```
Property 1 → tests/superAdmin/dashboardStats.property.test.js
Property 2 → tests/superAdmin/kpiTrend.property.test.js
Property 3 → tests/superAdmin/dateRangeFilter.property.test.js
Property 4 → tests/superAdmin/businessSearch.property.test.js
Property 5 → tests/superAdmin/multiFilter.property.test.js
Property 6 → tests/superAdmin/pagination.property.test.js
Property 7 → tests/superAdmin/businessScoping.property.test.js
Property 8 → tests/superAdmin/planRoundTrip.property.test.js
Property 9 → tests/superAdmin/notificationBadge.property.test.js
Property 10 → tests/superAdmin/rbac.property.test.js
Property 11 → tests/superAdmin/tenantIsolation.property.test.js
```

Properties 2, 9 test pure utility functions and are cost-free (no DB).
Properties 3–8, 10–11 use an in-memory MongoDB instance (`mongodb-memory-server`)
to avoid real database calls while enabling true Mongoose queries.

### Integration tests

- `GET /api/super-admin/dashboard/stats` with a seeded DB returns the correct counts.
- `PUT /api/super-admin/businesses/:id/suspend` creates an AuditLog entry and sends
  a notification to the Business_Admin.
- `POST /api/super-admin/subscription-requests/:id/approve` creates a Payment record.
- `POST /api/super-admin/settings/smtp/test` returns success/failure within 10s.
- Existing routes (`/api/workouts`, `/api/nutrition`, etc.) remain functional after
  adding new models (backward compatibility smoke test).

### Manual / visual checks (non-automatable)

- Dark/light mode toggle persists to `localStorage`
- Animated KPI counter counts up from zero on first load
- Sidebar collapses to icon-only on desktop, slides as drawer on mobile
- Chart skeleton loaders match chart layout dimensions
- WCAG 2.1 AA contrast (requires manual audit with browser DevTools or axe extension)
