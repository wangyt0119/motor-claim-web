import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  EyeOutlined,
  FileSearchOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import ClaimWorkflowDrawer from './ClaimWorkflowDrawer';

const { Title, Text } = Typography;

function AllClaimsOfficerScreen({ claims = [], loading = false, onRefresh, onClaimsChanged }) {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stpFilter, setStpFilter] = useState('All');
  const [selectedClaim, setSelectedClaim] = useState(null);

  const filteredClaims = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return claims.filter((claim) => {
      const matchesStatus = statusFilter === 'All' || claim.status === statusFilter;
      const matchesStp =
        stpFilter === 'All' ||
        (stpFilter === 'Passed' && claim.isStpApproved) ||
        (stpFilter === 'Manual Review' && !claim.isStpApproved);

      if (!normalizedSearch) {
        return matchesStatus && matchesStp;
      }

      const haystack = [
        claim.id,
        claim.type,
        claim.coverageId,
        claim.coverage?.insuredPersonName,
        claim.coverage?.vehicleNo,
        claim.coverage?.coverageType,
        claim.userId,
        claim.status,
        claim.stpStatus,
        claim.incidentDescription,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStatus && matchesStp && haystack.includes(normalizedSearch);
    });
  }, [claims, searchText, statusFilter, stpFilter]);

  const statusOptions = ['All', ...new Set(claims.map((claim) => claim.status).filter(Boolean))];
  const totalClaims = claims.length;
  const stpPassedCount = claims.filter((claim) => claim.isStpApproved).length;
  const manualReviewCount = claims.filter((claim) => !claim.isStpApproved).length;

  const columns = [
    {
      title: 'Claim ID',
      dataIndex: 'id',
      key: 'id',
      width: 180,
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: 'Customer',
      dataIndex: 'userId',
      key: 'userId',
      width: 180,
      render: (value) => (value ? <Text copyable>{value}</Text> : 'Not available'),
    },
    {
      title: 'Coverage',
      dataIndex: 'coverageId',
      key: 'coverageId',
      width: 260,
      render: (value, claim) => (
        <Space direction="vertical" size={2}>
          <Text strong>{claim.coverage?.vehicleNo || 'Vehicle not available'}</Text>
          <Text type="secondary">{claim.coverage?.coverageType || 'Coverage type not available'}</Text>
          {value ? <Text type="secondary" copyable>{value}</Text> : <Text type="secondary">Coverage ID not available</Text>}
        </Space>
      ),
    },
    {
      title: 'Submitted On',
      dataIndex: 'date',
      key: 'date',
      width: 160,
      render: (value) => moment(value).format('DD MMM YYYY'),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 170,
    },
    {
      title: 'Claim Status',
      dataIndex: 'status',
      key: 'status',
      width: 170,
      render: (value) => <Tag color={getStatusColor(value)}>{value || 'Unknown'}</Tag>,
    },
    {
      title: 'STP',
      key: 'stp',
      width: 220,
      render: (_, claim) => (
        <Space direction="vertical" size={4}>
          <Tag color={claim.isStpApproved ? 'success' : 'warning'}>
            {claim.isStpApproved ? 'Passed' : 'Manual Review'}
          </Tag>
          <Text type="secondary">{formatStpStatus(claim.stpStatus)}</Text>
        </Space>
      ),
    },
    {
      title: 'Documents',
      key: 'documents',
      width: 120,
      render: (_, claim) => (
        <Tag color="processing">{claim.documents?.length || 0} uploaded</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, claim) => (
        <Button icon={<EyeOutlined />} onClick={() => setSelectedClaim(claim)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ marginBottom: 6 }}>
          All Claims
        </Title>
        <Text type="secondary">
          Review live claims, STP outcome, backend validation reasons, and uploaded documents.
        </Text>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
        message="Officer Access"
        description="This screen combines GET /api/Claim/all with GET /api/Coverage/all-coverages, so each review can keep the submitted claim details first while still showing the related policy holder, vehicle, and coverage period."
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={8}>
          <Card style={{ borderRadius: 16 }}>
            <Statistic title="Total Claims" value={totalClaims} prefix={<FileSearchOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={{ borderRadius: 16 }}>
            <Statistic title="STP Passed" value={stpPassedCount} prefix={<SafetyCertificateOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={{ borderRadius: 16 }}>
            <Statistic title="Manual Review" value={manualReviewCount} prefix={<UserOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 16 }}>
        <Space style={{ width: '100%', marginBottom: 16 }} wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search by claim ID, customer ID, coverage ID, type, status or STP"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            style={{ width: 360 }}
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 200 }}
            options={statusOptions.map((status) => ({ label: status, value: status }))}
          />

          <Select
            value={stpFilter}
            onChange={setStpFilter}
            style={{ width: 180 }}
            options={[
              { label: 'All STP Results', value: 'All' },
              { label: 'STP Passed', value: 'Passed' },
              { label: 'Manual Review', value: 'Manual Review' },
            ]}
          />

          <Tag icon={<FileSearchOutlined />} color="processing" style={{ padding: '6px 10px' }}>
            {filteredClaims.length} claim(s)
          </Tag>

          <Tag
            icon={<ReloadOutlined />}
            color="default"
            style={{ padding: '6px 10px', cursor: 'pointer' }}
            onClick={onRefresh}
          >
            Refresh
          </Tag>
        </Space>

        <Table
          dataSource={filteredClaims}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1500 }}
          onRow={(claim) => ({
            onClick: () => setSelectedClaim(claim),
            style: { cursor: 'pointer' },
          })}
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

function getStatusColor(status) {
  switch ((status || '').toLowerCase()) {
    case 'pending':
      return 'gold';
    case 'submitted':
      return 'blue';
    case 'approved':
      return 'green';
    case 'pending manual review':
      return 'orange';
    case 'rejected':
      return 'red';
    default:
      return 'default';
  }
}

function formatStpStatus(status) {
  if (status === null || status === undefined || status === '') {
    return 'Unknown';
  }

  return String(status);
}

export default AllClaimsOfficerScreen;
