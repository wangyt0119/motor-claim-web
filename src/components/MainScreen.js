import React, { useState } from 'react';
import { Layout, Menu, Avatar, Typography, Divider, Modal, Button } from 'antd';
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
  UserOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import SubmitClaimScreen from './SubmitClaimScreen';
import TrackClaimScreen from './TrackClaimScreen';
import ClaimHistoryScreen from './ClaimHistoryScreen';
import NotificationHistoryScreen from './NotificationHistoryScreen';
import ClaimPaymentsScreen from './ClaimPaymentsScreen';
import TrackValidationProcess from './TrackValidationProcess';
import '../styles/MainScreen.css';

// Import sample claim data
import { sampleClaims } from '../data/sampleData';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

function MainScreen({ onSignOut }) {
  const [claims, setClaims] = useState(sampleClaims);
  const [selectedKey, setSelectedKey] = useState('submit');
  const navigate = useNavigate();

  const handleMenuClick = (key) => {
    setSelectedKey(key);
    // Use absolute paths instead of relative paths
    navigate(`/customer/${key}`);
  };

  const addNewClaim = (newClaim) => {
    setClaims([...claims, newClaim]);
    setSelectedKey('track');
    // Use absolute path
    navigate('/customer/track');
  };

  const showSignOutDialog = () => {
    Modal.confirm({
      title: 'Sign Out',
      icon: <LogoutOutlined style={{ color: '#FF6600' }} />,
      content: 'Are you sure you want to sign out? You will be redirected to the portal selection page.',
      okText: 'Sign Out',
      cancelText: 'Cancel',
      okButtonProps: { 
        style: { backgroundColor: '#FF6600', borderColor: '#FF6600' } 
      },
      onOk: () => {
        if (onSignOut) {
          onSignOut();
        } else {
          window.location.href = '/';
        }
      },
    });
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
            <Text strong>Yuting</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>Policy: POL-78901234</Text>
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
              icon={<LogoutOutlined />} 
              block
             onClick={() => navigate('/')}
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












