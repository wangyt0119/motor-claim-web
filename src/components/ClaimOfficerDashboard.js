
import React, { useEffect, useMemo, useState } from 'react';
import { Layout, Avatar, Typography, Badge, Button, Row, Col, Card, Divider, Menu, message } from 'antd';
import { 
  DashboardOutlined, 
  FlagOutlined, 
  ClockCircleOutlined, 
  SecurityScanOutlined,
  AreaChartOutlined,
  UnorderedListOutlined,
  RadarChartOutlined,
  NotificationOutlined,
  DollarOutlined,
  LogoutOutlined,
  UserOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../styles/OfficerDashboard.css';
import '../styles/MainScreen.css';
import { getAllClaims } from '../services/claimService';
import { getAllCoverages } from '../services/coverageService';

// Import all required components
import ManualReviewQueue from './ManualReviewQueue';
import SuspiciousClaimsReviewScreen from './SuspiciousClaimsReviewScreen';
import ReportsScreen from './ReportsScreen';
import TrackValidationProcess from './TrackValidationProcess';
import OfficerNotificationAuditScreen from './OfficerNotificationAuditScreen';
import WorkshopPaymentsScreen from './WorkshopPaymentsScreen';
import AllClaimsOfficerScreen from './AllClaimsOfficerScreen';
import WorkshopSubmissionsOfficerScreen from './WorkshopSubmissionsOfficerScreen';
import { getPortalBasePath, getPortalPath, PORTAL_KEYS } from '../config/portalRoutes';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

function ClaimOfficerDashboard({ currentOfficer, onSignOut }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [claims, setClaims] = useState([]);
  const [coverages, setCoverages] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const officerBasePath = getPortalBasePath(PORTAL_KEYS.OFFICER) || '/';
    const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';

    if (normalizedPath === officerBasePath.replace(/\/+$/, '') || normalizedPath === '/') {
      navigate(getPortalPath(PORTAL_KEYS.OFFICER, '/dashboard'), { replace: true });
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
    return claims.filter((claim) =>
      claim.isFlaggedForManualReview &&
      /another submitted claim within the last|last 30 days|same coverage/i.test(
        claim.manualReviewFlagReason || ''
      )
    );
  }, [claims]);
  const workshopSubmissions = useMemo(
    () => claims.filter((claim) => claim.workshopRepairEstimate),
    [claims]
  );
  const recentClaims = useMemo(
    () =>
      [...claims]
        .sort((left, right) => new Date(right.createdAt || right.date || 0) - new Date(left.createdAt || left.date || 0))
        .slice(0, 5),
    [claims]
  );
  const approvedAmount = useMemo(
    () =>
      approvedClaims.reduce((sum, claim) => {
        const claimAmount = Number(claim.claimAmount || 0);
        const workshopAmount = Number(claim.workshopRepairEstimate?.totalAmount || 0);
        return sum + (claimAmount > 0 ? claimAmount : workshopAmount);
      }, 0),
    [approvedClaims]
  );

  const buildDashboardView = () => (
    <div className="portal-dashboard-stack">
      <div className="portal-dashboard-hero portal-dashboard-theme-soft">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} lg={15}>
            <Text className="portal-dashboard-kicker portal-dashboard-kicker-soft" style={{ marginBottom: 12 }}>
              Claims Command Center
            </Text>
            <Title level={2} className="portal-dashboard-title">
              Welcome back, {currentOfficer?.fullName || currentOfficer?.FullName || 'Officer'}
            </Title>
            <Text className="portal-dashboard-description">
              Keep track of reviews, approvals, suspicious cases, and workshop activity in one live officer dashboard.
            </Text>
            <Row gutter={[12, 12]} style={{ marginTop: 22 }}>
              <Col xs={12} sm={8}>
                <div className="portal-dashboard-chip portal-dashboard-chip-soft" style={{ borderRadius: 18, padding: 16 }}>
                  <Text style={{ color: '#7c5a46', display: 'block', marginBottom: 4 }}>Pending Queue</Text>
                  <Title level={3} style={{ color: '#111827', margin: 0 }}>{pendingClaims.length}</Title>
                </div>
              </Col>
              <Col xs={12} sm={8}>
                <div className="portal-dashboard-chip portal-dashboard-chip-soft" style={{ borderRadius: 18, padding: 16 }}>
                  <Text style={{ color: '#7c5a46', display: 'block', marginBottom: 4 }}>Approved Claims</Text>
                  <Title level={3} style={{ color: '#111827', margin: 0 }}>{approvedClaims.length}</Title>
                </div>
              </Col>
              <Col xs={12} sm={8}>
                <div className="portal-dashboard-chip portal-dashboard-chip-soft" style={{ borderRadius: 18, padding: 16 }}>
                  <Text style={{ color: '#7c5a46', display: 'block', marginBottom: 4 }}>Approved Value</Text>
                  <Title level={3} style={{ color: '#111827', margin: 0 }}>
                    RM {approvedAmount.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Title>
                </div>
              </Col>
            </Row>
          </Col>
          <Col xs={24} lg={9}>
            <Card
              bordered={false}
              style={{ borderRadius: 24, background: '#fffaf5', border: '1px solid #f3d2b7' }}
              bodyStyle={{ padding: 22 }}
            >
              <Text strong style={{ fontSize: 16, color: '#0f172a' }}>Today’s Focus</Text>
              <div style={{ marginTop: 18, display: 'grid', gap: 14 }}>
                {[
                  { label: 'Manual review queue', value: pendingClaims.length, tone: '#f97316' },
                  { label: 'Suspicious signals', value: suspiciousClaims.length, tone: '#ef4444' },
                  { label: 'Workshop submissions', value: workshopSubmissions.length, tone: '#16a34a' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 16, background: '#fff7ed', border: '1px solid #f3d2b7' }}>
                    <Text style={{ color: '#334155' }}>{item.label}</Text>
                    <Text strong style={{ color: item.tone, fontSize: 18 }}>{item.value}</Text>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          {buildDashboardMetricCard({
            title: 'Claims Pending Review',
            value: pendingClaims.length,
            subtitle: 'Customer and manual review queues',
            icon: <ClockCircleOutlined />,
            color: '#ea580c',
            background: '#fff7ed',
          })}
        </Col>
        <Col xs={24} sm={12} xl={6}>
          {buildDashboardMetricCard({
            title: 'Suspicious Claims',
            value: suspiciousClaims.length,
            subtitle: 'Potential fraud or OCR mismatch',
            icon: <SecurityScanOutlined />,
            color: '#ea580c',
            background: '#fff7ed',
          })}
        </Col>
        <Col xs={24} sm={12} xl={6}>
          {buildDashboardMetricCard({
            title: 'Workshop Submissions',
            value: workshopSubmissions.length,
            subtitle: 'Repair estimates submitted',
            icon: <ToolOutlined />,
            color: '#ea580c',
            background: '#fff7ed',
          })}
        </Col>
        <Col xs={24} sm={12} xl={6}>
          {buildDashboardMetricCard({
            title: 'System Coverage Count',
            value: totalCoverages,
            subtitle: 'Coverages linked in the backend',
            icon: <DashboardOutlined />,
            color: '#ea580c',
            background: '#fff7ed',
          })}
        </Col>
      </Row>

      <Row gutter={[20, 20]} style={{ marginTop: 4 }}>
        <Col xs={24} xl={14}>
          <Card style={{ borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)' }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={4} style={{ margin: 0 }}>Review Pipeline</Title>
                <Text type="secondary">Current operational distribution across the officer workflow</Text>
              </Col>
              <Col>
                <Badge count={totalClaims} style={{ backgroundColor: '#2563eb' }} />
              </Col>
            </Row>
            <div style={{ marginTop: 20, display: 'grid', gap: 14 }}>
              {[
                { label: 'All claims in system', value: totalClaims, color: '#2563eb' },
                { label: 'Pending review', value: pendingClaims.length, color: '#f97316' },
                { label: 'Approved claims', value: approvedClaims.length, color: '#16a34a' },
                { label: 'Suspicious claims', value: suspiciousClaims.length, color: '#ef4444' },
              ].map((item) => {
                const percent = totalClaims > 0 ? Math.round((item.value / totalClaims) * 100) : 0;
                return (
                  <div key={item.label}>
                    <Row justify="space-between" style={{ marginBottom: 6 }}>
                      <Text strong>{item.label}</Text>
                      <Text type="secondary">{item.value} | {percent}%</Text>
                    </Row>
                    <div style={{ height: 10, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}BB 100%)` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card style={{ borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)' }}>
            <Title level={4} style={{ marginTop: 0 }}>Recent Claim Activity</Title>
            <Text type="secondary">Latest claims arriving into the officer workspace</Text>
            <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
              {recentClaims.length === 0 ? (
                <Text type="secondary">No recent claims available yet.</Text>
              ) : recentClaims.map((claim) => (
                <div key={claim.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ minWidth: 0 }}>
                    <Text strong style={{ display: 'block' }}>{claim.id}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {claim.vehicleRegistration || 'Vehicle not specified'} | {claim.type || 'Vehicle damage'}
                    </Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text style={{ color: getDashboardStatusColor(claim.status), fontWeight: 700, display: 'block' }}>
                      {claim.status || 'Unknown'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatDashboardDate(claim.createdAt || claim.date)}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderContent = () => {
    switch (selectedIndex) {
      case 0:
        return buildDashboardView();
      case 1:
        return <AllClaimsOfficerScreen claims={claims} loading={loadingClaims} onRefresh={refreshClaims} onClaimsChanged={refreshClaims} />;
      case 2:
        return <ManualReviewQueue claims={claims} loading={loadingClaims} onClaimsChanged={refreshClaims} />;
      case 3:
        return (
          <SuspiciousClaimsReviewScreen
            claims={claims}
            loading={loadingClaims}
            onRefresh={refreshClaims}
            onClaimsChanged={refreshClaims}
          />
        );
      case 4:
        return (
          <WorkshopSubmissionsOfficerScreen
            claims={claims}
            loading={loadingClaims}
            onRefresh={refreshClaims}
            onClaimsChanged={refreshClaims}
          />
        );
      case 5:
        return (
          <WorkshopSubmissionsOfficerScreen
            claims={claims}
            loading={loadingClaims}
            mode="manual-review"
            onRefresh={refreshClaims}
            onClaimsChanged={refreshClaims}
          />
        );
      case 6:
        return <TrackValidationProcess claims={claims} loading={loadingClaims} onRefresh={refreshClaims} />;
      case 7:
        return <ReportsScreen claims={claims} loading={loadingClaims} onRefresh={refreshClaims} />;
      case 8:
        return <WorkshopPaymentsScreen claims={claims} />;
      case 9:
        return <OfficerNotificationAuditScreen claims={claims} />;
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
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div className="logo-container">
          <img 
            src={`${process.env.PUBLIC_URL}/assets/etiqalogo.png`} 
            alt="Etiqa Logo" 
            height={40}
            onError={(e) => {
              e.target.src = `${process.env.PUBLIC_URL}/logo192.png`;
              e.target.onerror = null;
            }}
          />
        </div>
        
        <div className="user-info">
          <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: '#FF6600' }} />
          <div className="user-details">
            <Text strong className="user-name">
              {currentOfficer?.fullName || currentOfficer?.FullName || 'Sarah Johnson'}
            </Text>
            <Text type="secondary" className="user-email">
              {currentOfficer?.email || currentOfficer?.Email || 'Signed in officer user'}
            </Text>
          </div>
        </div>
        
        <div className="sidebar-content">
          <Divider plain orientation="left">
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8 }}>
              MAIN MENU
            </Text>
          </Divider>
          <Menu mode="inline" selectedKeys={[String(selectedIndex)]} className="main-menu">
            <Menu.Item key="0" icon={<DashboardOutlined />} onClick={() => setSelectedIndex(0)}>
              <span>Dashboard</span>
            </Menu.Item>
          </Menu>

          <Divider plain orientation="left">
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8 }}>
              CUSTOMER
            </Text>
          </Divider>
          <Menu mode="inline" selectedKeys={[String(selectedIndex)]} className="main-menu">
            <Menu.Item key="1" icon={<UnorderedListOutlined />} onClick={() => setSelectedIndex(1)}>
              <span>All Claims</span>
            </Menu.Item>
            <Menu.Item key="2" icon={<ClockCircleOutlined />} onClick={() => setSelectedIndex(2)}>
              <span>Manual Review</span>
            </Menu.Item>
            <Menu.Item key="3" icon={<SecurityScanOutlined />} onClick={() => setSelectedIndex(3)}>
              <span>Suspicious Claims</span>
            </Menu.Item>
          </Menu>

          <Divider plain orientation="left">
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8 }}>
              PANEL WORKSHOP
            </Text>
          </Divider>
          <Menu mode="inline" selectedKeys={[String(selectedIndex)]} className="main-menu">
            <Menu.Item key="4" icon={<ToolOutlined />} onClick={() => setSelectedIndex(4)}>
              <span>All Submissions</span>
            </Menu.Item>
            <Menu.Item key="5" icon={<FlagOutlined />} onClick={() => setSelectedIndex(5)}>
              <span>Manual Review</span>
            </Menu.Item>
          </Menu>

          <Divider plain orientation="left">
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8 }}>
              TOOLS & REPORTS
            </Text>
          </Divider>
          <Menu mode="inline" selectedKeys={[String(selectedIndex)]} className="main-menu">
            <Menu.Item key="6" icon={<RadarChartOutlined />} onClick={() => setSelectedIndex(6)}>
              <span>Track Validation</span>
            </Menu.Item>
            <Menu.Item key="7" icon={<AreaChartOutlined />} onClick={() => setSelectedIndex(7)}>
              <span>Reports</span>
            </Menu.Item>
            <Menu.Item key="8" icon={<DollarOutlined />} onClick={() => setSelectedIndex(8)}>
              <span>Payment Monitoring</span>
            </Menu.Item>
            <Menu.Item key="9" icon={<NotificationOutlined />} onClick={() => setSelectedIndex(9)}>
              <span>Notification Audit</span>
            </Menu.Item>
          </Menu>
        </div>
        
        <div className="sign-out-container">
          <Button 
            className="sign-out-button"
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
        <Content className="portal-dashboard-page" style={{ minHeight: 280 }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

function buildDashboardMetricCard({ title, value, subtitle, icon, color, background }) {
  return (
    <Card
      className="portal-dashboard-stat portal-dashboard-stat-soft"
      style={{
        borderRadius: 24,
        border: '1px solid #f3d2b7',
        background,
        boxShadow: '0 14px 30px rgba(234, 88, 12, 0.07)',
      }}
      bodyStyle={{ padding: 20 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <Text style={{ color: '#475569', display: 'block', marginBottom: 6 }}>{title}</Text>
          <Title level={3} style={{ margin: 0, color }}>{value}</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>{subtitle}</Text>
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fffaf5', color, border: '1px solid #f3d2b7' }}>
          {React.cloneElement(icon, { style: { fontSize: 22 } })}
        </div>
      </div>
    </Card>
  );
}

function getDashboardStatusColor(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'approved') return '#16a34a';
  if (normalized === 'rejected') return '#dc2626';
  if (normalized.includes('manual review')) return '#f97316';
  if (normalized.includes('customer action')) return '#9333ea';
  if (normalized.includes('pending')) return '#2563eb';
  return '#64748b';
}

function formatDashboardDate(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default ClaimOfficerDashboard;



