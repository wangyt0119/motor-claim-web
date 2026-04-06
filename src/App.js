import React from 'react';
import { ConfigProvider } from 'antd';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppSelector from './components/AppSelector';
import CustomerPortal from './components/CustomerPortal';
import OfficerPortal from './components/OfficerPortal';
import './App.css';

function App() {
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
        <Route path="/customer/*" element={<CustomerPortal />} />
        <Route path="/officer/*" element={<OfficerPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ConfigProvider>
  );
}

export default App;








