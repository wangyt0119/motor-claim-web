import React, { useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminAuthScreen from './AdminAuthScreen';
import AdminDashboard from './AdminDashboard';
import { clearAdminSession, getAdminSession, saveAdminSession } from '../utils/adminAuthStorage';
import { USER_ROLE, normalizeRole } from '../constants/userRoles';

function AdminPortal() {
  const [session, setSession] = useState(() => getAdminSession());

  const isAuthenticated = useMemo(() => {
    const role = normalizeRole(session?.user?.role ?? session?.user?.Role);
    return Boolean(session?.token) && role === USER_ROLE.Admin;
  }, [session]);

  const handleAuthenticated = (newSession) => {
    saveAdminSession(newSession);
    setSession(newSession);
    window.location.replace('/admin');
  };

  const handleSignOut = () => {
    clearAdminSession();
    setSession(null);
    window.location.replace('/');
  };

  return (
    <Routes>
      <Route
        index
        element={<Navigate to={isAuthenticated ? '/admin/dashboard' : '/admin/auth'} replace />}
      />
      <Route
        path="auth"
        element={
          isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <AdminAuthScreen onAuthenticated={handleAuthenticated} />
        }
      />
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <AdminDashboard currentAdmin={session?.user} onSignOut={handleSignOut} />
          ) : (
            <Navigate to="/admin/auth" replace />
          )
        }
      />
    </Routes>
  );
}

export default AdminPortal;
