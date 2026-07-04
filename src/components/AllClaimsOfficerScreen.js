import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
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
  FlagOutlined,
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
  const [dateRange, setDateRange] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);

  const filteredClaims = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return claims.filter((claim) => {
      const matchesStatus = matchesClaimWorkflowFilter(claim, statusFilter);
      const stpDisplay = getStpDisplay(claim);
      const matchesStp =
        stpFilter === 'All' ||
        (stpFilter === 'Auto Approved' && stpDisplay.value === 'passed') ||
        (stpFilter === 'Manual Review' && stpDisplay.value === 'manual-review') ||
        (stpFilter === 'Pending' && stpDisplay.value === 'pending');

      const matchesDate =
        !dateRange?.length ||
        (claim.date &&
          moment(claim.date).isBetween(dateRange[0], dateRange[1], 'day', '[]'));

      if (!normalizedSearch) {
        return matchesStatus && matchesStp && matchesDate;
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
        stpDisplay.label,
        getClaimFlagDisplay(claim).reason,
        claim.incidentDescription,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStatus && matchesStp && matchesDate && haystack.includes(normalizedSearch);
    });
  }, [claims, dateRange, searchText, statusFilter, stpFilter]);

  const sortedClaims = useMemo(
    () =>
      [...filteredClaims].sort((left, right) => {
        const leftTime = new Date(left.date || 0).getTime();
        const rightTime = new Date(right.date || 0).getTime();
        return rightTime - leftTime;
      }),
    [filteredClaims]
  );

  const totalClaims = claims.length;
  const stpPassedCount = claims.filter((claim) => getStpDisplay(claim).value === 'passed').length;
  const manualReviewCount = claims.filter((claim) => getStpDisplay(claim).value === 'manual-review').length;

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
      render: (_, claim) => {
        const stpDisplay = getStpDisplay(claim);

        return (
          <Space direction="vertical" size={4}>
            <Tag color={stpDisplay.color}>{stpDisplay.label}</Tag>
          </Space>
        );
      },
    },
    {
      title: 'Flag',
      key: 'flag',
      width: 220,
      render: (_, claim) => {
        const flagDisplay = getClaimFlagDisplay(claim);

        return (
          <Space direction="vertical" size={4}>
            <Tag icon={flagDisplay.flagged ? <FlagOutlined /> : null} color={flagDisplay.color}>
              {flagDisplay.label}
            </Tag>
            {flagDisplay.flagged && flagDisplay.reason ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {flagDisplay.reason}
              </Text>
            ) : null}
          </Space>
        );
      },
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
      <div className="portal-dashboard-hero portal-dashboard-theme-soft" style={{ marginBottom: 20 }}>
        <div className="portal-dashboard-hero-content">
          <span className="portal-dashboard-kicker portal-dashboard-kicker-soft">Officer Review</span>
          <Title level={2} className="portal-dashboard-title">
            All Claims
          </Title>
          <Text className="portal-dashboard-description">
            Review live claims with cleaner workflow filters, STP outcome, backend validation reasons, and uploaded documents.
          </Text>
          <div className="portal-dashboard-chip-row">
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Total Claims</span>
              <span className="portal-dashboard-chip-value">{totalClaims}</span>
            </div>
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">STP Passed</span>
              <span className="portal-dashboard-chip-value">{stpPassedCount}</span>
            </div>
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Manual Review</span>
              <span className="portal-dashboard-chip-value">{manualReviewCount}</span>
            </div>
          </div>
        </div>
      </div>

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
            options={[
              { label: 'All Workflow Statuses', value: 'All' },
              { label: 'Manual Review', value: 'Manual Review' },
              { label: 'Approved', value: 'Approved' },
              { label: 'Rejected', value: 'Rejected' },
            ]}
          />

          <Select
            value={stpFilter}
            onChange={setStpFilter}
            style={{ width: 180 }}
            options={[
              { label: 'STP: All', value: 'All' },
              { label: 'STP: Auto Approved', value: 'Auto Approved' },
              { label: 'STP: Manual Review', value: 'Manual Review' },
              { label: 'STP: Pending', value: 'Pending' },
            ]}
          />

          <DatePicker.RangePicker
            value={dateRange}
            onChange={(values) => setDateRange(values || [])}
            allowClear
          />

          <Tag icon={<FileSearchOutlined />} color="processing" style={{ padding: '6px 10px' }}>
            {sortedClaims.length} claim(s)
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
          dataSource={sortedClaims}
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

function matchesClaimWorkflowFilter(claim, filterValue) {
  if (filterValue === 'All') {
    return true;
  }

  const normalizedStatus = String(claim.status || '').trim().toLowerCase();

  if (filterValue === 'Manual Review') {
    return ['pending manual review', 'pending customer action', 'customer responded'].includes(normalizedStatus);
  }

  if (filterValue === 'Approved') {
    return normalizedStatus === 'approved';
  }

  if (filterValue === 'Rejected') {
    return normalizedStatus === 'rejected';
  }

  return false;
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

function getStpDisplay(claim) {
  const normalizedStpStatus = String(claim?.stpStatus || '').trim().toLowerCase().replace(/\s+/g, '');

  if (normalizedStpStatus === 'autoapproved') {
    return { value: 'passed', label: 'Passed', color: 'success' };
  }

  if (normalizedStpStatus === 'manualreview') {
    return { value: 'manual-review', label: 'Manual Review', color: 'warning' };
  }

  if (normalizedStpStatus === 'pending') {
    return { value: 'pending', label: 'Pending', color: 'processing' };
  }

  if (claim?.isStpApproved) {
    return { value: 'passed', label: 'Passed', color: 'success' };
  }

  return { value: 'manual-review', label: 'Manual Review', color: 'warning' };
}

function getClaimFlagDisplay(claim) {
  const validationReasons = claim?.validationResult?.reasons || [];
  const flagReason = claim?.manualReviewFlagReason || validationReasons[0] || '';
  const normalizedStatus = String(claim?.status || '').trim().toLowerCase();
  const flagged = Boolean(claim?.isFlaggedForManualReview || flagReason);

  if (flagged) {
    return {
      flagged: true,
      label: 'Flagged',
      reason: flagReason || 'Manual review required',
      color: 'error',
    };
  }

  if (normalizedStatus.includes('manual review') || getStpDisplay(claim).value === 'manual-review') {
    return {
      flagged: false,
      label: 'Review',
      reason: '',
      color: 'warning',
    };
  }

  return {
    flagged: false,
    label: 'Clear',
    reason: '',
    color: 'success',
  };
}

export default AllClaimsOfficerScreen;
