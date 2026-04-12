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

function PanelWorkshopPortal() {
  const [session, setSession] = useState(() => getPanelWorkshopSession());

  const isAuthenticated = useMemo(() => {
    const role = normalizeRole(session?.user?.role ?? session?.user?.Role);
    return Boolean(session?.token) && role === USER_ROLE.PanelWorkshop;
  }, [session]);

  const handleAuthenticated = (newSession) => {
    savePanelWorkshopSession(newSession);
    setSession(newSession);
    window.location.replace('/panel-workshop');
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
        element={<Navigate to={isAuthenticated ? '/panel-workshop/dashboard' : '/panel-workshop/auth'} replace />}
      />
      <Route
        path="auth"
        element={
          isAuthenticated ? <Navigate to="/panel-workshop/dashboard" replace /> : <PanelWorkshopAuthScreen onAuthenticated={handleAuthenticated} />
        }
      />
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <PanelWorkshopDashboard currentUser={session?.user} onSignOut={handleSignOut} />
          ) : (
            <Navigate to="/panel-workshop/auth" replace />
          )
        }
      />
    </Routes>
  );
}

export default PanelWorkshopPortal;
