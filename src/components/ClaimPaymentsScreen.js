import React from 'react';
import { Card, Typography, Table, Tag } from 'antd';

const { Title } = Typography;

function ClaimPaymentsScreen({ claims }) {
  // Filter claims that have payment information
  const claimsWithPayments = claims.filter(claim => claim.paymentStatus !== null);
  
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
      title: 'Amount',
      dataIndex: 'claimAmount',
      key: 'claimAmount',
      render: (amount) => `RM ${amount.toFixed(2)}`,
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => {
        let color = 'blue';
        if (status === 'Paid') color = 'green';
        if (status === 'Failed') color = 'red';
        if (status === 'OnHold') color = 'orange';
        
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Payment Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: (date) => date ? date.toLocaleDateString() : 'Pending',
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
    },
    {
      title: 'Reference',
      dataIndex: 'paymentReference',
      key: 'paymentReference',
    },
  ];

  return (
    <Card>
      <Title level={2}>My Claim Payments</Title>
      <Table 
        dataSource={claimsWithPayments} 
        columns={columns} 
        rowKey="id"
      />
    </Card>
  );
}

export default ClaimPaymentsScreen;