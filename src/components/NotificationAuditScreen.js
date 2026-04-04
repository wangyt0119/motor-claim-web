import React from 'react';
import { Card, Typography, Table, Tag, DatePicker, Select, Button, Space, Badge } from 'antd';
import { BellOutlined, MailOutlined, MessageOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

function NotificationAuditScreen() {
  // Sample notification data
  const notifications = [
    {
      id: 'NOT001',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      type: 'Email',
      recipient: 'customer@example.com',
      subject: 'Claim CLM001 Status Update',
      status: 'Delivered',
      claimId: 'CLM001',
    },
    {
      id: 'NOT002',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      type: 'SMS',
      recipient: '+60123456789',
      subject: 'Claim CLM002 Approved',
      status: 'Delivered',
      claimId: 'CLM002',
    },
    {
      id: 'NOT003',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      type: 'Email',
      recipient: 'customer2@example.com',
      subject: 'Additional Documents Required',
      status: 'Failed',
      claimId: 'CLM003',
    },
    {
      id: 'NOT004',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      type: 'Push',
      recipient: 'User ID: 12345',
      subject: 'Claim CLM004 Payment Processed',
      status: 'Delivered',
      claimId: 'CLM004',
    },
  ];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'Email':
        return <MailOutlined />;
      case 'SMS':
        return <MessageOutlined />;
      case 'Push':
        return <BellOutlined />;
      default:
        return <BellOutlined />;
    }
  };

  const columns = [
    {
      title: 'Notification ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Date & Time',
      dataIndex: 'date',
      key: 'date',
      render: (date) => date.toLocaleString(),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag icon={getNotificationIcon(type)}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Recipient',
      dataIndex: 'recipient',
      key: 'recipient',
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: 'Related Claim',
      dataIndex: 'claimId',
      key: 'claimId',
      render: (claimId) => (
        <Button type="link" size="small">
          {claimId}
        </Button>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === 'Delivered' ? 'success' : 'error';
        const icon = status === 'Delivered' ? <CheckCircleOutlined /> : <CloseCircleOutlined />;
        
        return (
          <Tag icon={icon} color={color}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small">View</Button>
          {record.status === 'Failed' && (
            <Button type="primary" size="small">Resend</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Notification Audit Log</Title>
      <Text type="secondary" style={{ fontSize: 16 }}>
        Track all notifications sent to customers
      </Text>
      
      <Card style={{ borderRadius: 12, marginTop: 16, marginBottom: 24 }}>
        <Space size={16} wrap>
          <div>
            <Text strong>Date Range</Text>
            <div style={{ marginTop: 8 }}>
              <RangePicker style={{ width: 280 }} />
            </div>
          </div>
          
          <div>
            <Text strong>Notification Type</Text>
            <div style={{ marginTop: 8 }}>
              <Select defaultValue="all" style={{ width: 120 }}>
                <Option value="all">All Types</Option>
                <Option value="email">Email</Option>
                <Option value="sms">SMS</Option>
                <Option value="push">Push</Option>
              </Select>
            </div>
          </div>
          
          <div>
            <Text strong>Status</Text>
            <div style={{ marginTop: 8 }}>
              <Select defaultValue="all" style={{ width: 120 }}>
                <Option value="all">All Status</Option>
                <Option value="delivered">Delivered</Option>
                <Option value="failed">Failed</Option>
              </Select>
            </div>
          </div>
          
          <div style={{ marginTop: 28 }}>
            <Button type="primary">Filter</Button>
          </div>
        </Space>
      </Card>
      
      <Card style={{ borderRadius: 12 }}>
        <div style={{ marginBottom: 16 }}>
          <Badge status="success" text="Delivered: 3" style={{ marginRight: 16 }} />
          <Badge status="error" text="Failed: 1" />
        </div>
        
        <Table 
          dataSource={notifications} 
          columns={columns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

export default NotificationAuditScreen;