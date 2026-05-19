import React, { useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AuthScreen from './AuthScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import MainScreen from './MainScreen';
import ResetPasswordScreen from './ResetPasswordScreen';
import { clearCustomerSession, getCustomerSession, saveCustomerSession } from '../utils/authStorage';
import { USER_ROLE, normalizeRole } from '../constants/userRoles';
import { getPortalPath, PORTAL_KEYS } from '../config/portalRoutes';

function CustomerPortal() {
  const [session, setSession] = useState(() => getCustomerSession());

  const isAuthenticated = useMemo(() => {
    const role = normalizeRole(session?.user?.role ?? session?.user?.Role);
    return Boolean(session?.token) && role === USER_ROLE.Customer;
  }, [session]);

  const handleAuthenticated = (newSession) => {
    saveCustomerSession(newSession);
    setSession(newSession);
    window.location.replace(getPortalPath(PORTAL_KEYS.CUSTOMER, '/dashboard'));
  };

  const handleSignOut = () => {
    clearCustomerSession();
    setSession(null);
    window.location.replace('/');
  };

  return (
    <Routes>
      <Route
        index
        element={<Navigate to={getPortalPath(PORTAL_KEYS.CUSTOMER, '/auth')} replace />}
      />
      <Route path="auth" element={<AuthScreen onAuthenticated={handleAuthenticated} />} />
      <Route path="forgot-password" element={<ForgotPasswordScreen />} />
      <Route path="reset-password" element={<ResetPasswordScreen />} />
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <MainScreen onSignOut={handleSignOut} currentUser={session?.user} />
          ) : (
            <Navigate to={getPortalPath(PORTAL_KEYS.CUSTOMER, '/auth')} replace />
          )
        }
      />
    </Routes>
  );
}

export default CustomerPortal;
