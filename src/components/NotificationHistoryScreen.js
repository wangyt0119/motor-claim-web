import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Input, Select, Typography, Tag, 
  Badge, Empty, Space, Button, Modal, Divider,
  Collapse
} from 'antd';
import { 
  SearchOutlined, BellOutlined, MailOutlined, 
  MessageOutlined, CheckCircleOutlined, CloseCircleOutlined,
  InfoCircleOutlined, WarningOutlined, EyeOutlined,
  CaretRightOutlined, DownOutlined
} from '@ant-design/icons';
import moment from 'moment';
import NotificationData from '../models/NotificationData';

const { Text, Title } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

function NotificationHistoryScreen() {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Sample notification data
  const notifications = [
    new NotificationData({
      id: 'NOT001',
      claimId: 'CLM002',
      claimStatus: 'Approved',
      notificationType: 'Email',
      dateSent: moment().subtract(2, 'hours').toDate(),
      deliveryStatus: 'Delivered',
      messagePreview: 'Your claim CLM002 has been approved. Payment of RM 1,200.00 will be processed within 3-5 business days.',
      fullMessage: 'Dear Valued Customer,\n\nWe are pleased to inform you that your motorcar insurance claim CLM002 has been approved.\n\nClaim Details:\n- Claim ID: CLM002\n- Vehicle: Toyota Vios 2018 (XYZ 5678)\n- Claim Amount: RM 1,200.00\n- Incident Date: 10 Dec 2024\n\nPayment Processing:\nYour approved claim amount of RM 1,200.00 will be processed and transferred to your registered bank account within 3-5 business days.\n\nIf you have any questions, please contact our customer service at 1-300-22-3842.\n\nThank you for choosing Etiqa Insurance.\n\nBest regards,\nEtiqa Claims Team',
      recipientContact: 'customer@email.com',
      errorMessage: null,
    }),
    new NotificationData({
      id: 'NOT002',
      claimId: 'CLM001',
      claimStatus: 'Under Review',
      notificationType: 'SMS',
      dateSent: moment().subtract(1, 'days').toDate(),
      deliveryStatus: 'Delivered',
      messagePreview: 'Etiqa: Your claim CLM001 is under review. Additional documents may be required. Check your email for details.',
      fullMessage: 'Etiqa Insurance: Your motorcar claim CLM001 (Vehicle Collision) is currently under review by our claims team. Additional documents may be required. Please check your email for detailed information. For inquiries: 1-300-22-3842',
      recipientContact: '+60123456789',
      errorMessage: null,
    }),
    new NotificationData({
      id: 'NOT003',
      claimId: 'CLM003',
      claimStatus: 'Pending Customer Action',
      notificationType: 'Email',
      dateSent: moment().subtract(2, 'days').toDate(),
      deliveryStatus: 'Failed',
      messagePreview: 'Action Required: Additional documents needed for claim CLM003. Please upload the missing documents.',
      fullMessage: 'Dear Customer,\n\nWe require additional documentation to process your claim CLM003.\n\nMissing Documents:\n- Complete police report\n- Vehicle repair estimate\n- Photos of damage (all angles)\n\nPlease log into your Etiqa portal and upload these documents within 7 days to avoid claim processing delays.\n\nLogin: https://portal.etiqa.com.my\n\nFor assistance: 1-300-22-3842\n\nThank you,\nEtiqa Claims Team',
      recipientContact: 'customer@email.com',
      errorMessage: 'Email delivery failed: Invalid email address',
    }),
    new NotificationData({
      id: 'NOT004',
      claimId: 'CLM002',
      claimStatus: 'Approved',
      notificationType: 'SMS',
      dateSent: moment().subtract(3, 'days').toDate(),
      deliveryStatus: 'Delivered',
      messagePreview: 'Etiqa: Payment of RM 1,200.00 for claim CLM002 has been processed. Check your bank account.',
      fullMessage: 'Etiqa Insurance: Payment of RM 1,200.00 for your approved claim CLM002 has been successfully processed and transferred to your bank account ending in 1234. Transaction ref: PAY-ETQ-240001. Thank you for choosing Etiqa.',
      recipientContact: '+60123456789',
      errorMessage: null,
    }),
    new NotificationData({
      id: 'NOT005',
      claimId: 'CLM001',
      claimStatus: 'Submitted',
      notificationType: 'Email',
      dateSent: moment().subtract(5, 'days').toDate(),
      deliveryStatus: 'Delivered',
      messagePreview: 'Claim submission confirmation for CLM001. We have received your motorcar insurance claim.',
      fullMessage: 'Dear Valued Customer,\n\nThank you for submitting your motorcar insurance claim. We have successfully received your claim and assigned it the reference number CLM001.\n\nClaim Summary:\n- Claim ID: CLM001\n- Incident Type: Vehicle Collision\n- Incident Date: 05 Dec 2024\n- Vehicle: Honda Civic 2020 (WXY 1234)\n- Estimated Amount: RM 15,800.00\n\nNext Steps:\n1. Our claims team will review your submission within 2-3 business days\n2. You will receive updates via email and SMS\n3. Additional documents may be requested if needed\n\nYou can track your claim status anytime through our customer portal.\n\nFor urgent inquiries: 1-300-22-3842\n\nBest regards,\nEtiqa Claims Team',
      recipientContact: 'customer@email.com',
      errorMessage: null,
    }),
    new NotificationData({
      id: 'NOT006',
      claimId: 'CLM004',
      claimStatus: 'Rejected',
      notificationType: 'Email',
      dateSent: moment().subtract(7, 'days').toDate(),
      deliveryStatus: 'Delivered',
      messagePreview: 'Claim CLM004 has been rejected. Policy exclusion applies. Please review the detailed explanation.',
      fullMessage: 'Dear Customer,\n\nWe regret to inform you that your claim CLM004 has been rejected after careful review.\n\nReason for Rejection:\nPolicy Exclusion - Pre-existing damage clause applies\n\nExplanation:\nOur assessment indicates that the damage claimed was pre-existing and not covered under your current policy terms and conditions as outlined in Section 4.2 of your policy document.\n\nIf you believe this decision is incorrect, you may:\n1. Submit an appeal within 30 days\n2. Provide additional evidence supporting your claim\n3. Contact our customer service for clarification\n\nAppeal Process: claims.appeal@etiqa.com.my\nCustomer Service: 1-300-22-3842\n\nThank you for your understanding.\n\nEtiqa Claims Team',
      recipientContact: 'customer@email.com',
      errorMessage: null,
    }),
  ];

  // Filter and sort notifications
  const filteredNotifications = React.useMemo(() => {
    let filtered = [...notifications];
    
    // Apply status filter
    if (selectedStatusFilter !== 'All') {
      filtered = filtered.filter(notification => 
        notification.claimStatus === selectedStatusFilter
      );
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notification => 
        notification.claimId.toLowerCase().includes(query)
      );
    }
    
    // Sort notifications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.dateSent) - new Date(b.dateSent);
        case 'date_desc':
        default:
          return new Date(b.dateSent) - new Date(a.dateSent);
      }
    });
    
    return filtered;
  }, [notifications, selectedStatusFilter, searchQuery, sortBy]);

  // Show notification detail modal
  const showDetailModal = (notification) => {
    setSelectedNotification(notification);
    setDetailModalVisible(true);
  };

  // Helper functions for colors and icons
  const getDeliveryStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#4CAF50';
      case 'failed':
        return '#E53E3E';
      default:
        return '#6C757D';
    }
  };

  const getDeliveryStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircleOutlined />;
      case 'failed':
        return <CloseCircleOutlined />;
      default:
        return <InfoCircleOutlined />;
    }
  };

  const getClaimStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#E53E3E';
      case 'under review':
        return '#2196F3';
      case 'submitted':
        return '#9C27B0';
      case 'pending customer action':
        return '#FF9800';
      default:
        return '#6C757D';
    }
  };

  const getNotificationTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'email':
        return '#2196F3';
      case 'sms':
        return '#9C27B0';
      default:
        return '#6C757D';
    }
  };

  const getNotificationTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'email':
        return <MailOutlined />;
      case 'sms':
        return <MessageOutlined />;
      default:
        return <BellOutlined />;
    }
  };

  // Build detail row component
  const buildDetailRow = (label, value) => {
    return (
      <div style={{ marginBottom: 4 }}>
        <Row>
          <Col span={8}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
              {label}
            </Text>
          </Col>
          <Col span={16}>
            <Text strong style={{ fontSize: 12 }}>
              {value}
            </Text>
          </Col>
        </Row>
      </div>
    );
  };

  // Build expanded content component
  const buildExpandedContent = (notification) => {
    return (
      <div style={{ 
        padding: 16, 
        backgroundColor: '#F8F9FA', 
        borderRadius: 8 
      }}>
        <div>
          <Text strong style={{ fontSize: 14 }}>Full Message:</Text>
          <div style={{ 
            width: '100%',
            padding: 12,
            marginTop: 8,
            backgroundColor: 'white',
            borderRadius: 8,
            border: '1px solid #E9ECEF'
          }}>
            <Text style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {notification.fullMessage}
            </Text>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              {buildDetailRow('Sent To:', notification.recipientContact)}
            </Col>
            <Col span={12}>
              {buildDetailRow('Method:', notification.notificationType)}
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              {buildDetailRow('Status:', notification.deliveryStatus)}
            </Col>
            <Col span={12}>
              {buildDetailRow('Date:', moment(notification.dateSent).format('DD MMM YYYY, HH:mm'))}
            </Col>
          </Row>
        </div>

        {notification.errorMessage && (
          <div style={{ marginTop: 16 }}>
            <div style={{
              padding: 12,
              backgroundColor: `${getDeliveryStatusColor('failed')}10`,
              borderRadius: 8,
              border: `1px solid ${getDeliveryStatusColor('failed')}30`
            }}>
              <Row>
                <Col span={24}>
                  <Space>
                    <WarningOutlined style={{ color: getDeliveryStatusColor('failed') }} />
                    <Text strong style={{ 
                      fontSize: 12, 
                      color: getDeliveryStatusColor('failed') 
                    }}>
                      Delivery Error:
                    </Text>
                  </Space>
                  <div style={{ marginTop: 2 }}>
                    <Text style={{ 
                      fontSize: 12, 
                      color: getDeliveryStatusColor('failed') 
                    }}>
                      {notification.errorMessage}
                    </Text>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Build notification card component
  const buildNotificationCard = (notification) => {
    const statusColor = getDeliveryStatusColor(notification.deliveryStatus);
    const claimStatusColor = getClaimStatusColor(notification.claimStatus);
    const typeColor = getNotificationTypeColor(notification.notificationType);

    return (
      <Collapse
        key={notification.id}
        bordered={false}
        expandIcon={({ isActive }) => (
          <CaretRightOutlined rotate={isActive ? 90 : 0} />
        )}
        style={{ 
          marginBottom: 16,
          backgroundColor: 'white',
          borderRadius: 12,
          border: '1px solid #E9ECEF',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Panel
          key="1"
          header={
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <div style={{ 
                padding: 8,
                backgroundColor: `${typeColor}10`,
                borderRadius: 8,
                marginRight: 16
              }}>
                {React.cloneElement(getNotificationTypeIcon(notification.notificationType), {
                  style: { color: typeColor, fontSize: 20 }
                })}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 16, marginRight: 8 }}>
                    {notification.claimId}
                  </Text>
                  <Tag color={claimStatusColor} style={{ 
                    borderRadius: 10,
                    fontSize: 10,
                    fontWeight: 'bold',
                    padding: '0 6px',
                    height: 20,
                    lineHeight: '20px'
                  }}>
                    {notification.claimStatus}
                  </Tag>
                </div>
                <div style={{ marginTop: 4 }}>
                  <Text style={{ 
                    fontSize: 14, 
                    color: '#6C757D',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {notification.messagePreview}
                  </Text>
                </div>
              </div>
            </div>
          }
          extra={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {moment(notification.dateSent).format('DD MMM YYYY, HH:mm')}
              </Text>
              <div style={{ marginTop: 8 }}>
                <Tag icon={getDeliveryStatusIcon(notification.deliveryStatus)} 
                  color={notification.deliveryStatus.toLowerCase() === 'delivered' ? 'success' : 'error'}
                  style={{ borderRadius: 12 }}
                >
                  {notification.deliveryStatus}
                </Tag>
              </div>
            </div>
          }
        >
          {buildExpandedContent(notification)}
        </Panel>
      </Collapse>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={2} style={{ margin: 0 }}>Notification History</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            View all claim-related notifications sent to you
          </Text>
        </Col>
        <Col>
          <Tag 
            icon={<BellOutlined />}
            color="#2196F3"
            style={{ 
              padding: '8px 16px', 
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8
            }}
          >
            {notifications.length} Notifications
          </Tag>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Row gutter={16} style={{ marginTop: 24, marginBottom: 24 }}>
        <Col span={5}>
          <Select
            value={selectedStatusFilter}
            onChange={value => setSelectedStatusFilter(value)}
            style={{ width: '100%' }}
          >
            <Option value="All">All Statuses</Option>
            <Option value="Submitted">Submitted</Option>
            <Option value="Under Review">Under Review</Option>
            <Option value="Approved">Approved</Option>
            <Option value="Rejected">Rejected</Option>
            <Option value="Pending Customer Action">Pending Customer Action</Option>
          </Select>
        </Col>
        <Col span={5}>
          <Select
            value={sortBy}
            onChange={value => setSortBy(value)}
            style={{ width: '100%' }}
          >
            <Option value="date_desc">Newest First</Option>
            <Option value="date_asc">Oldest First</Option>
          </Select>
        </Col>
        <Col span={14}>
          <Input
            placeholder="Search by Claim ID..."
            prefix={<SearchOutlined style={{ color: '#6C757D' }} />}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%' }}
            allowClear
          />
        </Col>
      </Row>

      {/* Stats Row */}
      <Row style={{ marginBottom: 24 }}>
        <Col flex="auto">
          <Space size={12}>
            {renderStatChip(
              'Delivered', 
              notifications.filter(n => n.deliveryStatus === 'Delivered').length, 
              '#4CAF50'
            )}
            {renderStatChip(
              'Failed', 
              notifications.filter(n => n.deliveryStatus === 'Failed').length, 
              '#E53E3E'
            )}
            {renderStatChip(
              'Email', 
              notifications.filter(n => n.notificationType === 'Email').length, 
              '#2196F3'
            )}
            {renderStatChip(
              'SMS', 
              notifications.filter(n => n.notificationType === 'SMS').length, 
              '#9C27B0'
            )}
          </Space>
        </Col>
        <Col>
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
            Total: {notifications.length} notifications
          </Text>
        </Col>
      </Row>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card style={{ borderRadius: 8, textAlign: 'center', padding: 32 }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text strong style={{ fontSize: 18, color: '#6C757D' }}>
                  No notifications found
                </Text>
                <br />
                <Text type="secondary">
                  Try adjusting your search or filter criteria
                </Text>
              </div>
            }
          />
        </Card>
      ) : (
        <div>
          {filteredNotifications.map(notification => buildNotificationCard(notification))}
        </div>
      )}
    </div>
  );
}

// Helper function for rendering stat chips
function renderStatChip(label, count, color) {
  return (
    <div style={{ 
      backgroundColor: `${color}10`, 
      borderRadius: 16,
      padding: '6px 12px',
      display: 'inline-flex',
      alignItems: 'center',
      border: `1px solid ${color}30`
    }}>
      <Badge color={color} />
      <Text style={{ marginLeft: 8, color, fontWeight: 600 }}>
        {label} ({count})
      </Text>
    </div>
  );
}

export default NotificationHistoryScreen;


