import React, { useMemo, useState } from 'react';
import { Card, Typography, Table, Tag, Button, Space, Empty } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import moment from 'moment';
import ClaimWorkflowDrawer from './ClaimWorkflowDrawer';

const { Title } = Typography;

function ApprovedClaimsScreen({ claims = [], loading = false, onClaimsChanged }) {
  const [selectedClaim, setSelectedClaim] = useState(null);
  const approvedClaims = useMemo(() => claims.filter((claim) => claim.status === 'Approved'), [claims]);

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
      title: 'Claim Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color="success">{status || 'Approved'}</Tag>,
    },
    {
      title: 'STP Status',
      dataIndex: 'stpStatus',
      key: 'stpStatus',
      render: (status) => <Tag color="green">{status || 'AutoApproved'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => setSelectedClaim(record)}>
            View
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
          loading={loading}
          locale={{
            emptyText: <Empty description="No approved STP claims available" />,
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

export default ApprovedClaimsScreen;

