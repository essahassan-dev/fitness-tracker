# Implementation Plan: FitStack Super Admin SaaS Dashboard

## Overview

Extend the existing MERN-stack FitStack application with a production-grade Super Admin SaaS Dashboard. The implementation is strictly additive: new backend models, controllers, and routes are added under the `/api/super-admin/` namespace; existing models (User, Workout, Nutrition, Progress, Fee, Attendance) are never modified except for the one additive `businessId` field on User. The frontend is extended under `/super-admin/*` using the existing React 18, React Router v6, Tailwind CSS, react-chartjs-2, and axios stack.

---

## Tasks

- [ ] 1. Backend foundation — new Mongoose models and utilities
  - [x] 1.1 Create `backend/models/Business.js`
    - Implement the Business schema as defined in the design (adminUser ref, name, logoUrl, country, city, phone, website, status enum, currentPlan ref, subscriptionStart/End, isTrial, trialEndDate, storageUsedMB, deletedAt, metadata sub-doc, timestamps)
    - Add indexes: `adminUser` (unique), `status`, `currentPlan`
    - _Requirements: 15.8_
  - [x] 1.2 Create `backend/models/SubscriptionPlan.js`
    - Implement SubscriptionPlan schema (name, type enum, price, currency, billingInterval, maxUsers, maxTrainers, storageLimitGB, features sub-doc, isEnabled, timestamps)
    - _Requirements: 5.1, 5.2, 15.3, 15.8_
  - [x] 1.3 Create `backend/models/SubscriptionRequest.js`
    - Implement SubscriptionRequest schema (business, requestedPlan, currentPlan, status enum, requestedAt, processedAt, processedBy, rejectionReason, infoMessage, timestamps)
    - Add indexes: `business`, `status`
    - _Requirements: 6.1, 15.4, 15.8_
  - [x] 1.4 Create `backend/models/Payment.js`
    - Implement Payment schema (business, plan, amount, currency, status enum, paymentMethod, transactionId, invoiceUrl, refundedAt, refundReason, metadata, timestamps)
    - Add indexes: `business`, `status`, `createdAt`
    - _Requirements: 7.2, 15.5, 15.8_
  - [x] 1.5 Create `backend/models/AuditLog.js`
    - Implement AuditLog schema (actor, actionType, targetEntity, targetId, targetName, description, ipAddress, outcome enum, metadata, timestamps)
    - Mark collection as immutable (no update/delete operations)
    - Add indexes: `actor`, `actionType`, `targetEntity`, `createdAt`
    - _Requirements: 12.3, 15.6, 15.8_
  - [x] 1.6 Create `backend/models/GlobalSettings.js`
    - Implement GlobalSettings singleton schema (key unique, value Mixed, updatedBy ref, timestamps)
    - _Requirements: 11.1, 15.7, 15.8_
  - [x] 1.7 Create `backend/models/SuperAdminSession.js`
    - Implement SuperAdminSession schema (user ref, jti unique, device, browser, ipAddress, lastSeenAt, isActive, expiresAt, timestamps)
    - Add indexes: `user`, `jti`, `isActive`
    - _Requirements: 12.5, 15.8_
  - [x] 1.8 Add additive `businessId` field to `backend/models/User.js`
    - Append `businessId: { type: ObjectId, ref: 'Business', default: null }` to the existing userSchema — no other changes to the schema
    - Verify all existing User queries still work (no breaking changes)
    - _Requirements: 14.1, 15.9_
  - [ ] 1.9 Create `backend/utils/getTenantUserIds.js`
    - Implement `getTenantUserIds(businessId)` that resolves the Business admin _id plus all Users/Trainers with matching `businessId`
    - Return empty array (not an error) when businessId is not found
    - _Requirements: 14.1, 14.2_
  - [ ]* 1.10 Write unit tests for `getTenantUserIds` utility
    - Test: valid businessId returns correct member set
    - Test: unknown businessId returns empty array (no cross-tenant data)
    - _Requirements: 14.1_
  - [x] 1.11 Create `backend/utils/withAudit.js`
    - Implement `withAudit(req, actionType, targetEntity, targetId, fn)` helper
    - Write AuditLog entry with `outcome: 'failure'` before executing `fn`, then update to `'success'` after resolution
    - If `fn` throws, leave the log entry as `failure` and rethrow
    - _Requirements: 14.4, 14.5_
  - [x] 1.12 Create `backend/utils/encryptSettings.js`
    - Implement AES-256 encrypt/decrypt functions for storing sensitive GlobalSettings values (SMTP password, Stripe secret)
    - Ensure decrypted values are never returned in GET responses
    - _Requirements: 11.5_

- [ ] 2. Backend — Dashboard stats and Business management controllers
  - [x] 2.1 Extend `backend/controllers/superAdminController.js` with `getDashboardStats`
    - Query all required KPI counts (totalBusinesses, activeBusinesses, suspendedBusinesses, trialBusinesses, expiredBusinesses, totalAdmins, totalTrainers, totalUsers, activeUsersToday, newUsersThisMonth, totalRevenue, monthlyRevenue, pendingRequests)
    - Build chart data series: businessGrowth, userGrowth, revenueOverTime, planDistribution, activeVsInactive
    - Accept optional `from` / `to` query params and filter chart data to that range; validate that from ≤ to (return 400 otherwise)
    - _Requirements: 1.1, 2.1, 2.2, 15.1_
  - [ ]* 2.2 Write property test for dashboard stats response completeness (Property 1)
    - **Property 1: Dashboard stats response completeness**
    - **Validates: Requirements 1.1, 2.1, 15.1**
    - File: `backend/tests/superAdmin/dashboardStats.property.test.js`
    - Setup `fast-check` + `vitest` + `mongodb-memory-server` in `backend`
  - [ ]* 2.3 Write property test for date-range filter (Property 3)
    - **Property 3: Date-range filter excludes out-of-range data points**
    - **Validates: Requirements 2.2**
    - File: `backend/tests/superAdmin/dateRangeFilter.property.test.js`
  - [x] 2.4 Create `backend/controllers/businessController.js`
    - Implement: `listBusinesses` (paginated, filter by status/plan/country/paymentStatus, search by name/email/id with ≤400ms debounce-friendly regex, sort by any column)
    - Implement: `getBusinessDetail` (with tenant-scoped sub-entities)
    - Implement: `updateBusiness`, `suspendBusiness` (notify Business_Admin), `activateBusiness`, `softDeleteBusiness`, `changeBusinessPlan`, `extendSubscription`, `resetAdminPassword`
    - Wrap all write operations in `withAudit`
    - Return 410 for soft-deleted Business on detail endpoint
    - _Requirements: 3.1–3.15, 4.1–4.5, 15.2_
  - [ ]* 2.5 Write property test for Business list search (Property 4)
    - **Property 4: Business list search matches at least one indexed field**
    - **Validates: Requirements 3.2**
    - File: `backend/tests/superAdmin/businessSearch.property.test.js`
  - [ ]* 2.6 Write property test for multi-filter conjunction (Property 5)
    - **Property 5: Multi-filter conjunction invariant**
    - **Validates: Requirements 3.3**
    - File: `backend/tests/superAdmin/multiFilter.property.test.js`
  - [ ]* 2.7 Write property test for pagination size upper bound (Property 6)
    - **Property 6: Pagination size upper bound**
    - **Validates: Requirements 3.5**
    - File: `backend/tests/superAdmin/pagination.property.test.js`
  - [ ]* 2.8 Write property test for Business detail scoping (Property 7)
    - **Property 7: Business detail scoping**
    - **Validates: Requirements 4.1, 14.2**
    - File: `backend/tests/superAdmin/businessScoping.property.test.js`

- [ ] 3. Backend — Plans, Subscription Requests, Payments, and Audit controllers
  - [x] 3.1 Create `backend/controllers/planController.js`
    - Implement: `listPlans`, `createPlan`, `updatePlan`, `togglePlanStatus`, `deletePlan`
    - `deletePlan` must reject with 409 if any Business has an active subscription on that plan, returning the count of affected Businesses
    - Wrap create/update/delete/toggle in `withAudit`
    - _Requirements: 5.1–5.6, 15.3_
  - [ ]* 3.2 Write property test for subscription plan round-trip (Property 8)
    - **Property 8: Subscription plan round-trip**
    - **Validates: Requirements 5.2**
    - File: `backend/tests/superAdmin/planRoundTrip.property.test.js`
  - [x] 3.3 Create `backend/controllers/subscriptionRequestController.js`
    - Implement: `listRequests`, `approveRequest` (activate plan + create Payment + notify Business_Admin), `rejectRequest` (notify with reason), `requestMoreInfo` (notify with message)
    - Wrap approve/reject/info in `withAudit`
    - _Requirements: 6.1–6.5, 15.4_
  - [x] 3.4 Create `backend/controllers/superAdminPaymentController.js`
    - Implement: `listPayments` (paginated, filter by date range/status/business), `refundPayment` (mark refunded + withAudit), `exportPayments` (CSV/PDF file response)
    - _Requirements: 7.1–7.6, 15.5_
  - [x] 3.5 Create `backend/controllers/auditController.js`
    - Implement: `listAuditLogs` (paginated, filter by actionType, targetEntity, date range, outcome)
    - _Requirements: 12.3, 15.6_
  - [ ]* 3.6 Write integration test for suspend → AuditLog + notification flow
    - Verify `PUT /api/super-admin/businesses/:id/suspend` creates AuditLog and sends notification to Business_Admin
    - _Requirements: 3.8, 14.4_

- [ ] 4. Backend — Settings, Sessions, RBAC, and route wiring
  - [x] 4.1 Create `backend/controllers/settingsController.js`
    - Implement: `getSettings` (omit encrypted fields from response), `updateSettings` (encrypt sensitive values via `encryptSettings`), `testSmtp` (attempt connection within 10s timeout, return 408 on timeout), `createApiKey` (generate unique key, store only its hash, return plaintext once), `revokeApiKey` (immediate invalidation)
    - _Requirements: 11.1–11.7, 15.7_
  - [x] 4.2 Create `backend/controllers/sessionController.js`
    - Implement: `listSessions` (active super_admin sessions), `forceLogoutSession` (invalidate session JWT, remove from list)
    - _Requirements: 12.5, 12.6_
  - [x] 4.3 Create `backend/middleware/auditMiddleware.js`
    - Auto-log write operations (POST/PUT/PATCH/DELETE) on super-admin routes by wiring into the request lifecycle
    - _Requirements: 14.4_
  - [x] 4.4 Extend `backend/routes/superAdmin.js` with all new sub-routers
    - Wire all controllers from tasks 2–4 under `protect + superAdminOnly` middleware
    - Add routes: `/dashboard/stats`, `/businesses/*`, `/plans/*`, `/subscription-requests/*`, `/payments/*`, `/users`, `/audit-logs`, `/settings/*`, `/sessions/*`
    - _Requirements: 15.1–15.7_
  - [ ]* 4.5 Write property test for Super_Admin RBAC enforcement (Property 10)
    - **Property 10: Super_Admin RBAC enforcement**
    - **Validates: Requirements 12.1, 14.3**
    - File: `backend/tests/superAdmin/rbac.property.test.js`
  - [ ]* 4.6 Write property test for multi-tenant isolation (Property 11)
    - **Property 11: Multi-tenant isolation — no cross-tenant data**
    - **Validates: Requirements 14.1, 14.2**
    - File: `backend/tests/superAdmin/tenantIsolation.property.test.js`
  - [ ]* 4.7 Write backward-compatibility smoke test for existing routes
    - Verify that `GET /api/workouts`, `/api/nutrition`, `/api/progress`, `/api/admin/stats`, and `/api/fees` still return 200 after all new models are registered
    - _Requirements: 15.9_

- [x] 5. Backend checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Frontend — shared components, layout extension, and routing
  - [x] 6.1 Create shared SA components in `frontend/src/pages/SuperAdmin/shared/`
    - Create: `ConfirmDialog.jsx` (destructive-action modal with typed confirmation string support), `StatusBadge.jsx`, `SkeletonKPI.jsx`, `SkeletonTable.jsx`, `DateRangeFilter.jsx` (Last 7/30/90 days, Last 12 months), `ExportButton.jsx`
    - _Requirements: 13.4, 13.9, 13.10_
  - [x] 6.2 Create `frontend/src/context/SuperAdminContext.jsx`
    - Provide global search state (query string, isOpen flag) and unread notification count
    - Expose `openSearch`, `closeSearch`, `setNotifCount` functions via context
    - _Requirements: 13.5_
  - [x] 6.3 Create `frontend/src/pages/SuperAdmin/SA_Notifications/NotificationBell.jsx`
    - Render bell icon with unread badge; display "99+" when count ≥ 100, exact number when < 100
    - Wire to `SuperAdminContext` unread count
    - _Requirements: 10.2, 10.5_
  - [ ]* 6.4 Write property test for notification badge display rule (Property 9)
    - **Property 9: Notification badge display rule**
    - **Validates: Requirements 10.5**
    - File: `frontend/src/tests/superAdmin/notificationBadge.property.test.js`
    - Setup `fast-check` + `vitest` in `frontend`
  - [x] 6.5 Create `frontend/src/pages/SuperAdmin/shared/GlobalSearchModal.jsx`
    - Render a full-screen modal on Ctrl+K / Cmd+K
    - Search across Businesses, End_Users, and Payments via `superAdminAPI`
    - _Requirements: 13.5_
  - [x] 6.6 Extend `frontend/src/pages/SuperAdmin/SuperAdminLayout.jsx`
    - Add all new nav items (Businesses, Plans, Subscription Requests, Payments, Users, Analytics, Notifications, Settings, Security, Audit Logs)
    - Add `NotificationBell` to top bar
    - Add `GlobalSearchModal` via React portal
    - Keep existing collapse-to-icon-only (desktop) and drawer (mobile) behavior
    - Add dark/light mode toggle that persists to `localStorage`
    - _Requirements: 13.1, 13.2_
  - [x] 6.7 Add new Super Admin routes to `frontend/src/App.jsx`
    - Register nested routes under `/super-admin/*`: businesses, businesses/:id, plans, subscription-requests, payments, users, analytics, notifications, settings, security, audit-logs
    - Keep existing four routes intact
    - _Requirements: 13.12_
  - [x] 6.8 Extend `frontend/src/services/api.js` with new `superAdminAPI` methods
    - Add methods for all new backend endpoints: dashboard stats, businesses CRUD, plans CRUD, subscription requests, payments, users (read-only), audit-logs, settings, sessions
    - _Requirements: 15.1–15.7_

- [ ] 7. Frontend — Overview page (KPI cards + charts)
  - [x] 7.1 Create `frontend/src/pages/SuperAdmin/SA_Overview/KPICard.jsx`
    - Render a single metric card with value, label, trend badge (green ↑ / red ↓ / neutral)
    - Animate numeric value counting up from zero on initial load
    - Show `SkeletonKPI` while loading; show error state (no crash) if data slice fails
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 13.11_
  - [ ]* 7.2 Write property test for KPI trend direction consistency (Property 2)
    - **Property 2: KPI trend direction is consistent**
    - **Validates: Requirements 1.3**
    - File: `frontend/src/tests/superAdmin/kpiTrend.property.test.js`
    - Test the `computeTrend(current, previous)` pure utility function
  - [x] 7.3 Create `frontend/src/pages/SuperAdmin/SA_Overview/KPIGrid.jsx`
    - Render the full grid of KPI cards from stats data; each card navigates to its detail section on click
    - _Requirements: 1.1, 1.4_
  - [~] 7.4 Create chart components in `frontend/src/pages/SuperAdmin/SA_Overview/charts/`
    - Create: `BusinessGrowthChart.jsx`, `UserGrowthChart.jsx`, `RevenueChart.jsx`, `PlanDistributionChart.jsx` (Doughnut), `ActiveVsInactiveChart.jsx` (Bar), `LoginStatsChart.jsx`, `CountryDistributionChart.jsx`, `DeviceUsageChart.jsx`, `FeatureUsageChart.jsx`
    - Each chart uses `react-chartjs-2`; shows `SkeletonTable`-size skeleton while loading; shows "No data for selected period" when data is empty
    - _Requirements: 2.1, 2.3, 2.4, 2.5_
  - [x] 7.5 Create `frontend/src/pages/SuperAdmin/SA_Overview/ChartGrid.jsx` and `SAOverviewPage.jsx`
    - `ChartGrid` assembles all chart components with a shared `DateRangeFilter` that re-fetches all charts on change
    - `SAOverviewPage` composes `KPIGrid` + `ChartGrid`, calls `GET /api/super-admin/dashboard/stats`
    - _Requirements: 1.1, 2.1, 2.2_

- [ ] 8. Frontend — Business management pages
  - [~] 8.1 Create `frontend/src/pages/SuperAdmin/SA_Businesses/BusinessTable.jsx`
    - Paginated table with all required columns; search input (≤400ms debounce); filter dropdowns (Status, Plan, Country, Payment Status); column sort toggle; page size selector (10/25/50)
    - _Requirements: 3.1–3.5_
  - [~] 8.2 Create `frontend/src/pages/SuperAdmin/SA_Businesses/BusinessRowActions.jsx` and action modals
    - `BusinessRowActions.jsx`: dropdown with all 12 actions (View, Edit, Suspend, Activate, Delete, Reset Password, Change Plan, Extend Subscription, View Payments, View Trainers, View End_Users, View Activity Logs)
    - `BusinessEditModal.jsx`: form for editing Business profile fields
    - `BusinessChangePlanModal.jsx`: plan selection dropdown
    - `BusinessExtendModal.jsx`: days input
    - All destructive actions (Suspend, Delete) use `ConfirmDialog`; Delete requires typed confirmation string
    - _Requirements: 3.6–3.15_
  - [x] 8.3 Create `frontend/src/pages/SuperAdmin/SA_Businesses/SABusinessListPage.jsx`
    - Assemble `BusinessTable` + `BusinessRowActions`; include CSV export button
    - Breadcrumb: Businesses
    - _Requirements: 3.1, 3.15, 13.3_
  - [x] 8.4 Create `frontend/src/pages/SuperAdmin/SA_BusinessDetail/` page and sub-components
    - `SABusinessDetailPage.jsx`: fetches detail by `:id`, assembles all sub-components; handles 410 gracefully
    - `BusinessProfileCard.jsx`, `BusinessSubscriptionCard.jsx`, `BusinessPaymentHistoryTable.jsx`, `BusinessTrainersTable.jsx`, `BusinessUsersTable.jsx`, `BusinessStatsCard.jsx`, `BusinessAuditTable.jsx`
    - Each section renders its own skeleton and error state independently
    - _Requirements: 4.1–4.5_

- [ ] 9. Frontend — Plans and Subscription Requests pages
  - [~] 9.1 Create `frontend/src/pages/SuperAdmin/SA_Plans/PlanCard.jsx` and `PlanFormModal.jsx`
    - `PlanCard`: displays plan details with enable/disable toggle and Edit/Delete actions; Delete disabled if plan has active subscriptions
    - `PlanFormModal`: form for creating and editing plans with all required fields (name, type, price, currency, billing interval, feature limits)
    - _Requirements: 5.1–5.6_
  - [x] 9.2 Create `frontend/src/pages/SuperAdmin/SA_Plans/SAPlansPage.jsx`
    - List all plans as cards; "Create Plan" button opens `PlanFormModal`
    - Breadcrumb: Plans
    - _Requirements: 5.1–5.6, 13.3_
  - [~] 9.3 Create `frontend/src/pages/SuperAdmin/SA_SubscriptionRequests/RequestQueueTable.jsx` and `RequestActionModal.jsx`
    - Table with queue columns (Business name, requested plan, date, current plan, status badge)
    - `RequestActionModal`: Approve / Reject (with reason field) / Request More Info (with message field)
    - Status badge updates without full page reload after action
    - _Requirements: 6.1–6.5_
  - [x] 9.4 Create `frontend/src/pages/SuperAdmin/SA_SubscriptionRequests/SASubscriptionRequestsPage.jsx`
    - Assemble `RequestQueueTable`
    - Breadcrumb: Subscription Requests
    - _Requirements: 6.1–6.5, 13.3_

- [ ] 10. Frontend — Payments, User Monitoring, and Analytics pages
  - [~] 10.1 Create `frontend/src/pages/SuperAdmin/SA_Payments/PaymentsKPIRow.jsx` and `PaymentsTable.jsx`
    - `PaymentsKPIRow`: six KPI cards (Total Revenue, Monthly Revenue, Yearly Revenue, Pending, Completed, Failed counts)
    - `PaymentsTable`: paginated table with filter (date range, status, business name); Refund action with `ConfirmDialog`; CSV/PDF export button; Invoice link per row
    - _Requirements: 7.1–7.6_
  - [x] 10.2 Create `frontend/src/pages/SuperAdmin/SA_Payments/SAPaymentsPage.jsx`
    - Assemble `PaymentsKPIRow` + `PaymentsTable`
    - Breadcrumb: Payments
    - _Requirements: 7.1–7.6, 13.3_
  - [~] 10.3 Create `frontend/src/pages/SuperAdmin/SA_Users/UserMonitorTable.jsx` and `UserMonitorDetailDrawer.jsx`
    - `UserMonitorTable`: read-only table with platform-wide stats row at top; search by name/email across all tenants
    - `UserMonitorDetailDrawer`: read-only slide-out panel — no edit/delete/save controls; shows End_User or Trainer profile fields as specified
    - _Requirements: 8.1–8.5_
  - [x] 10.4 Create `frontend/src/pages/SuperAdmin/SA_Users/SAUserMonitorPage.jsx`
    - Assemble `UserMonitorTable`
    - Breadcrumb: User Monitoring
    - _Requirements: 8.1–8.5, 13.3_
  - [x] 10.5 Create `frontend/src/pages/SuperAdmin/SA_Analytics/` page and components
    - `SAAnalyticsPage.jsx`: shared `DateRangeFilter` at top; re-fetches all metrics on change; Export CSV/PDF button
    - `AnalyticsMetricsGrid.jsx`: MRR, ARR, total revenue, growth rates, retention, churn, avg session time, conversion rate
    - `MRRARRCard.jsx`, `ChurnCard.jsx` (shows count + percentage for selected period), `GeoDistributionChart.jsx` (bar grouped by country), feature usage frequency table
    - _Requirements: 9.1–9.5, 13.3_

- [ ] 11. Frontend — Notifications, Settings, and Security pages
  - [x] 11.1 Create `frontend/src/pages/SuperAdmin/SA_Notifications/NotificationPanel.jsx` and `SANotificationsPage.jsx`
    - `NotificationPanel`: slide-over panel opened by `NotificationBell`; notifications sorted by most recent; "Mark All as Read" button; unread count badge drops to zero after mark-all; clicking a notification marks it read and navigates — if Business is deleted (410), shows "Business no longer exists"
    - `SANotificationsPage.jsx`: full page view of notification history with pagination
    - _Requirements: 10.1–10.6_
  - [x] 11.2 Create `frontend/src/pages/SuperAdmin/SA_Settings/` tabbed page
    - `SASettingsPage.jsx`: tabbed layout with: BrandingTab (name, logo, brand colors — apply updated colors immediately on save), SmtpTab (fields + "Test Connection" button), PaymentGatewaysTab (Stripe/PayPal), SecurityPoliciesTab, ApiKeysTab (create shows plaintext once with warning; revoke with `ConfirmDialog`), MaintenanceTab (enable/disable with confirmation; applies maintenance banner to all non-super-admin routes), LanguagesCurrenciesTab
    - Each tab calls the relevant PATCH `/api/super-admin/settings` endpoint
    - _Requirements: 11.1–11.7, 13.3_
  - [~] 11.3 Create `frontend/src/pages/SuperAdmin/SA_Security/SessionsTable.jsx` and `AuditLogTable.jsx`
    - `SessionsTable`: lists active sessions (device, browser, IP, last-seen); "Force Logout" uses `ConfirmDialog`
    - `AuditLogTable`: paginated, filter by actionType/targetEntity/date range/outcome
    - _Requirements: 12.3, 12.5, 12.6_
  - [x] 11.4 Create `frontend/src/pages/SuperAdmin/SA_Security/SASecurityPage.jsx` and `SAAuditLogsPage.jsx`
    - `SASecurityPage`: assembles `SessionsTable` + 2FA toggle section (enable/disable TOTP)
    - `SAAuditLogsPage`: assembles `AuditLogTable`
    - Breadcrumbs on both pages
    - _Requirements: 12.2–12.6, 13.3_

- [x] 12. Frontend checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Frontend — UI polish, responsive design, and accessibility
  - [x] 13.1 Add dark/light mode toggle to `SuperAdminLayout` top bar
    - Persist mode to `localStorage`; toggle CSS theme classes on root element
    - _Requirements: 13.2_
  - [x] 13.2 Implement breadcrumb navigation in all SA sub-pages
    - Render breadcrumb trail showing section hierarchy (e.g., Businesses > Detail > [Business Name])
    - _Requirements: 13.3_
  - [x] 13.3 Verify responsive layout for all SA pages (320px–2560px)
    - Test overview KPI grid, all tables, charts, forms, and modals on mobile/tablet/desktop
    - Ensure sidebar collapses to icon-only on desktop, slides as drawer on mobile (existing behavior verified)
    - _Requirements: 13.7_
  - [x] 13.4 Apply WCAG 2.1 AA contrast requirements to all SA components
    - Audit text/background contrast ratios; ensure all interactive elements meet AA standard
    - _Requirements: 13.8_
  - [ ]* 13.5 Write unit tests for `ConfirmDialog` component
    - Test: renders confirmation input and calls `onConfirm` only after correct string typed
    - Test: Cancel button closes dialog without calling `onConfirm`
    - _Requirements: 13.9_
  - [ ]* 13.6 Write unit tests for `KPICard` component
    - Test: renders skeleton when loading prop is true
    - Test: renders error state when error prop is provided
    - Test: renders metric value and trend badge when data is present
    - _Requirements: 1.2, 1.5_

- [x] 14. Integration and end-to-end wiring
  - [x] 14.1 Wire Business-scoped queries to use `getTenantUserIds` in existing admin/trainer controllers
    - Update `adminController` and `trainerController` to populate `businessId` when creating Users/Trainers
    - Verify existing Fee/Attendance/Workout queries filter correctly by businessId
    - _Requirements: 14.1, 14.2_
  - [x] 14.2 Add maintenance mode banner to non-super-admin routes
    - Read `maintenance` GlobalSettings flag on every page load (or via context)
    - Show full-screen banner on all routes except `/super-admin/*` when enabled
    - _Requirements: 11.3_
  - [ ]* 14.3 Write integration test for subscription approval flow
    - Verify `PUT /api/super-admin/subscription-requests/:id/approve` creates Payment record and sends notification to Business_Admin
    - _Requirements: 6.2_
  - [ ]* 14.4 Write integration test for SMTP test connection
    - Verify `POST /api/super-admin/settings/smtp/test` returns success/failure within 10s (return 408 on timeout)
    - _Requirements: 11.4_
  - [ ]* 14.5 Write integration test for GlobalSearch
    - Verify Ctrl+K opens modal; search query returns results from Businesses, End_Users, and Payments
    - _Requirements: 13.5_

- [ ] 15. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The backend uses the existing protect + superAdminOnly middleware chain on all `/api/super-admin/*` routes
- The frontend extends the existing SuperAdminLayout without replacing it
- All new models are strictly additive — User model gains only a single optional `businessId` field (default: null)
- Dark/light mode, responsive design, and WCAG AA contrast are applied across all SA pages

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7"] },
    { "id": 1, "tasks": ["1.8", "1.9", "1.11", "1.12"] },
    { "id": 2, "tasks": ["1.10", "2.1", "6.1", "6.2"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "4.3", "6.3", "6.8"] },
    { "id": 4, "tasks": ["2.5", "2.6", "2.7", "2.8", "3.1", "3.3", "3.4", "3.5", "6.4", "6.5"] },
    { "id": 5, "tasks": ["3.2", "3.6", "4.1", "4.2", "4.4", "7.1", "7.3"] },
    { "id": 6, "tasks": ["4.5", "4.6", "4.7", "7.2", "7.4", "6.6", "6.7"] },
    { "id": 7, "tasks": ["7.5", "8.1", "9.1", "9.3", "10.1", "10.3", "10.5", "11.1", "11.3"] },
    { "id": 8, "tasks": ["8.2", "8.4", "9.2", "9.4", "10.2", "10.4", "11.2", "11.4"] },
    { "id": 9, "tasks": ["8.3", "13.1", "13.2", "13.3", "13.4", "14.1", "14.2"] },
    { "id": 10, "tasks": ["13.5", "13.6", "14.3", "14.4", "14.5"] }
  ]
}
```
