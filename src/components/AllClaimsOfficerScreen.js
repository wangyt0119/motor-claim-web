import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Input, Select, Space, Table, Tag, Typography, message } from 'antd';
import { FileSearchOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import moment from 'moment';
import { getAllClaims } from '../services/claimService';

const { Title, Text } = Typography;

function AllClaimsOfficerScreen() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    setLoading(true);

    try {
      const allClaims = await getAllClaims();
      setClaims(allClaims);
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.title ||
          'Unable to load all claims for the officer portal.'
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const matchesStatus = statusFilter === 'All' || claim.status === statusFilter;
      const normalizedSearch = searchText.trim().toLowerCase();

      if (!normalizedSearch) {
        return matchesStatus;
      }

      const matchesSearch =
        String(claim.id || '').toLowerCase().includes(normalizedSearch) ||
        String(claim.type || '').toLowerCase().includes(normalizedSearch) ||
        String(claim.coverageId || '').toLowerCase().includes(normalizedSearch) ||
        String(claim.status || '').toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [claims, searchText, statusFilter]);

  const statusOptions = ['All', ...new Set(claims.map((claim) => claim.status).filter(Boolean))];

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'pending':
        return 'gold';
      case 'submitted':
        return 'blue';
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Claim ID',
      dataIndex: 'id',
      key: 'id',
      width: 180,
    },
    {
      title: 'Coverage ID',
      dataIndex: 'coverageId',
      key: 'coverageId',
      ellipsis: true,
      render: (value) => <Text copyable>{value}</Text>,
    },
    {
      title: 'Submitted On',
      dataIndex: 'date',
      key: 'date',
      width: 160,
      render: (value) => moment(value).format('DD MMM YYYY'),
    },
    {
      title: 'Incident Date',
      dataIndex: 'incidentDate',
      key: 'incidentDate',
      width: 160,
      render: (value) => moment(value).format('DD MMM YYYY'),
    },
    {
      title: 'Claim Type',
      dataIndex: 'type',
      key: 'type',
      width: 180,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value) => <Tag color={getStatusColor(value)}>{value || 'Unknown'}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'incidentDescription',
      key: 'incidentDescription',
      ellipsis: true,
      render: (value) => value || 'No description',
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ marginBottom: 6 }}>
          All Claims
        </Title>
        <Text type="secondary">
          View every submitted claim available to officer and admin accounts.
        </Text>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
        message="Officer Access"
        description="This screen reads from GET /api/Claim/all and is restricted by your OfficerOrAdmin backend policy."
      />

      <Card style={{ borderRadius: 16 }}>
        <Space style={{ width: '100%', marginBottom: 16 }} wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search by claim ID, status, type or coverage ID"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            style={{ width: 320 }}
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180 }}
            options={statusOptions.map((status) => ({ label: status, value: status }))}
          />

          <Tag icon={<FileSearchOutlined />} color="processing" style={{ padding: '6px 10px' }}>
            {filteredClaims.length} claim(s)
          </Tag>

          <Tag
            icon={<ReloadOutlined />}
            color="default"
            style={{ padding: '6px 10px', cursor: 'pointer' }}
            onClick={loadClaims}
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
          scroll={{ x: 1100 }}
        />
      </Card>
    </div>
  );
}

export default AllClaimsOfficerScreen;
