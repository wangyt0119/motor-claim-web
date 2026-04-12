import React, { useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AuthScreen from './AuthScreen';
import MainScreen from './MainScreen';
import { clearCustomerSession, getCustomerSession, saveCustomerSession } from '../utils/authStorage';
import { USER_ROLE, normalizeRole } from '../constants/userRoles';

function CustomerPortal() {
  const [session, setSession] = useState(() => getCustomerSession());

  const isAuthenticated = useMemo(() => {
    const role = normalizeRole(session?.user?.role ?? session?.user?.Role);
    return Boolean(session?.token) && role === USER_ROLE.Customer;
  }, [session]);

  const handleAuthenticated = (newSession) => {
    saveCustomerSession(newSession);
    setSession(newSession);
    window.location.replace('/customer/dashboard');
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
        element={<Navigate to={isAuthenticated ? '/customer/dashboard' : '/customer/auth'} replace />}
      />
      <Route
        path="auth"
        element={
          isAuthenticated ? (
            <Navigate to="/customer/dashboard" replace />
          ) : (
            <AuthScreen onAuthenticated={handleAuthenticated} />
          )
        }
      />
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <MainScreen onSignOut={handleSignOut} currentUser={session?.user} />
          ) : (
            <Navigate to="/customer/auth" replace />
          )
        }
      />
    </Routes>
  );
}

export default CustomerPortal;
