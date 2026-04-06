import React, { useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Typography, Divider, Button, message } from 'antd';
import { 
  PlusCircleOutlined, 
  LineChartOutlined, 
  HistoryOutlined, 
  BellOutlined, 
  DollarOutlined,
  QuestionCircleOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
  LogoutOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import SubmitClaimScreen from './SubmitClaimScreen';
import TrackClaimScreen from './TrackClaimScreen';
import ClaimHistoryScreen from './ClaimHistoryScreen';
import NotificationHistoryScreen from './NotificationHistoryScreen';
import ClaimPaymentsScreen from './ClaimPaymentsScreen';
import '../styles/MainScreen.css';
import { getMyClaims } from '../services/claimService';
import { getMyCoverages } from '../services/coverageService';

const { Sider, Content } = Layout;
const { Text } = Typography;

function MainScreen({ onSignOut, currentUser }) {
  const [claims, setClaims] = useState([]);
  const [selectedKey, setSelectedKey] = useState('submit');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const routeKey = location.pathname.split('/')[2] || 'submit';
    setSelectedKey(routeKey);
  }, [location.pathname]);

  useEffect(() => {
    const loadClaims = async () => {
      try {
        const [claimList, coverageList] = await Promise.all([getMyClaims(), getMyCoverages()]);
        const coverageById = new Map(
          coverageList.map((coverage) => [coverage.coverageId, coverage])
        );

        setClaims(
          claimList.map((claim) => {
            const relatedCoverage = coverageById.get(claim.coverageId);

            return {
              ...claim,
              vehicleRegistration: relatedCoverage?.vehicleNo || claim.vehicleRegistration,
              vehicleModel: relatedCoverage?.coverageType || claim.vehicleModel,
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

    loadClaims();
  }, []);

  const handleMenuClick = (key) => {
    setSelectedKey(key);
    // Use absolute paths instead of relative paths
    navigate(`/customer/${key}`);
  };

  const addNewClaim = (newClaim) => {
    setClaims((previousClaims) => [newClaim, ...previousClaims]);
    setSelectedKey('track');
    navigate('/customer/track');
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
            <Text strong>{currentUser?.fullName || currentUser?.FullName || 'Customer'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
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
              key="submit" 
              icon={<PlusCircleOutlined />}
              onClick={() => handleMenuClick('submit')}
            >
              <span>Submit Claim</span>
              <div className="menu-subtitle">File a new claim</div>
            </Menu.Item>
            
            <Menu.Item 
              key="track" 
              icon={<LineChartOutlined />}
              onClick={() => handleMenuClick('track')}
            >
              <span>Track Claims</span>
              <div className="menu-subtitle">Monitor active claims</div>
            </Menu.Item>
            
            <Menu.Item 
              key="history" 
              icon={<HistoryOutlined />}
              onClick={() => handleMenuClick('history')}
            >
              <span>Claim History</span>
              <div className="menu-subtitle">View past claims</div>
            </Menu.Item>
            
            <Menu.Item 
              key="notifications" 
              icon={<BellOutlined />}
              onClick={() => handleMenuClick('notifications')}
            >
              <span>Notification History</span>
              <div className="menu-subtitle">View sent notifications</div>
            </Menu.Item>
            
            <Menu.Item 
              key="payments" 
              icon={<DollarOutlined />}
              onClick={() => handleMenuClick('payments')}
            >
              <span>My Claim Payments</span>
              <div className="menu-subtitle">Track payment status</div>
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
          <Route path="/" element={<Navigate to="/customer/submit" replace />} />
          <Route path="submit" element={<SubmitClaimScreen onSubmit={addNewClaim} />} />
          <Route path="track" element={<TrackClaimScreen claims={claims} />} />
          <Route path="history" element={<ClaimHistoryScreen claims={claims} />} />
          <Route path="notifications" element={<NotificationHistoryScreen />} />
          <Route path="payments" element={<ClaimPaymentsScreen claims={claims} />} />
          <Route path="*" element={<Navigate to="/customer/submit" replace />} />
        </Routes>
      </Content>
    </Layout>
  );
}

export default MainScreen;












