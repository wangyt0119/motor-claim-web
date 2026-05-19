import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Input,
  Row,
  Col,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import moment from 'moment';
import ClaimDetailsModal from './ClaimDetailsModal';

const { Title, Text } = Typography;

function ClaimHistoryScreen({ claims = [], coverages = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);

  useEffect(() => {
    let nextClaims = [...claims];

    if (statusFilter !== 'All') {
      nextClaims = nextClaims.filter((claim) => claim.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      nextClaims = nextClaims.filter((claim) =>
        [claim.id, claim.type, claim.vehicleRegistration, claim.status, claim.reviewStatus]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)
      );
    }

    nextClaims.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
    setFilteredClaims(nextClaims);
  }, [claims, searchQuery, statusFilter]);

  const statusOptions = ['All', ...new Set(claims.map((claim) => claim.status).filter(Boolean))];

  return (
    <div className="portal-dashboard-stack">
      <div className="portal-dashboard-hero portal-dashboard-theme-soft">
        <div className="portal-dashboard-hero-content">
          <span className="portal-dashboard-kicker portal-dashboard-kicker-soft">Claim History</span>
          <Title level={2} className="portal-dashboard-title">Claim History</Title>
          <Text className="portal-dashboard-description">
            Review past submissions, officer decisions, workshop bookings, and completed workshop updates.
          </Text>
          <div className="portal-dashboard-chip-row">
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">All Claims</span>
              <span className="portal-dashboard-chip-value">{claims.length}</span>
            </div>
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Shown</span>
              <span className="portal-dashboard-chip-value">{filteredClaims.length}</span>
            </div>
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Coverages</span>
              <span className="portal-dashboard-chip-value">{coverages.length}</span>
            </div>
          </div>
        </div>
      </div>

      <Row gutter={16} style={{ marginTop: 24, marginBottom: 24 }}>
        <Col xs={24} md={16}>
          <Input
            placeholder="Search by claim ID, type, vehicle, or status"
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </Col>
        <Col xs={24} md={8}>
          <Select style={{ width: '100%' }} value={statusFilter} onChange={setStatusFilter}>
            {statusOptions.map((status) => (
              <Select.Option key={status} value={status}>{status}</Select.Option>
            ))}
          </Select>
        </Col>
      </Row>

      {filteredClaims.length ? (
        filteredClaims.map((claim) => (
          <Card key={claim.id} style={{ marginBottom: 16, borderRadius: 16 }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Space wrap>
                <Tag color={getStatusColor(claim.status)}>{claim.status}</Tag>
                {claim.workshopAppointment ? <Tag color="cyan">Workshop booked</Tag> : null}
                {claim.workshopRepairEstimate ? <Tag color="green">Workshop submitted</Tag> : null}
              </Space>

              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Claim ID">{claim.id}</Descriptions.Item>
                <Descriptions.Item label="Type">{claim.type}</Descriptions.Item>
                <Descriptions.Item label="Submitted">{moment(claim.date).format('DD MMM YYYY')}</Descriptions.Item>
                <Descriptions.Item label="Vehicle">{claim.vehicleRegistration || 'Not available'}</Descriptions.Item>
                <Descriptions.Item label="Officer note">{claim.officerDecisionNote || 'No officer note'}</Descriptions.Item>
                <Descriptions.Item label="Workshop booking">
                  {claim.workshopAppointment
                    ? `${claim.workshopAppointment.workshopName} on ${moment(claim.workshopAppointment.preferredDate).format('DD MMM YYYY')}`
                    : 'No workshop booking'}
                </Descriptions.Item>
              </Descriptions>

              <Button type="link" icon={<EyeOutlined />} style={{ color: '#FF6600', padding: 0 }} onClick={() => setSelectedClaim(claim)}>
                View Details
              </Button>
            </Space>
          </Card>
        ))
      ) : (
        <Empty description="No claims found matching your criteria" />
      )}

      <ClaimDetailsModal
        claim={selectedClaim}
        coverages={coverages}
        open={Boolean(selectedClaim)}
        onClose={() => setSelectedClaim(null)}
      />
    </div>
  );
}

function getStatusColor(status) {
  switch ((status || '').toLowerCase()) {
    case 'approved':
      return 'green';
    case 'rejected':
      return 'red';
    case 'pending customer action':
      return 'purple';
    case 'customer responded':
      return 'blue';
    case 'pending manual review':
      return 'orange';
    default:
      return 'gold';
  }
}

export default ClaimHistoryScreen;
