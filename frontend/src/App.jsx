import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/Layout/AppLayout';
import AdminLayout from './components/Layout/AdminLayout';
import LoadingSpinner from './components/UI/LoadingSpinner';

// App pages
import Login           from './pages/Auth/Login';
import Register        from './pages/Auth/Register';
import GoogleSuccess   from './pages/Auth/GoogleSuccess';
import Dashboard       from './pages/Dashboard/Dashboard';
import Workouts        from './pages/Workouts/Workouts';
import Nutrition       from './pages/Nutrition/Nutrition';
import Progress        from './pages/Progress/Progress';
import Analytics       from './pages/Analytics/Analytics';
import Profile         from './pages/Profile/Profile';
import Recommendations from './pages/Recommendations/Recommendations';
import Attendance      from './pages/Attendance/Attendance';
import WeeklyPlan      from './pages/WeeklyPlan/WeeklyPlan';
import Gamification    from './pages/Gamification/Gamification';
import Landing        from './pages/Landing/Landing';
import Pricing         from './pages/Subscription/Pricing';
import HowToUse        from './pages/HowToUse/HowToUse';
import Rules            from './pages/Rules/Rules';

// Admin pages
import AdminDashboard   from './pages/Admin/AdminDashboard';
import AdminUsers       from './pages/Admin/AdminUsers';
import AdminUserProfile from './pages/Admin/AdminUserProfile';
import AdminTrainers    from './pages/Admin/AdminTrainers';
import SuperAdminLayout    from './pages/SuperAdmin/SuperAdminLayout';
import SuperAdminDashboard from './pages/SuperAdmin/SuperAdminDashboard';
import SuperAdminAdmins    from './pages/SuperAdmin/SuperAdminAdmins';
import SuperAdminUsers     from './pages/SuperAdmin/SuperAdminUsers';
import SuperAdminViolations from './pages/SuperAdmin/SuperAdminViolations';
import SAOverviewPage      from './pages/SuperAdmin/SA_Overview/SAOverviewPage';
import SABusinessListPage  from './pages/SuperAdmin/SA_Businesses/SABusinessListPage';
import SABusinessDetailPage from './pages/SuperAdmin/SA_BusinessDetail/SABusinessDetailPage';
import SAPlansPage         from './pages/SuperAdmin/SA_Plans/SAPlansPage';
import SASubscriptionRequestsPage from './pages/SuperAdmin/SA_SubscriptionRequests/SASubscriptionRequestsPage';
import SAPaymentsPage      from './pages/SuperAdmin/SA_Payments/SAPaymentsPage';
import SAUserMonitorPage   from './pages/SuperAdmin/SA_Users/SAUserMonitorPage';
import SAAnalyticsPage     from './pages/SuperAdmin/SA_Analytics/SAAnalyticsPage';
import SANotificationsPage from './pages/SuperAdmin/SA_Notifications/SANotificationsPage';
import SASettingsPage      from './pages/SuperAdmin/SA_Settings/SASettingsPage';
import SASecurityPage      from './pages/SuperAdmin/SA_Security/SASecurityPage';
import AdminUpgradeRequests from './pages/Admin/AdminUpgradeRequests';
import AdminAttendance  from './pages/Admin/AdminAttendance';
import AdminFees        from './pages/Admin/AdminFees';
import AdminAttendanceRequests from './pages/Admin/AdminAttendanceRequests';

// Trainer pages
import TrainerLayout       from './pages/Trainer/TrainerLayout';
import TrainerClients      from './pages/Trainer/TrainerClients';
import TrainerClientDetail from './pages/Trainer/TrainerClientDetail';
import TrainerAttendance   from './pages/Trainer/TrainerAttendance';
import TrainerFees         from './pages/Trainer/TrainerFees';

// ── Route guards ───────────────────────────────────────────────────────────────

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const TrainerRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || (user.role !== 'trainer' && user.role !== 'admin')) return <Navigate to="/dashboard" replace />;
  return children;
};

const SuperAdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || user.role !== 'super_admin') return <Navigate to="/dashboard" replace />;
  return children;
};

// Shows landing to guests, redirects logged-in users to dashboard
const LandingOrDashboard = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Landing />;
};

const AppRoutes = () => (
  <Routes>
    {/* Landing — main entry point */}
    <Route path="/"         element={<LandingOrDashboard />} />
    <Route path="/home"     element={<Landing />} />
    <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/pricing"            element={<Pricing />} />
    <Route path="/auth/google/success" element={<GoogleSuccess />} />

    {/* Rules & Regulations — accessible to all authenticated users */}
    <Route path="/rules" element={<ProtectedRoute><Rules /></ProtectedRoute>} />

    {/* App — protected */}
    <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard"       element={<Dashboard />} />
      <Route path="workouts"        element={<Workouts />} />
      <Route path="nutrition"       element={<Nutrition />} />
      <Route path="progress"        element={<Progress />} />
      <Route path="analytics"       element={<Analytics />} />
      <Route path="recommendations" element={<Recommendations />} />
      <Route path="weekly-plan"     element={<WeeklyPlan />} />
      <Route path="gamification"    element={<Gamification />} />
      <Route path="attendance"      element={<Attendance />} />
      <Route path="how-to-use"      element={<HowToUse />} />
      <Route path="profile"         element={<Profile />} />
    </Route>

    {/* Admin */}
    <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
      <Route index              element={<AdminDashboard />} />
      <Route path="users"       element={<AdminUsers />} />
      <Route path="users/:id"   element={<AdminUserProfile />} />
      <Route path="trainers"    element={<AdminTrainers />} />
      <Route path="upgrades"    element={<AdminUpgradeRequests />} />
      <Route path="attendance"  element={<AdminAttendance />} />
      <Route path="fees"                 element={<AdminFees />} />
      <Route path="attendance-requests"  element={<AdminAttendanceRequests />} />
    </Route>

    {/* Trainer */}
    <Route path="/trainer" element={<TrainerRoute><TrainerLayout /></TrainerRoute>}>
      <Route index                    element={<TrainerClients />} />
      <Route path="client/:userId"    element={<TrainerClientDetail />} />
      <Route path="attendance"        element={<TrainerAttendance />} />
      <Route path="fees"              element={<TrainerFees />} />
    </Route>

    {/* Super Admin */}
    <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>}>
      <Route index                        element={<SAOverviewPage />} />
      <Route path="businesses"            element={<SABusinessListPage />} />
      <Route path="businesses/:id"        element={<SABusinessDetailPage />} />
      <Route path="plans"                 element={<SAPlansPage />} />
      <Route path="subscription-requests" element={<SASubscriptionRequestsPage />} />
      <Route path="payments"              element={<SAPaymentsPage />} />
      <Route path="users"                 element={<SAUserMonitorPage />} />
      <Route path="analytics"             element={<SAAnalyticsPage />} />
      <Route path="notifications"         element={<SANotificationsPage />} />
      <Route path="settings"              element={<SASettingsPage />} />
      <Route path="security"              element={<SASecurityPage />} />
      <Route path="violations"            element={<SuperAdminViolations />} />
      <Route path="admins"                element={<SuperAdminAdmins />} />
      <Route path="dashboard"             element={<SuperAdminDashboard />} />
    </Route>

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

// ── App ────────────────────────────────────────────────────────────────────────

const App = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            },
            success: { iconTheme: { primary: '#3b82f6', secondary: '#0f172a' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#0f172a' } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
