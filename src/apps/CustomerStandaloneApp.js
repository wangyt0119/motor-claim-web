import React from 'react';
import { ConfigProvider } from 'antd';
import { Navigate, Route, Routes } from 'react-router-dom';
import CustomerPortal from '../components/CustomerPortal';

function CustomerStandaloneApp() {
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
        <Route path="/*" element={<CustomerPortal />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </ConfigProvider>
  );
}

export default CustomerStandaloneApp;
