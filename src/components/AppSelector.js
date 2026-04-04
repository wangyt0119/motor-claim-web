import React from 'react';
import { Card, Button, Typography, Row, Col, Space, Divider } from 'antd';
import { UserOutlined, TeamOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../styles/AppSelector.css';

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
        
        <Row gutter={24} className="selection-cards-row">
          <Col xs={24} lg={12}>
            <SelectionCard 
              title="Customer Portal"
              subtitle="Manage your motor insurance claims"
              description="Submit new claims, track progress, view history, manage notifications, and monitor payment status"
              icon={<UserOutlined />}
              color="#2196F3"
              features={customerFeatures}
              onClick={() => navigate('/customer')}
            />
          </Col>
          
          <Col xs={24} lg={12}>
            <SelectionCard 
              title="Officer Portal"
              subtitle="Comprehensive claims management"
              description="Review claims, detect fraud, monitor payments, track notifications, and generate detailed reports"
              icon={<TeamOutlined />}
              color="#FF6600"
              features={officerFeatures}
              onClick={() => navigate('/officer')}
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




