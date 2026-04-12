import React, { useMemo, useState } from 'react';
import { Card, Typography, Table, Tag, Button, Space, Empty } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import moment from 'moment';
import ClaimWorkflowDrawer from './ClaimWorkflowDrawer';

const { Title } = Typography;

function PendingClaimsScreen({ claims = [], loading = false, onClaimsChanged }) {
  const [selectedClaim, setSelectedClaim] = useState(null);

  const pendingClaims = useMemo(() => {
    return claims.filter((claim) => ['Pending Manual Review', 'Customer Responded'].includes(claim.status));
  }, [claims]);

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
      render: (date) => moment(date).format('DD MMM YYYY'),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Coverage ID',
      dataIndex: 'coverageId',
      key: 'coverageId',
      render: (value) => value || 'Not available',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color="orange">{status || 'Pending manual review'}</Tag>,
    },
    {
      title: 'STP Status',
      dataIndex: 'stpStatus',
      key: 'stpStatus',
      render: (status) => <Tag color="warning">{status || 'Manual Review'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => setSelectedClaim(record)}>
            Review
          </Button>
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
          loading={loading}
          locale={{
            emptyText: <Empty description="No pending manual review claims right now" />,
          }}
        />
      </Card>

      <ClaimWorkflowDrawer
        claim={selectedClaim}
        open={Boolean(selectedClaim)}
        onClose={() => setSelectedClaim(null)}
        onWorkflowUpdated={onClaimsChanged}
      />
    </div>
  );
}

export default PendingClaimsScreen;
