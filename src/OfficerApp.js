import React from 'react';
import { ConfigProvider } from 'antd';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ClaimOfficerDashboard from './components/ClaimOfficerDashboard';
import './OfficerApp.css';

function OfficerApp() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FF6600', // Etiqa orange
          fontFamily: 'Montserrat, sans-serif',
          borderRadius: 8,
          colorBgContainer: '#FFFFFF',
          colorText: '#333333',
          colorTextSecondary: '#6C757D',
          colorBgLayout: '#F8F9FA',
          colorBorder: '#E9ECEF',
        },
        components: {
          Button: {
            colorPrimary: '#FF6600',
            colorPrimaryHover: '#E65C00',
            borderRadius: 8,
          },
          Layout: {
            colorBgHeader: '#FFFFFF',
            headerHeight: 64,
            headerPadding: '0 24px',
          },
          Menu: {
            colorItemBg: 'transparent',
            colorItemText: '#6C757D',
            colorItemTextSelected: '#FF6600',
            colorItemBgSelected: '#FFF0E6',
            colorItemTextHover: '#FF6600',
          },
          Card: {
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          },
          Table: {
            borderRadius: 8,
            headerBg: '#F8F9FA',
          },
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<ClaimOfficerDashboard />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default OfficerApp;