import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
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
  CheckCircleOutlined,
  EyeOutlined,
  FileSearchOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import WorkshopSubmissionReviewDrawer from './WorkshopSubmissionReviewDrawer';
import { formatEstimateStatus, formatReviewMode, getEstimateStatusColor } from './WorkshopRepairEstimateCard';

const { Title, Text } = Typography;

function WorkshopSubmissionsOfficerScreen({
  claims = [],
  loading = false,
  mode = 'all',
  onRefresh,
  onClaimsChanged,
}) {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [reviewFilter, setReviewFilter] = useState('All');
  const [dateRange, setDateRange] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);

  const workshopClaims = useMemo(() => {
    const withEstimate = claims.filter((claim) => claim.workshopRepairEstimate);

    if (mode === 'manual-review') {
      return withEstimate.filter((claim) => needsWorkshopManualReview(claim.workshopRepairEstimate));
    }

    return withEstimate;
  }, [claims, mode]);

  const filteredClaims = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return workshopClaims.filter((claim) => {
      const estimate = claim.workshopRepairEstimate;
      const matchesStatus =
        statusFilter === 'All' || normalizeValue(estimate?.status) === normalizeValue(statusFilter);
      const matchesReview =
        reviewFilter === 'All' ||
        (reviewFilter === 'STP Approved' && estimate?.isStpApproved) ||
        (reviewFilter === 'Manual Review' && needsWorkshopManualReview(estimate)) ||
        (reviewFilter === 'Waiting Workshop Update' && isWorkshopWaitingForUpdate(estimate));
      const matchesDate =
        !dateRange?.length ||
        (estimate?.submittedAt &&
          moment(estimate.submittedAt).isBetween(dateRange[0], dateRange[1], 'day', '[]'));

      if (!normalizedSearch) {
        return matchesStatus && matchesReview && matchesDate;
      }

      const haystack = [
        claim.id,
        claim.coverage?.vehicleNo,
        claim.workshopAppointment?.workshopName,
        estimate?.workshopName,
        estimate?.status,
        estimate?.reviewMode,
        estimate?.reviewNote,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStatus && matchesReview && matchesDate && haystack.includes(normalizedSearch);
    }).sort((left, right) => {
      const leftTime = new Date(left.workshopRepairEstimate?.submittedAt || 0).getTime();
      const rightTime = new Date(right.workshopRepairEstimate?.submittedAt || 0).getTime();
      return rightTime - leftTime;
    });
  }, [dateRange, reviewFilter, searchText, statusFilter, workshopClaims]);

  const statusOptions = [
    'All',
    ...new Set(workshopClaims.map((claim) => claim.workshopRepairEstimate?.status).filter(Boolean)),
  ];

  const approvedCount = workshopClaims.filter((claim) => claim.workshopRepairEstimate?.isStpApproved).length;
  const manualReviewCount = workshopClaims.filter((claim) =>
    needsWorkshopManualReview(claim.workshopRepairEstimate)
  ).length;
  const waitingUpdateCount = workshopClaims.filter((claim) =>
    isWorkshopWaitingForUpdate(claim.workshopRepairEstimate)
  ).length;

  const columns = [
    {
      title: 'Claim',
      key: 'claim',
      width: 180,
      render: (_, claim) => (
        <Space direction="vertical" size={2}>
          <Text strong>{claim.id}</Text>
          <Text type="secondary">{claim.type || 'Vehicle claim'}</Text>
        </Space>
      ),
    },
    {
      title: 'Vehicle No',
      key: 'vehicleNo',
      width: 160,
      render: (_, claim) => <Text strong>{claim.coverage?.vehicleNo || 'Not available'}</Text>,
    },
    {
      title: 'Workshop',
      key: 'workshop',
      width: 240,
      render: (_, claim) => (
        <Text strong>
          {claim.workshopRepairEstimate?.workshopName || claim.workshopAppointment?.workshopName || 'Panel workshop'}
        </Text>
      ),
    },
    {
      title: 'Submitted At',
      key: 'submittedAt',
      width: 180,
      render: (_, claim) =>
        claim.workshopRepairEstimate?.submittedAt
          ? moment(claim.workshopRepairEstimate.submittedAt).format('DD MMM YYYY, hh:mm A')
          : 'Not available',
    },
    {
      title: 'Estimate Status',
      key: 'estimateStatus',
      width: 170,
      render: (_, claim) => (
        <Tag color={getEstimateStatusColor(claim.workshopRepairEstimate?.status)}>
          {formatEstimateStatus(claim.workshopRepairEstimate?.status)}
        </Tag>
      ),
    },
    {
      title: 'Review Flow',
      key: 'reviewFlow',
      width: 220,
      render: (_, claim) => {
        const estimate = claim.workshopRepairEstimate;
        return (
          <Space direction="vertical" size={4}>
            <Tag color={estimate?.isStpApproved ? 'green' : 'orange'}>
              {estimate?.isStpApproved ? 'STP Approved' : formatReviewMode(estimate?.reviewMode)}
            </Tag>
            <Text type="secondary">{getWorkshopReviewSummary(estimate)}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Amount',
      key: 'amount',
      width: 120,
      render: (_, claim) => <Text strong>RM {Number(claim.workshopRepairEstimate?.totalAmount || 0).toFixed(2)}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      fixed: 'right',
      render: (_, claim) => (
        <Button icon={<EyeOutlined />} onClick={() => setSelectedClaim(claim)}>
          Review
        </Button>
      ),
    },
  ];

  const title = mode === 'manual-review' ? 'Workshop Manual Review' : 'All Workshop Submissions';
  const description =
    mode === 'manual-review'
      ? 'Focus on workshop quotations that still need officer attention before they can move forward.'
      : 'Review all quotation submissions sent by panel workshops, including their estimate status and review flow.';

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ marginBottom: 6 }}>
          {title}
        </Title>
        <Text type="secondary">{description}</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={8}>
          <Card style={{ borderRadius: 18 }}>
            <Statistic title="Total Submissions" value={workshopClaims.length} prefix={<ToolOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={{ borderRadius: 18 }}>
            <Statistic title="STP Approved" value={approvedCount} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={{ borderRadius: 18 }}>
            <Statistic title="Need Review" value={manualReviewCount} prefix={<SafetyCertificateOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 18 }}>
        <Space style={{ width: '100%', marginBottom: 16 }} wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search claim, vehicle, workshop or estimate status"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            style={{ width: 360 }}
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 220 }}
            options={statusOptions.map((status) => ({
              label: status === 'All' ? 'All Submission Statuses' : formatEstimateStatus(status),
              value: status,
            }))}
          />

          <Select
            value={reviewFilter}
            onChange={setReviewFilter}
            style={{ width: 220 }}
            options={[
              { label: 'All Review Flows', value: 'All' },
              { label: 'STP Approved', value: 'STP Approved' },
              { label: 'Manual Review', value: 'Manual Review' },
              { label: 'Waiting Workshop Update', value: 'Waiting Workshop Update' },
            ]}
          />

          <DatePicker.RangePicker
            value={dateRange}
            onChange={(values) => setDateRange(values || [])}
            allowClear
          />

          <Tag color="processing" icon={<FileSearchOutlined />} style={{ padding: '6px 10px' }}>
            {filteredClaims.length} submission(s)
          </Tag>

          {waitingUpdateCount ? (
            <Tag color="purple" style={{ padding: '6px 10px' }}>
              {waitingUpdateCount} waiting workshop update
            </Tag>
          ) : null}

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
          rowKey={(claim) => `${claim.id}-${claim.workshopRepairEstimate?.estimateId || 'estimate'}`}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1320 }}
          locale={{
            emptyText: (
              <Empty
                description={
                  mode === 'manual-review'
                    ? 'No workshop submissions need manual review right now'
                    : 'No workshop submissions available yet'
                }
              />
            ),
          }}
          onRow={(claim) => ({
            onClick: () => setSelectedClaim(claim),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <WorkshopSubmissionReviewDrawer
        claim={selectedClaim}
        open={Boolean(selectedClaim)}
        onClose={() => setSelectedClaim(null)}
        onWorkflowUpdated={onClaimsChanged}
      />
    </div>
  );
}

function normalizeValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function isWorkshopWaitingForUpdate(estimate) {
  const normalizedStatus = normalizeValue(estimate?.status);
  return normalizedStatus === 'revisionrequested';
}

function needsWorkshopManualReview(estimate) {
  if (!estimate) {
    return false;
  }

  if (estimate.isStpApproved) {
    return false;
  }

  const normalizedStatus = normalizeValue(estimate.status);
  const normalizedReviewMode = normalizeValue(estimate.reviewMode);

  if (['approved', 'rejected', 'stpapproved'].includes(normalizedStatus)) {
    return false;
  }

  if (normalizedStatus === 'revisionrequested') {
    return false;
  }

  return ['submitted', 'pendingmanualreview', 'manualreview', 'pending'].includes(normalizedStatus) ||
    ['manualreview', 'manual review', 'officerreview'].includes(normalizedReviewMode) ||
    Number(estimate.totalAmount || 0) > 2000;
}

function getWorkshopReviewSummary(estimate) {
  if (!estimate) {
    return 'No review flow';
  }

  if (estimate.isStpApproved) {
    return 'Straight-through approved';
  }

  if (isWorkshopWaitingForUpdate(estimate)) {
    return 'Waiting for workshop update';
  }

  if (needsWorkshopManualReview(estimate)) {
    return 'Officer review required';
  }

  return formatReviewMode(estimate.reviewMode);
}

export default WorkshopSubmissionsOfficerScreen;
