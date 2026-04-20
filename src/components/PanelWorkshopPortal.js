import React, { useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PanelWorkshopAuthScreen from './PanelWorkshopAuthScreen';
import PanelWorkshopDashboard from './PanelWorkshopDashboard';
import {
  clearPanelWorkshopSession,
  getPanelWorkshopSession,
  savePanelWorkshopSession,
} from '../utils/panelWorkshopAuthStorage';
import { USER_ROLE, normalizeRole } from '../constants/userRoles';
import { getPortalPath, PORTAL_KEYS } from '../config/portalRoutes';

function PanelWorkshopPortal() {
  const [session, setSession] = useState(() => getPanelWorkshopSession());

  const isAuthenticated = useMemo(() => {
    const role = normalizeRole(session?.user?.role ?? session?.user?.Role);
    return Boolean(session?.token) && role === USER_ROLE.PanelWorkshop;
  }, [session]);

  const handleAuthenticated = (newSession) => {
    savePanelWorkshopSession(newSession);
    setSession(newSession);
    window.location.replace(getPortalPath(PORTAL_KEYS.PANEL_WORKSHOP, '/dashboard'));
  };

  const handleSignOut = () => {
    clearPanelWorkshopSession();
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
                ? getPortalPath(PORTAL_KEYS.PANEL_WORKSHOP, '/dashboard')
                : getPortalPath(PORTAL_KEYS.PANEL_WORKSHOP, '/auth')
            }
            replace
          />
        }
      />
      <Route
        path="auth"
        element={
          isAuthenticated ? (
            <Navigate to={getPortalPath(PORTAL_KEYS.PANEL_WORKSHOP, '/dashboard')} replace />
          ) : (
            <PanelWorkshopAuthScreen onAuthenticated={handleAuthenticated} />
          )
        }
      />
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <PanelWorkshopDashboard currentUser={session?.user} onSignOut={handleSignOut} />
          ) : (
            <Navigate to={getPortalPath(PORTAL_KEYS.PANEL_WORKSHOP, '/auth')} replace />
          )
        }
      />
    </Routes>
  );
}

export default PanelWorkshopPortal;
