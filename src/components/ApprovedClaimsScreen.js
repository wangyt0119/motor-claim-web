import React from 'react';
import { Card, Typography, Table, Tag, Button, Space, Empty } from 'antd';
import { EyeOutlined, FileDoneOutlined } from '@ant-design/icons';

const { Title } = Typography;

function ApprovedClaimsScreen() {
  // Sample approved claims data
  const approvedClaims = [
    {
      id: 'CLM004',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      type: 'Vehicle Collision',
      status: 'Approved',
      vehicleModel: 'Perodua Myvi 2018',
      vehicleRegistration: 'JKL 3456',
      claimAmount: 3200.00,
      paymentStatus: 'Pending',
    },
    {
      id: 'CLM005',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      type: 'Windscreen Damage',
      status: 'Approved',
      vehicleModel: 'Honda City 2021',
      vehicleRegistration: 'MNO 7890',
      claimAmount: 1500.00,
      paymentStatus: 'Processed',
      paymentReference: 'PAY-12345678',
    },
  ];

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
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => {
        let color = 'default';
        if (status === 'Pending') color = 'warning';
        if (status === 'Processed') color = 'success';
        
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small">View</Button>
          <Button 
            type="primary" 
            icon={<FileDoneOutlined />} 
            size="small"
            disabled={record.paymentStatus === 'Processed'}
          >
            {record.paymentStatus === 'Processed' ? 'Paid' : 'Process Payment'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Approved Claims</Title>
      <Card style={{ borderRadius: 12, marginTop: 16 }}>
        <Table 
          dataSource={approvedClaims} 
          columns={columns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

export default ApprovedClaimsScreen;

