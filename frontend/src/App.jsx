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
import Pricing         from './pages/Subscription/Pricing';
import HowToUse        from './pages/HowToUse/HowToUse';

// Admin pages
import AdminDashboard   from './pages/Admin/AdminDashboard';
import AdminUsers       from './pages/Admin/AdminUsers';
import AdminUserProfile from './pages/Admin/AdminUserProfile';
import AdminTrainers    from './pages/Admin/AdminTrainers';
import AdminUpgradeRequests from './pages/Admin/AdminUpgradeRequests';
import AdminAttendance  from './pages/Admin/AdminAttendance';

// Trainer pages
import TrainerLayout       from './pages/Trainer/TrainerLayout';
import TrainerClients      from './pages/Trainer/TrainerClients';
import TrainerClientDetail from './pages/Trainer/TrainerClientDetail';
import TrainerAttendance   from './pages/Trainer/TrainerAttendance';

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

// ── Routes ─────────────────────────────────────────────────────────────────────

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/login"              element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register"           element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/pricing"            element={<Pricing />} />
    <Route path="/auth/google/success" element={<GoogleSuccess />} />

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
    </Route>

    {/* Trainer */}
    <Route path="/trainer" element={<TrainerRoute><TrainerLayout /></TrainerRoute>}>
      <Route index                    element={<TrainerClients />} />
      <Route path="client/:userId"    element={<TrainerClientDetail />} />
      <Route path="attendance"        element={<TrainerAttendance />} />
    </Route>

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
