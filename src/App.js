import React from 'react';
import { ConfigProvider } from 'antd';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppSelector from './components/AppSelector';
import AdminPortal from './components/AdminPortal';
import CustomerPortal from './components/CustomerPortal';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import OfficerPortal from './components/OfficerPortal';
import PanelWorkshopPortal from './components/PanelWorkshopPortal';
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
        <Route path="/reset-password" element={<ResetPasswordScreen />} />
        <Route path="/customer/*" element={<CustomerPortal />} />
        <Route path="/officer/*" element={<OfficerPortal />} />
        <Route path="/admin/*" element={<AdminPortal />} />
        <Route path="/panel-workshop/*" element={<PanelWorkshopPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ConfigProvider>
  );
}

export default App;








