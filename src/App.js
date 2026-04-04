import React from 'react';
import { ConfigProvider } from 'antd';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppSelector from './components/AppSelector';
import MainScreen from './components/MainScreen';
import ClaimOfficerDashboard from './components/ClaimOfficerDashboard';
import './App.css';

function App() {
  // Global sign out function
  const handleSignOut = () => {
    // Force navigation to root
    window.location.href = '/';
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FF6600', // Etiqa orange
          fontFamily: 'Montserrat, sans-serif',
        },
      }}
    >
      <Routes>
        <Route path="/" element={<AppSelector />} />
        <Route path="/customer/*" element={<MainScreen onSignOut={handleSignOut} />} />
        <Route path="/officer/*" element={<ClaimOfficerDashboard onSignOut={handleSignOut} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ConfigProvider>
  );
}

export default App;








