import React, { useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminAuthScreen from './AdminAuthScreen';
import AdminDashboard from './AdminDashboard';
import { clearAdminSession, getAdminSession, saveAdminSession } from '../utils/adminAuthStorage';
import { USER_ROLE, normalizeRole } from '../constants/userRoles';
import { getPortalPath, PORTAL_KEYS } from '../config/portalRoutes';

function AdminPortal() {
  const [session, setSession] = useState(() => getAdminSession());

  const isAuthenticated = useMemo(() => {
    const role = normalizeRole(session?.user?.role ?? session?.user?.Role);
    return Boolean(session?.token) && role === USER_ROLE.Admin;
  }, [session]);

  const handleAuthenticated = (newSession) => {
    saveAdminSession(newSession);
    setSession(newSession);
    window.location.replace(getPortalPath(PORTAL_KEYS.ADMIN, '/dashboard'));
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
        element={
          <Navigate
            to={
              isAuthenticated
                ? getPortalPath(PORTAL_KEYS.ADMIN, '/dashboard')
                : getPortalPath(PORTAL_KEYS.ADMIN, '/auth')
            }
            replace
          />
        }
      />
      <Route
        path="auth"
        element={
          isAuthenticated ? (
            <Navigate to={getPortalPath(PORTAL_KEYS.ADMIN, '/dashboard')} replace />
          ) : (
            <AdminAuthScreen onAuthenticated={handleAuthenticated} />
          )
        }
      />
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <AdminDashboard currentAdmin={session?.user} onSignOut={handleSignOut} />
          ) : (
            <Navigate to={getPortalPath(PORTAL_KEYS.ADMIN, '/auth')} replace />
          )
        }
      />
    </Routes>
  );
}

export default AdminPortal;
