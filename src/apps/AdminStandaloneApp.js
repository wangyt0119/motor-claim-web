import React from 'react';
import { ConfigProvider } from 'antd';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminPortal from '../components/AdminPortal';

function AdminStandaloneApp() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FF6600',
          fontFamily: 'Montserrat, sans-serif',
        },
      }}
    >
      <Routes>
        <Route path="/*" element={<AdminPortal />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </ConfigProvider>
  );
}

export default AdminStandaloneApp;
