import React, { useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Typography, Divider, Button, message } from 'antd';
import { 
  AppstoreOutlined,
  PlusCircleOutlined, 
  LineChartOutlined, 
  HistoryOutlined, 
  BellOutlined, 
  QuestionCircleOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
  LogoutOutlined,
  UserOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import SubmitClaimScreen from './SubmitClaimScreen';
import CustomerClaimTracker from './CustomerClaimTracker';
import ClaimHistoryScreen from './ClaimHistoryScreen';
import CustomerNotificationScreen from './CustomerNotificationScreen';
import PanelWorkshopListScreen from './PanelWorkshopListScreen';
import CustomerDashboardScreen from './CustomerDashboardScreen';
import ProfileScreen from './ProfileScreen';
import '../styles/MainScreen.css';
import { getMyClaims } from '../services/claimService';
import { getMyCoverages } from '../services/coverageService';
import { getPortalPath, PORTAL_KEYS } from '../config/portalRoutes';

const { Sider, Content } = Layout;
const { Text } = Typography;

function MainScreen({ onSignOut, currentUser }) {
  const [claims, setClaims] = useState([]);
  const [coverages, setCoverages] = useState([]);
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const routeKey = location.pathname.split('/')[2] || 'dashboard';
    setSelectedKey(routeKey);
  }, [location.pathname]);

  const refreshClaims = async () => {
    try {
      const [claimList, coverageList] = await Promise.all([getMyClaims(), getMyCoverages()]);
      const coverageById = new Map(
        coverageList.map((coverage) => [coverage.coverageId, coverage])
      );
      setCoverages(coverageList);

      setClaims(
        claimList.map((claim) => {
          const relatedCoverage = coverageById.get(claim.coverageId);

          return {
            ...claim,
            vehicleRegistration: relatedCoverage?.vehicleNo || claim.vehicleRegistration,
            vehicleModel: relatedCoverage?.coverageType || claim.vehicleModel,
            relatedCoverage: relatedCoverage || null,
          };
        })
      );
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.title ||
          'Unable to load your claims from the backend.'
      );
    }
  };

  useEffect(() => {
    refreshClaims();
  }, []);

  const handleMenuClick = (key) => {
    setSelectedKey(key);
    navigate(getPortalPath(PORTAL_KEYS.CUSTOMER, `/${key}`));
  };

  const addNewClaim = (newClaim) => {
    setClaims((previousClaims) => [newClaim, ...previousClaims]);
    setSelectedKey('track');
    navigate(getPortalPath(PORTAL_KEYS.CUSTOMER, '/track'));
  };

  const handleSignOutClick = () => {
    if (onSignOut) {
      onSignOut();
      return;
    }

    window.location.replace('/');
  };

  return (
    <Layout className="main-layout">
      <Sider width={280} className="main-sider">
        <div className="logo-container">
          <img 
            src={`${process.env.PUBLIC_URL}/assets/etiqalogo.png`} 
            alt="Etiqa Logo" 
            height={40} 
            onError={(e) => {
              console.error("Logo failed to load");
              e.target.src = `${process.env.PUBLIC_URL}/logo192.png`;
              e.target.onerror = null;
            }}
          />
        </div>
        
        <div className="user-info">
          <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: '#FF6600' }} />
          <div className="user-details">
            <Text strong className="user-name">{currentUser?.fullName || currentUser?.FullName || 'Customer'}</Text>
            <Text type="secondary" className="user-email">
              {currentUser?.email || currentUser?.Email || 'Signed in customer portal user'}
            </Text>
          </div>
        </div>
        
        <div className="sidebar-content">
          <Divider plain orientation="left">
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8 }}>
              MAIN MENU
            </Text>
          </Divider>
          
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            className="main-menu"
          >
            <Menu.Item
              key="dashboard"
              icon={<AppstoreOutlined />}
              onClick={() => handleMenuClick('dashboard')}
            >
              <span>Dashboard</span>
            </Menu.Item>

            <Menu.Item 
              key="submit" 
              icon={<PlusCircleOutlined />}
              onClick={() => handleMenuClick('submit')}
            >
              <span>Submit Claim</span>
            </Menu.Item>
            
            <Menu.Item 
              key="track" 
              icon={<LineChartOutlined />}
              onClick={() => handleMenuClick('track')}
            >
              <span>Track Claims</span>
            </Menu.Item>
            
            <Menu.Item 
              key="history" 
              icon={<HistoryOutlined />}
              onClick={() => handleMenuClick('history')}
            >
              <span>Claim History</span>
            </Menu.Item>
            
            <Menu.Item 
              key="notifications" 
              icon={<BellOutlined />}
              onClick={() => handleMenuClick('notifications')}
            >
              <span>Notification History</span>
            </Menu.Item>

            <Menu.Item
              key="panel-workshop"
              icon={<ToolOutlined />}
              onClick={() => handleMenuClick('panel-workshop')}
            >
              <span>Panel Workshop</span>
            </Menu.Item>

            <Menu.Item
              key="profile"
              icon={<UserOutlined />}
              onClick={() => handleMenuClick('profile')}
            >
              <span>Profile</span>
            </Menu.Item>
          </Menu>
          
          <Divider plain orientation="left">
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8 }}>
              SUPPORT
            </Text>
          </Divider>
          
          <Menu mode="inline" className="support-menu">
            <Menu.Item key="help" icon={<QuestionCircleOutlined />}>
              Help & FAQ
            </Menu.Item>
            <Menu.Item key="support" icon={<CustomerServiceOutlined />}>
              Contact Support
            </Menu.Item>
            <Menu.Item key="policy" icon={<FileTextOutlined />}>
              Policy Details
            </Menu.Item>
          </Menu>
          
          <div className="sign-out-container">
            <Button 
              className="sign-out-button"
              icon={<LogoutOutlined />} 
              block
              onClick={handleSignOutClick}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Sider>
      
      <Content className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to={getPortalPath(PORTAL_KEYS.CUSTOMER, '/dashboard')} replace />} />
          <Route
            path="dashboard"
            element={
              <CustomerDashboardScreen
                currentUser={currentUser}
                claims={claims}
                coverages={coverages}
                onOpenSection={handleMenuClick}
              />
            }
          />
          <Route path="submit" element={<SubmitClaimScreen onSubmit={addNewClaim} />} />
          <Route path="track" element={<CustomerClaimTracker claims={claims} onClaimsChanged={refreshClaims} />} />
          <Route path="history" element={<ClaimHistoryScreen claims={claims} coverages={coverages} />} />
          <Route
            path="notifications"
            element={<CustomerNotificationScreen claims={claims} currentUser={currentUser} />}
          />
          <Route path="panel-workshop" element={<PanelWorkshopListScreen />} />
          <Route
            path="profile"
            element={
              <ProfileScreen
                heading="My Profile"
                description="Review your customer account details."
              />
            }
          />
          <Route path="*" element={<Navigate to={getPortalPath(PORTAL_KEYS.CUSTOMER, '/dashboard')} replace />} />
        </Routes>
      </Content>
    </Layout>
  );
}

export default MainScreen;










