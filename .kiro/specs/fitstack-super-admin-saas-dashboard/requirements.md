# Requirements Document

## Introduction

FitStack is a multi-tenant SaaS fitness platform where businesses (gyms, fitness studios, coaches) purchase subscriptions to manage their own Admins, Trainers, and end Users. The Super Admin Dashboard is a comprehensive platform-owner control center that provides full visibility into all tenants, financials, subscriptions, analytics, security, and global settings. It replaces the current minimal 4-tab panel with a production-grade SaaS dashboard inspired by Stripe, Linear, Vercel, and Notion — fully responsive, dark/light mode, and deeply integrated with the existing MERN stack.

The existing system has: `super_admin` role in the User model, a basic `/super-admin` panel (Overview, Admin Accounts, All Users, Rules Enforcement), JWT auth, existing User/Workout/Nutrition/Progress/Fee/Attendance models, and Tailwind CSS with a dark theme (`bg-dark-950`, `brand-500` blue).

---

## Glossary

- **Super_Admin**: The platform owner with unrestricted read and controlled-write access across all tenants.
- **Business**: A tenant on the platform — a gym, studio, or fitness coach — represented by a user with `role: admin`. Each Business has its own Trainers and Users.
- **Business_Admin**: A user with `role: admin` who owns and operates a single Business tenant.
- **Trainer**: A user with `role: trainer` assigned to a Business.
- **End_User**: A user with `role: user` belonging to a Business.
- **Subscription_Plan**: A configurable plan (Monthly, Yearly, Lifetime, Trial, Enterprise) that defines feature limits for a Business.
- **Subscription_Request**: A request from a Business_Admin to activate, upgrade, or renew a Subscription_Plan.
- **Payment**: A financial transaction record linked to a Business for subscription fees.
- **Audit_Log**: An immutable record of every Super_Admin action performed on the platform.
- **KPI_Card**: A dashboard card displaying a single key performance indicator with a value and optional trend.
- **Dashboard**: The Super Admin SaaS Dashboard described in this document.
- **API**: The existing Node.js/Express backend REST API.
- **UI**: The React frontend rendered at `/super-admin/*`.
- **Notification_Center**: The in-app notification panel visible to the Super_Admin.
- **Global_Settings**: Platform-wide configuration managed exclusively by the Super_Admin.
- **Tenant_Isolation**: The guarantee that data from one Business is never accessible to another Business.

---

## Requirements

### Requirement 1: Dashboard Overview — KPI Cards

**User Story:** As a Super_Admin, I want to see key platform metrics at a glance on a single overview page, so that I can monitor platform health without navigating to sub-sections.

#### Acceptance Criteria

1. WHEN the Super_Admin navigates to `/super-admin`, THE Dashboard SHALL display KPI cards for: Total Businesses, Active Businesses, Suspended Businesses, Trial Businesses, Expired Businesses, Total Business_Admins, Total Trainers, Total End_Users, Active End_Users Today, New End_Users This Month, Total Revenue, Monthly Revenue, Pending Subscription_Requests, Pending Support Tickets, Storage Usage percentage, and API Health status.
2. WHEN KPI data is loading, THE Dashboard SHALL display animated skeleton placeholders for each KPI_Card.
3. WHEN a KPI value changes relative to the previous period, THE KPI_Card SHALL display a percentage trend indicator (positive in green, negative in red).
4. WHEN the Super_Admin clicks a KPI_Card that has a corresponding detail section, THE Dashboard SHALL navigate to the relevant management section.
5. IF the API call for platform stats fails, THEN THE Dashboard SHALL display an error state on each affected KPI_Card without crashing the page, and IF the error state display mechanism itself fails, THE Dashboard SHALL allow the page to crash to preserve honest failure reporting.

---

### Requirement 2: Dashboard Overview — Charts

**User Story:** As a Super_Admin, I want to see visual trend charts on the overview page, so that I can identify growth patterns, revenue trends, and usage anomalies over time.

#### Acceptance Criteria

1. THE Dashboard SHALL display charts for: Monthly Business Growth, Monthly End_User Growth, Revenue over time, Subscription_Plan distribution (pie/donut), Active vs Inactive Businesses (bar), End_User activity heatmap, Login Statistics over time, Country-wise Business distribution (map or bar), Device Usage breakdown, and Feature Usage frequency.
2. WHEN the Super_Admin selects a date range filter (Last 7 days, Last 30 days, Last 90 days, Last 12 months), THE Dashboard SHALL re-render all charts with data filtered to that period.
3. WHEN chart data is loading, THE Dashboard SHALL display skeleton loaders in the chart area.
4. WHEN chart data finishes loading and no data exists for the selected period, THE Dashboard SHALL display a "No data for selected period" message inside the chart container after first showing skeleton loaders during the loading state.
5. THE Dashboard SHALL render charts using a React-compatible charting library (Recharts or Chart.js via react-chartjs-2) already present or installable in the frontend.

---

### Requirement 3: Business Management — Listing and CRUD

**User Story:** As a Super_Admin, I want a full management table for all Businesses, so that I can view, search, filter, sort, and take action on any Business account.

#### Acceptance Criteria

1. THE Dashboard SHALL display a paginated table of Businesses with columns: Business Logo, Name, Business ID, Owner Name, Owner Email, Owner Phone, Country, City, Subscription_Plan, Status, Trial Status, Payment Status, Total Trainers, Total End_Users, Storage Used, Registration Date, Last Login, and Account Status.
2. WHEN the Super_Admin types in the search field, THE Business_Management_Table SHALL filter results by Business Name, Owner Email, or Business ID with a debounce of no more than 400ms.
3. WHEN the Super_Admin applies a filter (Status, Subscription_Plan, Country, Payment Status), THE Business_Management_Table SHALL update results to match all applied filters simultaneously.
4. WHEN the Super_Admin clicks a column header, THE Business_Management_Table SHALL sort the table by that column, toggling between ascending and descending order.
5. THE Business_Management_Table SHALL support pagination with a configurable page size (10, 25, 50 rows per page).
6. WHEN the Super_Admin clicks "View" on a Business row, THE Dashboard SHALL navigate to that Business's detail page.
7. WHEN the Super_Admin clicks "Edit" on a Business row and submits a valid form, THE API SHALL update the Business record and THE Dashboard SHALL display a success notification.
8. WHEN the Super_Admin clicks "Suspend" on an Active Business and confirms the action, THE API SHALL set that Business's status to `suspended`, THE Business_Admin SHALL receive an in-app notification, and THE Dashboard SHALL update the row status immediately.
9. WHEN the Super_Admin clicks "Activate" on a Suspended Business, THE API SHALL set the Business status to `active` and THE Dashboard SHALL reflect the change.
10. WHEN the Super_Admin clicks "Delete" on a Business and confirms with a typed confirmation string, THE API SHALL soft-delete the Business record and THE Dashboard SHALL remove the row.
11. WHEN the Super_Admin clicks "Reset Password" for a Business_Admin, THE API SHALL send a password reset email to that Business_Admin's registered email address.
12. WHEN the Super_Admin clicks "Change Plan" and selects a new Subscription_Plan, THE API SHALL update the Business's Subscription_Plan and THE Dashboard SHALL reflect the new plan on the row.
13. WHEN the Super_Admin clicks "Extend Subscription" and enters a number of days, THE API SHALL extend the Business's subscription end date by that number of days.
14. THE Business_Management_Table SHALL provide action buttons or a dropdown for: View, Edit, Suspend, Activate, Delete, Reset Password, Change Plan, Extend Subscription, View Payments, View Trainers, View End_Users, and View Activity Logs.
15. WHEN the Super_Admin exports the Business list, THE Dashboard SHALL generate and download a CSV file containing all visible columns for all rows matching the current filter.

---

### Requirement 4: Business Details Page

**User Story:** As a Super_Admin, I want a dedicated detail page for each Business, so that I can see all its information, history, and associated entities in one place.

#### Acceptance Criteria

1. WHEN the Super_Admin navigates to a Business detail page, THE Dashboard SHALL display available sections with the following content — showing empty or error states for sections that fail to load due to backend errors, so the page remains partially functional: Business profile (logo, name, ID, owner contact), subscription details (plan, status, start/end dates), payment history table, Trainer list with status, End_User list with activity indicators, business-level statistics (login frequency, feature usage, storage), and Audit_Log for that Business.
2. WHEN the Super_Admin views the payment history on the Business detail page, THE Dashboard SHALL show each Payment with: date, amount, currency, plan, status (completed/pending/failed), and invoice download link.
3. WHEN the Super_Admin views the Trainer list on the Business detail page, THE Dashboard SHALL show each Trainer with: name, email, status (active/inactive), assigned End_User count, and last login.
4. WHEN the Super_Admin views the End_User list on the Business detail page, THE Dashboard SHALL show each End_User with: name, email, status, subscription type, last login, and workout count.
5. THE Business_Detail_Page SHALL allow the Super_Admin to trigger any of the actions available in the Business_Management_Table directly from the detail page.

---

### Requirement 5: Subscription Plan Management

**User Story:** As a Super_Admin, I want to create, edit, enable, disable, and delete subscription plans, so that I can control what offerings are available to Businesses on the platform.

#### Acceptance Criteria

1. THE Dashboard SHALL display a list of all Subscription_Plans with: name, type (Monthly, Yearly, Lifetime, Trial, Enterprise), price, currency, status (enabled/disabled), and feature limits.
2. WHEN the Super_Admin submits a valid Create Plan form, THE API SHALL create a new Subscription_Plan record with fields: name, type, price, currency, billing interval, max End_Users, max Trainers, storage limit (GB), AI Features enabled flag, Analytics enabled flag, White Label enabled flag, Custom Domain enabled flag, email notification limit, push notification limit, and API access flag.
3. WHEN the Super_Admin submits a valid Edit Plan form, THE API SHALL update the Subscription_Plan fields and THE Dashboard SHALL reflect the changes.
4. WHEN the Super_Admin toggles a plan's enabled/disabled status, THE API SHALL update the plan status and THE Dashboard SHALL show the updated badge.
5. WHEN the Super_Admin deletes a plan that has no active Business subscriptions, THE API SHALL delete the plan record. Deletion of plans with no active subscriptions is permitted.
6. IF the Super_Admin attempts to delete a plan that has one or more active Business subscriptions, THEN THE API SHALL reject the deletion with a descriptive error message listing the count of affected Businesses.

---

### Requirement 6: Subscription Request Workflow

**User Story:** As a Super_Admin, I want to review and action subscription requests from Businesses, so that I can approve, reject, or request more information before a plan is activated.

#### Acceptance Criteria

1. THE Dashboard SHALL display all Subscription_Requests in a queue with: Business name, requested plan, request date, current plan, and request status (pending/approved/rejected/info-requested).
2. WHEN the Super_Admin clicks "Approve" on a Subscription_Request, THE API SHALL activate the requested Subscription_Plan for the Business, create a Payment record, and THE Business_Admin SHALL receive an in-app notification.
3. WHEN the Super_Admin clicks "Reject" and provides a reason, THE API SHALL mark the Subscription_Request as rejected and THE Business_Admin SHALL receive an in-app notification containing the rejection reason.
4. WHEN the Super_Admin clicks "Request More Info" and provides a message, THE API SHALL mark the Subscription_Request status as `info-requested` and THE Business_Admin SHALL receive an in-app notification with the message.
5. WHEN a Subscription_Request status changes, THE Dashboard SHALL update the request's status badge without a full page reload.

---

### Requirement 7: Payments Module

**User Story:** As a Super_Admin, I want full visibility into all payment transactions on the platform, so that I can monitor revenue, process refunds, and reconcile financial records.

#### Acceptance Criteria

1. THE Dashboard SHALL display a Payments section showing: Total Revenue (all-time), Monthly Revenue (current month), Yearly Revenue (current year), count of Pending Payments, count of Completed Payments, and count of Failed Payments as KPI_Cards.
2. THE Dashboard SHALL display a paginated Payments table with columns: Business name, amount, currency, plan, payment date, status (pending/completed/failed/refunded), payment method, and invoice link.
3. WHEN the Super_Admin applies a filter (date range, status, Business name), THE Payments_Table SHALL update to show only matching Payment records.
4. WHEN the Super_Admin clicks "Refund" on a Completed Payment and confirms, THE API SHALL mark the Payment as `refunded` and THE Dashboard SHALL update the row status.
5. WHEN the Super_Admin clicks "Export", THE Dashboard SHALL generate and download a file containing all Payment records matching the current filter in the selected format (CSV or PDF).
6. WHEN the Super_Admin clicks an invoice link for a Payment, THE Dashboard SHALL open or download a formatted invoice for that Payment.

---

### Requirement 8: Platform-Wide User Monitoring

**User Story:** As a Super_Admin, I want read-only visibility into all End_Users across all Businesses, so that I can monitor platform usage and investigate support issues without modifying tenant data.

#### Acceptance Criteria

1. THE Dashboard SHALL display platform-wide End_User statistics: total End_Users, active today, new this month, premium End_Users, and banned End_Users.
2. WHEN the Super_Admin searches for an End_User by name or email in the global search, THE Dashboard SHALL display matching profiles from any Business tenant.
3. WHEN the Super_Admin is actively viewing an End_User profile in the monitoring section, THE Dashboard SHALL render all displayed fields and controls in read-only mode, with no edit, delete, or save controls available.
4. THE Dashboard's monitoring section SHALL NOT provide any controls that allow the Super_Admin to modify an End_User's data, workouts, nutrition, or progress records. Modifications to End_User data remain available through other dashboard sections outside of monitoring.
5. WHEN the Super_Admin views a Trainer profile, THE Dashboard SHALL display: name, email, assigned Business, assigned End_User count, status, and last login — all in read-only mode.

---

### Requirement 9: Analytics

**User Story:** As a Super_Admin, I want a dedicated analytics section with deep platform insights, so that I can make data-driven decisions about the platform's growth and health.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an Analytics section with metrics for: Revenue (MRR, ARR, total), Business growth rate, End_User growth rate, Trainer growth rate, Business retention rate, Business churn rate, average session time, feature usage frequency by feature name, subscription conversion rate, geographic distribution of Businesses, and device type distribution.
2. WHEN the Super_Admin selects a date range in the Analytics section, THE Dashboard SHALL re-compute and display all metrics for that period.
3. WHEN the Super_Admin views the churn rate metric, THE Dashboard SHALL show the number and percentage of Businesses that cancelled or let subscriptions expire within the selected period.
4. WHEN the Super_Admin views the Geographic analytics chart, THE Dashboard SHALL display Business counts grouped by country.
5. THE Dashboard SHALL allow the Super_Admin to export analytics reports as CSV or PDF.

---

### Requirement 10: Super Admin Notification Center

**User Story:** As a Super_Admin, I want automatic in-app notifications for critical platform events, so that I can react quickly to issues without manually polling dashboards.

#### Acceptance Criteria

1. THE Notification_Center SHALL automatically create a notification for the Super_Admin when: a new Business registers, a Business subscription is 7 days from expiry, a Business requests a plan upgrade, a Payment is completed or fails, server health degrades below a configurable threshold, and a support ticket is created.
2. WHEN the Super_Admin clicks the notification bell icon, THE Dashboard SHALL open the Notification_Center panel displaying unread notifications sorted by most recent first.
3. WHEN the Super_Admin clicks a notification, THE Dashboard SHALL mark it as read and navigate to the relevant section.
4. WHEN the Super_Admin clicks "Mark All as Read", THE API SHALL mark all notifications for the Super_Admin as read and THE Notification_Center SHALL update the unread badge count to zero.
5. THE Notification_Center badge SHALL display the count of unread notifications; WHEN the unread count reaches 100 or more, THE badge SHALL display "99+" instead of the exact number.
6. IF a notification links to a Business that has been deleted, THEN THE Dashboard SHALL display a "Business no longer exists" message instead of navigating.

---

### Requirement 11: Global Settings

**User Story:** As a Super_Admin, I want to manage all platform-wide configuration settings from a single settings section, so that I can control branding, integrations, and operational parameters.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Global_Settings section with tabs for: Platform Branding (name, logo, brand colors), SMTP Configuration, Push Notification Configuration (Firebase FCM), Payment Gateways (Stripe and PayPal), Social Login (Google OAuth), Supported Languages, Supported Currencies, Default Time Zone, Maintenance Mode, Terms & Privacy Policy URLs, Email Templates, Backup Configuration, Security Policies, and API Keys management.
2. WHEN the Super_Admin saves valid Platform Branding settings, THE API SHALL persist the name, logo URL, and brand color hex codes and THE Dashboard SHALL apply the updated brand colors immediately.
3. WHEN the Super_Admin enables Maintenance Mode, THE API SHALL set a platform-wide maintenance flag and THE Dashboard SHALL display a maintenance banner on all non-super-admin routes.
4. WHEN the Super_Admin saves valid SMTP settings and clicks "Test Connection", THE API SHALL attempt an SMTP connection and return a success or failure status within 10 seconds.
5. WHEN the Super_Admin saves valid Stripe configuration (API key, webhook secret), THE API SHALL store the credentials securely (not returned in subsequent GET responses) and the payment flow SHALL use the configured credentials.
6. WHEN the Super_Admin creates a new API Key, THE API SHALL generate a unique key, store its hash, and display the plaintext key exactly once to the Super_Admin with a warning that it cannot be retrieved again.
7. WHEN the Super_Admin revokes an API Key, THE API SHALL invalidate the key immediately and any subsequent requests using that key SHALL receive a 401 response.

---

### Requirement 12: Security and Access Control

**User Story:** As a Super_Admin, I want robust security controls and complete audit visibility, so that I can protect the platform and maintain compliance.

#### Acceptance Criteria

1. THE API SHALL enforce role-based access control ensuring that only users with `role: super_admin` can access any `/api/super-admin/*` endpoint.
2. WHEN the Super_Admin enables Two-Factor Authentication (2FA), THE Dashboard SHALL require a valid TOTP code on every login in addition to the password.
3. THE Dashboard SHALL display an Audit_Log table showing every Super_Admin action with: action type, target entity (Business/User/Plan/Setting), timestamp, IP address, and outcome (success/failure).
4. THE Dashboard SHALL display an Activity_Log for each Business showing all Business_Admin actions within that tenant.
5. WHEN the Super_Admin views the Session Management section, THE Dashboard SHALL list all active Super_Admin sessions with: device, browser, IP address, and last-seen timestamp.
6. WHEN the Super_Admin clicks "Force Logout" on an active session, THE API SHALL invalidate that session's JWT and THE Dashboard SHALL remove the session from the list.
7. WHEN the Super_Admin configures password policies (minimum length, complexity, expiry days), THE API SHALL enforce those policies for all subsequent password changes by Business_Admins and Trainers on the platform.
8. WHEN a failed login attempt from an unknown IP exceeds 5 attempts within 15 minutes, THE API SHALL temporarily block that IP for 30 minutes and THE Dashboard SHALL log the event in the Audit_Log.

---

### Requirement 13: UI/UX Standards

**User Story:** As a Super_Admin, I want a modern, responsive, and accessible dashboard, so that I can work efficiently on any device.

#### Acceptance Criteria

1. THE Dashboard SHALL implement a collapsible sidebar navigation that collapses to icon-only mode on desktop and slides in as a drawer on mobile.
2. THE Dashboard SHALL support dark mode and light mode, persisting the user's preference to `localStorage`.
3. THE Dashboard SHALL display breadcrumb navigation showing the current section hierarchy on all pages below the top-level overview.
4. WHEN a data table or chart is loading, THE Dashboard SHALL display loading skeletons that match the expected layout of the content.
5. THE Dashboard SHALL implement global search accessible via a keyboard shortcut (Ctrl+K / Cmd+K) that searches across Businesses, End_Users, and Payments.
6. ALL data tables in the Dashboard SHALL support column sorting, filtering, pagination, and CSV export.
7. THE Dashboard SHALL be responsive and fully functional on screen widths from 320px to 2560px.
8. THE Dashboard SHALL conform to WCAG 2.1 AA contrast requirements for all text and interactive elements.
9. WHEN any destructive action (Delete, Suspend, Force Logout, Revoke Key) is triggered, THE Dashboard SHALL display a confirmation dialog before executing the action.
10. THE Dashboard SHALL display toast notifications for all API operation outcomes (success, error, and warning) positioned in the top-right corner.
11. WHERE animated KPI cards are rendered, THE Dashboard SHALL animate numeric values counting up from zero on initial load.
12. THE Dashboard SHALL use React Router v6 nested routes under `/super-admin/*` to maintain navigation state on page refresh.

---

### Requirement 14: Multi-Tenant Data Isolation

**User Story:** As a Super_Admin, I want strict data isolation between Business tenants, so that no Business can access another Business's data and the platform remains trustworthy.

#### Acceptance Criteria

1. THE API SHALL ensure that every query for Business-scoped data (Trainers, End_Users, Payments, Attendance, Fees) is filtered by the requesting Business's identifier; IF filtering cannot be applied, THE API SHALL return an empty result set rather than returning cross-tenant data.
2. WHEN the Super_Admin retrieves data for a specific Business, THE API SHALL scope all returned sub-entities to that Business only.
3. IF a Business_Admin attempts to access an endpoint outside their own tenant scope, THEN THE API SHALL return a 403 Forbidden response.
4. WHEN the Super_Admin modifies Business data (plan change, suspension, extension), THE API SHALL record the action in the Audit_Log before committing the change.
5. THE API SHALL validate that all Business-scoped update operations include the acting Super_Admin's identity in the Audit_Log entry.

---

### Requirement 15: Backend Models and API Endpoints

**User Story:** As a developer, I want new backend models and API endpoints to support all dashboard features, so that the frontend can retrieve and mutate data consistently and securely.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /api/super-admin/dashboard/stats` endpoint returning all KPI values and chart data series required by Requirements 1 and 2.
2. THE API SHALL expose CRUD endpoints for Businesses at `/api/super-admin/businesses` supporting list (with filtering, sorting, pagination), get-by-id, update, soft-delete, suspend, activate, change-plan, and extend-subscription operations.
3. THE API SHALL expose CRUD endpoints for Subscription_Plans at `/api/super-admin/plans` supporting list, create, update, enable/disable, and delete operations.
4. THE API SHALL expose endpoints for Subscription_Requests at `/api/super-admin/subscription-requests` supporting list, approve, reject, and request-info operations.
5. THE API SHALL expose a Payments endpoint at `/api/super-admin/payments` supporting list (with filtering by date range, status, Business), refund, and export operations.
6. THE API SHALL expose an Audit_Log endpoint at `/api/super-admin/audit-logs` supporting paginated retrieval filtered by action type, target entity, date range, and outcome.
7. THE API SHALL expose a Global_Settings endpoint at `/api/super-admin/settings` supporting GET and PATCH for each settings category (branding, smtp, payment gateways, security policies).
8. THE API SHALL add new Mongoose models: `Business` (tenant profile), `SubscriptionPlan`, `SubscriptionRequest`, `Payment`, `AuditLog`, `GlobalSettings`, and `SuperAdminSession`.
9. WHEN a new model is introduced, THE API SHALL maintain strict backward compatibility with existing User, Workout, Nutrition, Progress, Fee, and Attendance models, and THE API SHALL reject any new model introduction that would cause existing models to become non-functional.
