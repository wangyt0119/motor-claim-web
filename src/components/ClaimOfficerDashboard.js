
import React, { useEffect, useMemo, useState } from 'react';
import { Layout, Avatar, Typography, Badge, Button, Row, Col, Card, Statistic, message } from 'antd';
import { 
  DashboardOutlined, 
  FlagOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  SecurityScanOutlined,
  AreaChartOutlined,
  UnorderedListOutlined,
  RadarChartOutlined,
  NotificationOutlined,
  DollarOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../styles/OfficerDashboard.css';
import { getAllClaims } from '../services/claimService';
import { getAllCoverages } from '../services/coverageService';

// Import all required components
import ManualReviewQueue from './ManualReviewQueue';
import PendingClaimsScreen from './PendingClaimsScreen';
import ApprovedClaimsScreen from './ApprovedClaimsScreen';
import SuspiciousClaimsReview from './SuspiciousClaimsReview';
import ReportsScreen from './ReportsScreen';
import TrackValidationProcess from './TrackValidationProcess';
import NotificationAuditScreen from './NotificationAuditScreen';
import PaymentMonitoringDashboard from './PaymentMonitoringDashboard';
import AllClaimsOfficerScreen from './AllClaimsOfficerScreen';
import ProfileScreen from './ProfileScreen';

const { Sider, Content, Header } = Layout;
const { Title, Text } = Typography;

function ClaimOfficerDashboard({ currentOfficer, onSignOut }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [claims, setClaims] = useState([]);
  const [coverages, setCoverages] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.pathname === '/officer' || window.location.pathname === '/officer/') {
      navigate('/officer/dashboard', { replace: true });
    }
  }, [navigate]);

  const refreshClaims = async () => {
    setLoadingClaims(true);
    try {
      const [claimResult, coverageResult] = await Promise.all([
        getAllClaims(),
        getAllCoverages(),
      ]);
      const coverageById = new Map(coverageResult.map((coverage) => [coverage.coverageId, coverage]));
      const claimsWithCoverage = claimResult.map((claim) => ({
        ...claim,
        coverage: claim.coverage || coverageById.get(claim.coverageId) || null,
      }));

      setCoverages(coverageResult);
      setClaims(claimsWithCoverage);
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.title ||
          'Unable to load dashboard claims.'
      );
    } finally {
      setLoadingClaims(false);
    }
  };

  useEffect(() => {
    refreshClaims();
  }, []);

  const totalClaims = claims.length;
  const totalCoverages = coverages.length;
  const pendingClaims = useMemo(
    () => claims.filter((claim) => ['Pending Manual Review', 'Pending Customer Action', 'Customer Responded'].includes(claim.status)),
    [claims]
  );
  const approvedClaims = useMemo(() => claims.filter((claim) => claim.status === 'Approved'), [claims]);
  const suspiciousClaims = useMemo(() => {
    return claims.filter((claim) => {
      const reasons = claim.validationResult?.reasons || [];
      return reasons.some((reason) =>
        /ocr failed|confidence is too low|missing|does not match/i.test(reason)
      );
    });
  }, [claims]);

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
        Welcome back, {currentOfficer?.fullName || currentOfficer?.FullName || 'Sarah Johnson'}
      </Text>
      
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Claims Pending Review"
              value={pendingClaims.length}
              valueStyle={{ color: '#FF6600' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Flagged for Manual Review"
              value={pendingClaims.length}
              valueStyle={{ color: '#E53E3E' }}
              prefix={<FlagOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Approved This Week"
              value={approvedClaims.length}
              valueStyle={{ color: '#4CAF50' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Suspicious Claims"
              value={suspiciousClaims.length}
              valueStyle={{ color: '#FF9800' }}
              prefix={<SecurityScanOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24, borderRadius: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Statistic title="Total Claims In System" value={totalClaims} />
          </Col>
          <Col xs={24} md={12}>
            <Statistic title="Total Coverages In System" value={totalCoverages} />
          </Col>
        </Row>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (selectedIndex) {
      case 0:
        return buildDashboardView();
      case 1:
        return <ManualReviewQueue claims={claims} loading={loadingClaims} onClaimsChanged={refreshClaims} />;
      case 2:
        return <PendingClaimsScreen claims={claims} loading={loadingClaims} onClaimsChanged={refreshClaims} />;
      case 3:
        return <ApprovedClaimsScreen claims={claims} loading={loadingClaims} onClaimsChanged={refreshClaims} />;
      case 4:
        return <SuspiciousClaimsReview />;
      case 5:
        return <AllClaimsOfficerScreen claims={claims} loading={loadingClaims} onRefresh={refreshClaims} onClaimsChanged={refreshClaims} />;
      case 6:
        return <ReportsScreen />;
      case 7:
        return <TrackValidationProcess />;
      case 8:
        return <NotificationAuditScreen />;
      case 9:
        return <PaymentMonitoringDashboard />;
      case 10:
        return (
          <ProfileScreen
            heading="Officer Profile"
            description="Review your officer or admin account details."
          />
        );
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
              {currentOfficer?.fullName || currentOfficer?.FullName || 'Sarah Johnson'}
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
            icon: <UnorderedListOutlined />,
            title: 'All Claims',
            subtitle: 'View all submitted claims',
            index: 5,
            isSelected: selectedIndex === 5
          })}

          {buildOfficerNavItem({
            icon: <AreaChartOutlined />,
            title: 'Reports',
            subtitle: 'Analytics & statistics',
            index: 6,
            isSelected: selectedIndex === 6
          })}
          
          {buildOfficerNavItem({
            icon: <RadarChartOutlined />,
            title: 'Track Validation',
            subtitle: 'Monitor validation process',
            index: 7,
            isSelected: selectedIndex === 7
          })}
          
          {buildOfficerNavItem({
            icon: <NotificationOutlined />,
            title: 'Notification Audit',
            subtitle: 'System alerts & logs',
            index: 8,
            isSelected: selectedIndex === 8
          })}
          
          {buildOfficerNavItem({
            icon: <DollarOutlined />,
            title: 'Payment Monitoring',
            subtitle: 'Track claim payments',
            index: 9,
            isSelected: selectedIndex === 9
          })}

          {buildOfficerNavItem({
            icon: <UserOutlined />,
            title: 'Profile',
            subtitle: 'View your account details',
            index: 10,
            isSelected: selectedIndex === 10
          })}
        </div>
        
        <div style={{ 
          padding: '16px', 
          borderTop: '1px solid #f0f0f0',
        }}>
          <Button 
            icon={<LogoutOutlined />} 
            block
            onClick={() => {
              if (onSignOut) {
                onSignOut();
              } else {
                navigate('/');
              }
            }}
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














