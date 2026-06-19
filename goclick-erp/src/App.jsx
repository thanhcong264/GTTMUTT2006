import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AttendancePage from './pages/AttendancePage';
import AffiliatePage from './pages/AffiliatePage';
import WorkflowPage from './pages/WorkflowPage';
import ReportsPage from './pages/ReportsPage';
import IntegrationPage from './pages/IntegrationPage';

function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      <Route path="/dashboard" element={
        <PrivateRoute><DashboardPage /></PrivateRoute>
      } />

      <Route path="/attendance" element={
        <PrivateRoute allowedRoles={['hr', 'affiliate_manager', 'employee']}>
          <AttendancePage />
        </PrivateRoute>
      } />

      <Route path="/affiliates" element={
        <PrivateRoute allowedRoles={['affiliate_manager', 'accountant']}>
          <AffiliatePage />
        </PrivateRoute>
      } />
      <Route path="/affiliates/commission" element={
        <PrivateRoute allowedRoles={['affiliate_manager', 'accountant']}>
          <AffiliatePage />
        </PrivateRoute>
      } />

      <Route path="/workflow" element={
        <PrivateRoute><WorkflowPage /></PrivateRoute>
      } />

      <Route path="/reports" element={
        <PrivateRoute><ReportsPage /></PrivateRoute>
      } />

      <Route path="/integration" element={
        <PrivateRoute allowedRoles={['admin']}>
          <IntegrationPage />
        </PrivateRoute>
      } />

      {/* Fallback routes */}
      <Route path="/employees" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/payouts" element={<PrivateRoute><WorkflowPage /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><IntegrationPage /></PrivateRoute>} />
      <Route path="/settings/rbac" element={<PrivateRoute><IntegrationPage /></PrivateRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
