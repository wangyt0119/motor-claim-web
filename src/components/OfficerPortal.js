import React, { useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ClaimOfficerDashboard from './ClaimOfficerDashboard';
import OfficerAuthScreen from './OfficerAuthScreen';
import { clearOfficerSession, getOfficerSession, saveOfficerSession } from '../utils/officerAuthStorage';
import { USER_ROLE, normalizeRole } from '../constants/userRoles';
import { getPortalPath, PORTAL_KEYS } from '../config/portalRoutes';

function OfficerPortal() {
  const [session, setSession] = useState(() => getOfficerSession());

  const isAuthenticated = useMemo(() => {
    const role = normalizeRole(session?.user?.role ?? session?.user?.Role);
    return Boolean(session?.token) && role === USER_ROLE.Officer;
  }, [session]);

  const handleAuthenticated = (newSession) => {
    saveOfficerSession(newSession);
    setSession(newSession);
    window.location.replace(getPortalPath(PORTAL_KEYS.OFFICER, '/dashboard'));
  };

  const handleSignOut = () => {
    clearOfficerSession();
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
                ? getPortalPath(PORTAL_KEYS.OFFICER, '/dashboard')
                : getPortalPath(PORTAL_KEYS.OFFICER, '/auth')
            }
            replace
          />
        }
      />
      <Route
        path="auth"
        element={
          isAuthenticated ? (
            <Navigate to={getPortalPath(PORTAL_KEYS.OFFICER, '/dashboard')} replace />
          ) : (
            <OfficerAuthScreen onAuthenticated={handleAuthenticated} />
          )
        }
      />
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <ClaimOfficerDashboard currentOfficer={session?.user} onSignOut={handleSignOut} />
          ) : (
            <Navigate to={getPortalPath(PORTAL_KEYS.OFFICER, '/auth')} replace />
          )
        }
      />
    </Routes>
  );
}

export default OfficerPortal;
