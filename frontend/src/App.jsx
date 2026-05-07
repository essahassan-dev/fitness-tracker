import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/Layout/AppLayout';
import AdminLayout from './components/Layout/AdminLayout';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Pages — App
import Login          from './pages/Auth/Login';
import Register       from './pages/Auth/Register';
import Dashboard      from './pages/Dashboard/Dashboard';
import Workouts       from './pages/Workouts/Workouts';
import Nutrition      from './pages/Nutrition/Nutrition';
import Progress       from './pages/Progress/Progress';
import Analytics      from './pages/Analytics/Analytics';
import Profile        from './pages/Profile/Profile';

// Pages — Admin
import AdminDashboard   from './pages/Admin/AdminDashboard';
import AdminUsers       from './pages/Admin/AdminUsers';
import AdminUserProfile from './pages/Admin/AdminUserProfile';

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

// Strict admin guard — checks both auth AND role from server-fetched user
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // user.role comes from server via getMe — not from localStorage
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

// ── Routes ─────────────────────────────────────────────────────────────────────

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

    {/* App — protected */}
    <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard"  element={<Dashboard />} />
      <Route path="workouts"   element={<Workouts />} />
      <Route path="nutrition"  element={<Nutrition />} />
      <Route path="progress"   element={<Progress />} />
      <Route path="analytics"  element={<Analytics />} />
      <Route path="profile"    element={<Profile />} />
    </Route>

    {/* Admin — each route individually guarded so URL-hacking is blocked */}
    <Route
      path="/admin"
      element={
        <AdminRoute>
          <AdminLayout />
        </AdminRoute>
      }
    >
      <Route index        element={<AdminDashboard />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="users/:id" element={<AdminUserProfile />} />
    </Route>

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

// ── App ────────────────────────────────────────────────────────────────────────

const App = () => (
  <BrowserRouter>
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
            success: { iconTheme: { primary: '#22c55e', secondary: '#0f172a' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#0f172a' } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
