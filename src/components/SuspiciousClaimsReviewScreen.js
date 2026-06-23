import React, { useMemo, useState } from 'react';
import { Button, Card, Empty, Input, Select, Space, Statistic, Table, Tag, Typography } from 'antd';
import { EyeOutlined, FlagOutlined, ReloadOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons';
import moment from 'moment';
import ClaimWorkflowDrawer from './ClaimWorkflowDrawer';

const { Title, Text } = Typography;

function SuspiciousClaimsReviewScreen({ claims = [], loading = false, onRefresh, onClaimsChanged }) {
  const [searchText, setSearchText] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [selectedClaim, setSelectedClaim] = useState(null);

  const suspiciousClaims = useMemo(() => {
    return claims
      .filter((claim) => isSuspiciousClaim(claim))
      .map((claim) => {
        const suspiciousSignals = getSuspiciousSignals(claim);
        const severity = getSuspiciousSeverity(claim, suspiciousSignals);

        return {
          ...claim,
          suspiciousSignals,
          severity,
          primaryReason:
            claim.manualReviewFlagReason ||
            suspiciousSignals[0] ||
            'Flagged for officer investigation',
        };
      })
      .sort((left, right) => {
        const severityCompare = getSeverityValue(right.severity) - getSeverityValue(left.severity);
        if (severityCompare !== 0) {
          return severityCompare;
        }

        return new Date(right.createdAt || right.date || 0) - new Date(left.createdAt || left.date || 0);
      });
  }, [claims]);

  const filteredClaims = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return suspiciousClaims.filter((claim) => {
      const matchesSeverity = severityFilter === 'All' || claim.severity === severityFilter;
      if (!matchesSeverity) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        claim.id,
        claim.coverageId,
        claim.coverage?.vehicleNo,
        claim.coverage?.coverageType,
        claim.status,
        claim.stpStatus,
        claim.primaryReason,
        claim.manualReviewFlagReason,
        ...(claim.suspiciousSignals || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [searchText, severityFilter, suspiciousClaims]);

  const stats = useMemo(() => {
    const high = suspiciousClaims.filter((claim) => claim.severity === 'High').length;
    const medium = suspiciousClaims.filter((claim) => claim.severity === 'Medium').length;
    const repeatCoverageFlags = suspiciousClaims.filter((claim) =>
      /another submitted claim within the last|last 30 days|same coverage/i.test(
        claim.manualReviewFlagReason || ''
      )
    ).length;

    return {
      total: suspiciousClaims.length,
      high,
      medium,
      repeatCoverageFlags,
    };
  }, [suspiciousClaims]);

  const columns = [
    {
      title: 'Claim ID',
      dataIndex: 'id',
      key: 'id',
      width: 180,
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 140,
      render: (value) => <Tag color={getSeverityColor(value)}>{value} Risk</Tag>,
    },
    {
      title: 'Main Reason',
      key: 'reason',
      width: 360,
      render: (_, claim) => (
        <Space direction="vertical" size={3}>
          <Text strong>{claim.primaryReason}</Text>
          <Text type="secondary">
            {claim.suspiciousSignals.length} signal{claim.suspiciousSignals.length === 1 ? '' : 's'} detected
          </Text>
        </Space>
      ),
    },
    {
      title: 'Coverage',
      key: 'coverage',
      width: 220,
      render: (_, claim) => (
        <Space direction="vertical" size={3}>
          <Text>{claim.coverage?.vehicleNo || 'Vehicle not available'}</Text>
          <Text type="secondary">{claim.coverage?.coverageType || 'Coverage type not available'}</Text>
        </Space>
      ),
    },
    {
      title: 'Workflow',
      key: 'workflow',
      width: 220,
      render: (_, claim) => (
        <Space direction="vertical" size={3}>
          <Tag color="orange">{claim.status || 'Pending Manual Review'}</Tag>
        </Space>
      ),
    },
    {
      title: 'Submitted',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (value) => (value ? moment(value).format('DD MMM YYYY') : 'Not available'),
    },
    {
      title: 'Action',
      key: 'action',
      width: 110,
      fixed: 'right',
      render: (_, claim) => (
        <Button icon={<EyeOutlined />} onClick={() => setSelectedClaim(claim)}>
          Review
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
            Suspicious Claims
          </Title>
          <Text className="portal-dashboard-description">
            Only repeat-claim cases flagged for another submission within 30 days are shown here.
          </Text>
          <div className="portal-dashboard-chip-row">
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Flagged Claims</span>
              <span className="portal-dashboard-chip-value">{stats.total}</span>
            </div>
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">High Risk</span>
              <span className="portal-dashboard-chip-value">{stats.high}</span>
            </div>
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Repeat Within 30 Days</span>
              <span className="portal-dashboard-chip-value">{stats.repeatCoverageFlags}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="portal-dashboard-grid" style={{ marginBottom: 20 }}>
        <div className="portal-dashboard-span-3">
          <Card className="portal-dashboard-stat">
            <Statistic title="Flagged Claims" value={stats.total} prefix={<FlagOutlined />} />
          </Card>
        </div>
        <div className="portal-dashboard-span-3">
          <Card className="portal-dashboard-stat">
            <Statistic title="High Risk" value={stats.high} prefix={<WarningOutlined />} />
          </Card>
        </div>
        <div className="portal-dashboard-span-3">
          <Card className="portal-dashboard-stat">
            <Statistic title="Medium Risk" value={stats.medium} prefix={<WarningOutlined />} />
          </Card>
        </div>
        <div className="portal-dashboard-span-3">
          <Card className="portal-dashboard-stat">
            <Statistic title="Repeat Coverage Flags" value={stats.repeatCoverageFlags} prefix={<FlagOutlined />} />
          </Card>
        </div>
      </div>

      <Card style={{ borderRadius: 16 }}>
        <Space style={{ width: '100%', marginBottom: 16, justifyContent: 'space-between' }} wrap>
          <Space wrap>
            <Input
              allowClear
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              prefix={<SearchOutlined />}
              placeholder="Search claim ID, coverage, vehicle, or suspicious reason"
              style={{ width: 380 }}
            />
            <Select
              value={severityFilter}
              onChange={setSeverityFilter}
              style={{ width: 180 }}
              options={[
                { label: 'All severities', value: 'All' },
                { label: 'High risk', value: 'High' },
                { label: 'Medium risk', value: 'Medium' },
              ]}
            />
          </Space>

          <Button icon={<ReloadOutlined />} onClick={() => onRefresh?.()}>
            Refresh
          </Button>
        </Space>

        {filteredClaims.length === 0 ? (
          <Empty description="No suspicious claims found for the current filters." />
        ) : (
          <Table
            rowKey="id"
            loading={loading}
            dataSource={filteredClaims}
            columns={columns}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 1250 }}
            expandable={{
              expandedRowRender: (claim) => (
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  <div>
                    <Text strong>Email delivery</Text>
                    <div style={{ marginTop: 6 }}>
                      <Tag color={claim.emailNotificationSent === true ? 'success' : claim.emailNotificationSent === false ? 'error' : 'default'}>
                        {claim.emailNotificationSent === true
                          ? 'Delivered'
                          : claim.emailNotificationSent === false
                            ? 'Failed'
                            : 'Delivered'}
                      </Tag>
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        {claim.emailNotificationMessage || 'The backend did not return a delivery message for this claim.'}
                      </Text>
                    </div>
                  </div>

                  <div>
                    <Text strong>Suspicious signals</Text>
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {claim.suspiciousSignals.map((signal, index) => (
                        <Tag key={`${claim.id}-signal-${index}`} color="orange">
                          {signal}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </Space>
              ),
            }}
          />
        )}
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

function isSuspiciousClaim(claim) {
  return (
    claim.isFlaggedForManualReview &&
    /another submitted claim within the last|last 30 days|same coverage/i.test(
      claim.manualReviewFlagReason || ''
    )
  );
}

function getSuspiciousSignals(claim) {
  return claim.manualReviewFlagReason
    ? [claim.manualReviewFlagReason]
    : ['Another claim was submitted within the last 30 days'];
}

function getSuspiciousSeverity(claim, suspiciousSignals) {
  if (suspiciousSignals.some((signal) => /last 30 days|same coverage/i.test(signal))) {
    return 'High';
  }

  return 'Medium';
}

function getSeverityValue(severity) {
  switch (severity) {
    case 'High':
      return 2;
    case 'Medium':
      return 1;
    default:
      return 0;
  }
}

function getSeverityColor(severity) {
  switch (severity) {
    case 'High':
      return 'red';
    case 'Medium':
      return 'orange';
    default:
      return 'default';
  }
}

// function formatStpLabel(stpStatus) {
//   if (!stpStatus) {
//     return 'STP status not available';
//   }

//   if (stpStatus === 'AutoApproved') {
//     return 'STP auto approved';
//   }

//   if (stpStatus === 'ManualReview') {
//     return 'STP manual review';
//   }

//   return stpStatus;
// }

export default SuspiciousClaimsReviewScreen;
