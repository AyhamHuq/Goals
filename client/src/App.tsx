import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserSelectScreen from './components/UserSelectScreen';
import Layout from './components/Layout';
import PersonalDashboard from './components/dashboard/PersonalDashboard';
import GroupDashboard from './components/dashboard/GroupDashboard';
import HistoryView from './components/history/HistoryView';
import { useUserContext } from './context/UserContext';

function RequireUser({ children }: { children: React.ReactNode }) {
  const { selectedUser, usersLoading } = useUserContext();
  if (usersLoading) return null;
  if (!selectedUser) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
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

export default App;
