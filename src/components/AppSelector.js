import React from 'react';
import { Card, Button, Typography, Row, Col, Space } from 'antd';
import { UserOutlined, TeamOutlined, ToolOutlined, SafetyCertificateOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../styles/AppSelector.css';
import { getPortalPath, PORTAL_KEYS } from '../config/portalRoutes';

const { Title, Text, Paragraph } = Typography;

function AppSelector() {
  const navigate = useNavigate();

  const customerFeatures = [
    'Submit New Motor Claims',
    'Track Claim Progress',
    'View Claim History',
    'Notification History',
    'Payment Status Tracking',
    'Download Receipts',
  ];

  const officerFeatures = [
    'Manual Review Queue',
    'Suspicious Claims Detection',
    'Payment Monitoring',
    'Notification Audit Log',
    'Validation Process Tracking',
    'Advanced Analytics & Reports',
  ];

  const workshopFeatures = [
    'View Approved Assigned Claims',
    'See Workshop Appointment Date & Time',
    'Open Uploaded Claim Documents',
    'Submit repair quotation and documents',
    'Track incoming repair jobs',
    'Use Workshop-Specific Login',
  ];

  const adminFeatures = [
    'Monitor real-time system activities',
    'Review API and user action logs',
    'Filter and export audit-ready monitoring reports',
    'Track request success and failure patterns',
    'Watch module usage across the platform',
    'Manage your admin profile securely',
  ];

  const FeatureList = ({ features, color }) => (
    <Space direction="vertical" size={10} className="feature-list">
      {features.map((feature, index) => (
        <div key={index} className="feature-item">
          <div className="feature-bullet" style={{ backgroundColor: color }}></div>
          <Text className="feature-text">{feature}</Text>
        </div>
      ))}
    </Space>
  );

  const SelectionCard = ({ 
    title, 
    subtitle, 
    description, 
    icon, 
    color, 
    features, 
    onClick 
  }) => (
    <Card 
      hoverable 
      className="selection-card"
      onClick={onClick}
    >
      <div className="card-header">
        <div className="icon-container" style={{ backgroundColor: `${color}16` }}>
          {icon}
        </div>
        <div className="header-text">
          <Title level={4} className="card-title">{title}</Title>
          <Text className="card-subtitle">{subtitle}</Text>
        </div>
      </div>
      
      <Paragraph className="card-description">
        {description}
      </Paragraph>
      
      <div className="features-section">
        <Text strong>Features:</Text>
        <FeatureList features={features} color={color} />
      </div>
      
      <Button 
        type="primary" 
        size="large"
        className="access-button"
        style={{ backgroundColor: color, borderColor: color }}
        onClick={onClick}
      >
        Access Portal <ArrowRightOutlined />
      </Button>
    </Card>
  );

  return (
    <div className="app-selector-container">
      <div className="app-selector-content">
        <Card className="header-card">
          <img 
            src="/assets/etiqalogo.png" 
            alt="Etiqa Logo" 
            className="app-selector-logo" 
          />
          
          <Title level={2} className="welcome-title">
            Welcome to Etiqa Insurance
          </Title>
          
          <Text className="welcome-subtitle">
            Motor Insurance Claims Management System
          </Text>
          
          <div className="orange-divider"></div>
        </Card>
        
        <Row gutter={[24, 24]} className="selection-cards-row">
          <Col xs={24} md={12}>
            <SelectionCard 
              title="Customer Portal"
              subtitle="Manage your motor insurance claims"
              description="Submit new claims, track progress, view history, manage notifications, and monitor payment status"
              icon={<UserOutlined />}
              color="#2196F3"
              features={customerFeatures}
              onClick={() => navigate(getPortalPath(PORTAL_KEYS.CUSTOMER, '/auth'))}
            />
          </Col>
          
          <Col xs={24} md={12}>
            <SelectionCard 
              title="Officer Portal"
              subtitle="Comprehensive claims management"
              description="Review claims, detect fraud, monitor payments, track notifications, and generate detailed reports"
              icon={<TeamOutlined />}
              color="#FF6600"
              features={officerFeatures}
              onClick={() => navigate(getPortalPath(PORTAL_KEYS.OFFICER, '/auth'))}
            />
          </Col>

          <Col xs={24} md={12}>
            <SelectionCard
              title="Admin Portal"
              subtitle="System monitoring and audit oversight"
              description="Monitor platform usage, inspect system logs, review request health, and export audit data for compliance and operational support."
              icon={<SafetyCertificateOutlined />}
              color="#B45309"
              features={adminFeatures}
              onClick={() => navigate(getPortalPath(PORTAL_KEYS.ADMIN, '/auth'))}
            />
          </Col>

          <Col xs={24} md={12}>
            <SelectionCard
              title="Panel Workshop"
              subtitle="Handle approved workshop appointments"
              description="Open assigned approved claims, review uploaded evidence, and prepare for booked inspection or repair appointments."
              icon={<ToolOutlined />}
              color="#0F766E"
              features={workshopFeatures}
              onClick={() => navigate(getPortalPath(PORTAL_KEYS.PANEL_WORKSHOP, '/auth'))}
            />
          </Col>
        </Row>
        
        <Text className="footer-text">
          Choose your portal to access the claims management system
        </Text>
      </div>
    </div>
  );
}

export default AppSelector;




