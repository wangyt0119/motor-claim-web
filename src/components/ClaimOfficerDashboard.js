
import React, { useState } from 'react';
import { Layout, Menu, Avatar, Typography, Divider, Badge, Button, Row, Col, Card, Statistic } from 'antd';
import { 
  DashboardOutlined, 
  FlagOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  SecurityScanOutlined,
  AreaChartOutlined,
  RadarChartOutlined,
  NotificationOutlined,
  DollarOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined
} from '@ant-design/icons';
import { Routes, Route, useNavigate } from 'react-router-dom';
import '../styles/OfficerDashboard.css';

// Import all required components
import ManualReviewQueue from './ManualReviewQueue';
import PendingClaimsScreen from './PendingClaimsScreen';
import ApprovedClaimsScreen from './ApprovedClaimsScreen';
import SuspiciousClaimsReview from './SuspiciousClaimsReview';
import ReportsScreen from './ReportsScreen';
import TrackValidationProcess from './TrackValidationProcess';
import NotificationAuditScreen from './NotificationAuditScreen';
import PaymentMonitoringDashboard from './PaymentMonitoringDashboard';

const { Sider, Content, Header } = Layout;
const { Title, Text } = Typography;

function ClaimOfficerDashboard() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  
  // Sample pending claims data
  const pendingClaims = [
    {
      id: 'CLM004',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      type: 'Vehicle Collision',
      status: 'Pending Review',
      location: 'Johor Bahru',
      vehicleModel: 'Perodua Myvi 2018',
      vehicleRegistration: 'JHR 1234',
      claimAmount: 5600.00,
      policyNumber: 'POL-12345678',
    },
    {
      id: 'CLM005',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      type: 'Windshield Damage',
      status: 'Pending Review',
      location: 'Penang',
      vehicleModel: 'Nissan X-Trail 2020',
      vehicleRegistration: 'PJY 5678',
      claimAmount: 1200.00,
      policyNumber: 'POL-23456789',
    },
    {
      id: 'CLM006',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      type: 'Flood Damage',
      status: 'Pending Review',
      location: 'Kuala Lumpur',
      vehicleModel: 'Honda CR-V 2019',
      vehicleRegistration: 'WXC 9012',
      claimAmount: 8900.00,
      policyNumber: 'POL-34567890',
    },
  ];

  const buildOfficerNavItem = ({ icon, title, subtitle, index, isSelected }) => (
    <div 
      className={`officer-nav-item ${isSelected ? 'selected' : ''}`}
      onClick={() => {
        setSelectedIndex(index);
        // In a real app, you might want to navigate to a specific route
        // navigate(`/officer/${title.toLowerCase().replace(' ', '-')}`);
      }}
    >
      <div className="officer-nav-icon">
        {icon}
      </div>
      <div className="officer-nav-text">
        <div className="officer-nav-title">{title}</div>
        <div className="officer-nav-subtitle">{subtitle}</div>
      </div>
    </div>
  );

  const buildDashboardView = () => (
    <div style={{ padding: 24 }}>
      <Title level={2}>Officer Dashboard</Title>
      <Text type="secondary" style={{ fontSize: 16 }}>
        Welcome back, Sarah Johnson
      </Text>
      
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Claims Pending Review"
              value={12}
              valueStyle={{ color: '#FF6600' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Flagged for Manual Review"
              value={3}
              valueStyle={{ color: '#E53E3E' }}
              prefix={<FlagOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Approved This Week"
              value={28}
              valueStyle={{ color: '#4CAF50' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Suspicious Claims"
              value={5}
              valueStyle={{ color: '#FF9800' }}
              prefix={<SecurityScanOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      {/* Additional dashboard content would go here */}
    </div>
  );

  const renderContent = () => {
    switch (selectedIndex) {
      case 0:
        return buildDashboardView();
      case 1:
        return <ManualReviewQueue />;
      case 2:
        return <PendingClaimsScreen pendingClaims={pendingClaims} />;
      case 3:
        return <ApprovedClaimsScreen />;
      case 4:
        return <SuspiciousClaimsReview />;
      case 5:
        return <ReportsScreen />;
      case 6:
        return <TrackValidationProcess />;
      case 7:
        return <NotificationAuditScreen />;
      case 8:
        return <PaymentMonitoringDashboard />;
      default:
        return (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <Title level={3}>Coming Soon</Title>
            <Text type="secondary">This feature is under development</Text>
          </div>
        );
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={280} theme="light" style={{ 
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
      }}>
        <div style={{ 
          padding: '24px 16px', 
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center'
        }}>
          <img 
            src="/assets/etiqalogo.png" 
            alt="Etiqa Logo" 
            style={{ height: 40 }}
          />
        </div>
        
        <div style={{ 
          padding: '16px', 
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: '#FF6600' }} />
          <div style={{ marginLeft: 12 }}>
            <Text strong style={{ display: 'block' }}>
              Sarah Johnson
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Claims Officer
            </Text>
          </div>
        </div>
        
        <div style={{ 
          flex: 1, 
          padding: '0 16px', 
          display: 'flex', 
          flexDirection: 'column',
          overflowY: 'auto'
        }}>
          <div style={{ marginBottom: 8, marginTop: 16 }}>
            <Text type="secondary" style={{ 
              fontSize: 11, 
              fontWeight: 600, 
              letterSpacing: 0.8,
              paddingLeft: 16,
            }}>
              MAIN MENU
            </Text>
          </div>
          
          {buildOfficerNavItem({
            icon: <DashboardOutlined />,
            title: 'Dashboard',
            subtitle: 'Overview & statistics',
            index: 0,
            isSelected: selectedIndex === 0
          })}
          
          {buildOfficerNavItem({
            icon: <FlagOutlined />,
            title: 'Manual Review',
            subtitle: 'Review flagged claims',
            index: 1,
            isSelected: selectedIndex === 1
          })}
          
          {buildOfficerNavItem({
            icon: <ClockCircleOutlined />,
            title: 'Pending Claims',
            subtitle: 'Process new submissions',
            index: 2,
            isSelected: selectedIndex === 2
          })}
          
          {buildOfficerNavItem({
            icon: <CheckCircleOutlined />,
            title: 'Approved Claims',
            subtitle: 'View approved claims',
            index: 3,
            isSelected: selectedIndex === 3
          })}
          
          {buildOfficerNavItem({
            icon: <SecurityScanOutlined />,
            title: 'Suspicious Claims',
            subtitle: 'Fraud detection & review',
            index: 4,
            isSelected: selectedIndex === 4
          })}
          
          <div style={{ marginTop: 16, marginBottom: 8 }}>
            <Text type="secondary" style={{ 
              fontSize: 11, 
              fontWeight: 600, 
              letterSpacing: 0.8,
              paddingLeft: 16,
            }}>
              TOOLS & REPORTS
            </Text>
          </div>
          
          {buildOfficerNavItem({
            icon: <AreaChartOutlined />,
            title: 'Reports',
            subtitle: 'Analytics & statistics',
            index: 5,
            isSelected: selectedIndex === 5
          })}
          
          {buildOfficerNavItem({
            icon: <RadarChartOutlined />,
            title: 'Track Validation',
            subtitle: 'Monitor validation process',
            index: 6,
            isSelected: selectedIndex === 6
          })}
          
          {buildOfficerNavItem({
            icon: <NotificationOutlined />,
            title: 'Notification Audit',
            subtitle: 'System alerts & logs',
            index: 7,
            isSelected: selectedIndex === 7
          })}
          
          {buildOfficerNavItem({
            icon: <DollarOutlined />,
            title: 'Payment Monitoring',
            subtitle: 'Track claim payments',
            index: 8,
            isSelected: selectedIndex === 8
          })}
        </div>
        
        <div style={{ 
          padding: '16px', 
          borderTop: '1px solid #f0f0f0',
        }}>
          <Button 
            icon={<LogoutOutlined />} 
            block
            onClick={() => navigate('/')}
          >
            Sign Out
          </Button>
        </div>
      </Sider>
      
      <Layout style={{ marginLeft: 280 }}>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
          zIndex: 1,
          height: 64
        }}>
          <Badge count={3} style={{ backgroundColor: '#FF6600' }}>
            <Button 
              icon={<BellOutlined />} 
              style={{ border: 'none', background: 'transparent' }}
              size="large"
            />
          </Badge>
        </Header>
        
        <Content style={{ margin: '24px', background: '#fff', minHeight: 280 }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default ClaimOfficerDashboard;














