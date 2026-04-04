import React from 'react';
import { Card, Typography, Table, Tag, Button, Space } from 'antd';
import { EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;

function PendingClaimsScreen({ pendingClaims = [] }) {
  const columns = [
    {
      title: 'Claim ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => date.toLocaleDateString(),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Vehicle',
      key: 'vehicle',
      render: (_, record) => (
        <span>{record.vehicleModel} ({record.vehicleRegistration})</span>
      ),
    },
    {
      title: 'Amount (RM)',
      dataIndex: 'claimAmount',
      key: 'claimAmount',
      render: (amount) => amount.toFixed(2),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status.toLowerCase() === 'under review') color = 'warning';
        if (status.toLowerCase() === 'submitted') color = 'processing';
        
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small">View</Button>
          <Button type="primary" icon={<CheckCircleOutlined />} size="small">Review</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Pending Claims</Title>
      <Card style={{ borderRadius: 12, marginTop: 16 }}>
        <Table 
          dataSource={pendingClaims} 
          columns={columns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

export default PendingClaimsScreen;