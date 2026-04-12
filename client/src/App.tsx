import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserSelectScreen from './components/UserSelectScreen';
import Layout from './components/Layout';
import PersonalDashboard from './components/dashboard/PersonalDashboard';
import GroupDashboard from './components/dashboard/GroupDashboard';
import HistoryView from './components/history/HistoryView';
import { useUserContext } from './context/UserContext';
import { CircularProgress, Box } from '@mui/material';

// Admin pages (lazy-loaded, only bundled when accessed)
const AdminAuthGate = lazy(() => import('./components/admin/AdminAuthGate'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminOverview = lazy(() => import('./components/admin/AdminOverview'));
const AdminUsers = lazy(() => import('./components/admin/AdminUsers'));
const AdminUserDetail = lazy(() => import('./components/admin/AdminUserDetail'));
const AdminGoalDetail = lazy(() => import('./components/admin/AdminGoalDetail'));
const AdminEngagement = lazy(() => import('./components/admin/AdminEngagement'));
const AdminNotifications = lazy(() => import('./components/admin/AdminNotifications'));
const AdminExport = lazy(() => import('./components/admin/AdminExport'));

const isAdminSubdomain = window.location.hostname.startsWith('admin.');

function AdminApp() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminAuthGate>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<AdminOverview />} />
            <Route path="/users" element={<AdminUsers />} />
            <Route path="/users/:id" element={<AdminUserDetail />} />
            <Route path="/goals/:id" element={<AdminGoalDetail />} />
            <Route path="/engagement" element={<AdminEngagement />} />
            <Route path="/notifications" element={<AdminNotifications />} />
            <Route path="/export" element={<AdminExport />} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Route>
        </Routes>
      </AdminAuthGate>
    </Suspense>
  );
}

function RequireUser({ children }: { children: React.ReactNode }) {
  const { selectedUser, usersLoading } = useUserContext();
  if (usersLoading) return null;
  if (!selectedUser) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function MainApp() {
  return (
    <Routes>
      <Route path="/" element={<UserSelectScreen />} />
      <Route
        element={
          <RequireUser>
            <Layout />
          </RequireUser>
        }
      >
        <Route path="/dashboard" element={<PersonalDashboard />} />
        <Route path="/group" element={<GroupDashboard />} />
        <Route path="/history" element={<HistoryView />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function PageLoader() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <CircularProgress />
    </Box>
  );
}

function App() {
  return isAdminSubdomain ? <AdminApp /> : <MainApp />;
}

export default App;
