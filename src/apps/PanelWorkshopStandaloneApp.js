import React from 'react';
import { ConfigProvider } from 'antd';
import { Navigate, Route, Routes } from 'react-router-dom';
import PanelWorkshopPortal from '../components/PanelWorkshopPortal';

function PanelWorkshopStandaloneApp() {
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
        <Route path="/*" element={<PanelWorkshopPortal />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </ConfigProvider>
  );
}

export default PanelWorkshopStandaloneApp;
