import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  Input,
  List,
  Modal,
  Row,
  Col,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { EyeOutlined, FileTextOutlined, SearchOutlined } from '@ant-design/icons';
import moment from 'moment';

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
    <div style={{ padding: 24 }}>
      <Title level={2}>Claim History</Title>
      <Text type="secondary">Review past submissions, officer decisions, STP results, and workshop bookings.</Text>

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
                {claim.reviewStatus ? <Tag color="blue">{formatReviewStatus(claim.reviewStatus)}</Tag> : null}
                <Tag color={claim.isStpApproved ? 'green' : 'orange'}>{claim.isStpApproved ? 'STP Passed' : 'Manual Review'}</Tag>
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

      <Modal open={Boolean(selectedClaim)} onCancel={() => setSelectedClaim(null)} footer={null} width={760} title={selectedClaim ? `Claim ${selectedClaim.id}` : 'Claim details'}>
        {selectedClaim ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card title="Submitted Claim Details">
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Claim ID">{selectedClaim.id}</Descriptions.Item>
                <Descriptions.Item label="Status">{selectedClaim.status}</Descriptions.Item>
                <Descriptions.Item label="Review status">{formatReviewStatus(selectedClaim.reviewStatus)}</Descriptions.Item>
                <Descriptions.Item label="STP status">{selectedClaim.stpStatus || 'Not available'}</Descriptions.Item>
                <Descriptions.Item label="Claim type">{selectedClaim.type}</Descriptions.Item>
                <Descriptions.Item label="Submitted at">{moment(selectedClaim.date).format('DD MMM YYYY, hh:mm A')}</Descriptions.Item>
                <Descriptions.Item label="Incident date">
                  {selectedClaim.incidentDate ? moment(selectedClaim.incidentDate).format('DD MMM YYYY') : 'Not available'}
                </Descriptions.Item>
                <Descriptions.Item label="Description">{selectedClaim.incidentDescription || 'No description'}</Descriptions.Item>
                <Descriptions.Item label="Officer note">{selectedClaim.officerDecisionNote || 'No officer note'}</Descriptions.Item>
                <Descriptions.Item label="Requested items">
                  {selectedClaim.requestedItems?.length ? selectedClaim.requestedItems.map((item) => item.label).join(', ') : 'None'}
                </Descriptions.Item>
                <Descriptions.Item label="Customer response note">{selectedClaim.customerResponseNote || 'No response note'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Coverage Details">
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Coverage ID">{getRelatedCoverage(selectedClaim, coverages)?.coverageId || selectedClaim.coverageId || 'Not available'}</Descriptions.Item>
                <Descriptions.Item label="Insured person">
                  {getRelatedCoverage(selectedClaim, coverages)?.insuredPersonName || 'Not available'}
                </Descriptions.Item>
                <Descriptions.Item label="Vehicle number">
                  {getRelatedCoverage(selectedClaim, coverages)?.vehicleNo || selectedClaim.vehicleRegistration || 'Not available'}
                </Descriptions.Item>
                <Descriptions.Item label="Coverage type">
                  {getRelatedCoverage(selectedClaim, coverages)?.coverageType || 'Not available'}
                </Descriptions.Item>
                <Descriptions.Item label="Effective date">
                  {getRelatedCoverage(selectedClaim, coverages)?.effectiveDate
                    ? moment(getRelatedCoverage(selectedClaim, coverages)?.effectiveDate).format('DD MMM YYYY')
                    : 'Not available'}
                </Descriptions.Item>
                <Descriptions.Item label="Expiry date">
                  {getRelatedCoverage(selectedClaim, coverages)?.expiryDate
                    ? moment(getRelatedCoverage(selectedClaim, coverages)?.expiryDate).format('DD MMM YYYY')
                    : 'Not available'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {selectedClaim.workshopAppointment ? (
              <Card title="Workshop appointment">
                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label="Workshop">{selectedClaim.workshopAppointment.workshopName}</Descriptions.Item>
                  <Descriptions.Item label="Address">{selectedClaim.workshopAppointment.workshopAddress}</Descriptions.Item>
                  <Descriptions.Item label="Date">{moment(selectedClaim.workshopAppointment.preferredDate).format('DD MMM YYYY')}</Descriptions.Item>
                  <Descriptions.Item label="Time">{formatTimeRange(selectedClaim.workshopAppointment.timeSlotStart, selectedClaim.workshopAppointment.timeSlotEnd)}</Descriptions.Item>
                  <Descriptions.Item label="Status">{selectedClaim.workshopAppointment.status || 'Pending'}</Descriptions.Item>
                </Descriptions>
              </Card>
            ) : null}

            <Card title={<Space><FileTextOutlined /><span>Submitted Documents</span></Space>}>
              {selectedClaim.documents?.length ? (
                <List
                  dataSource={selectedClaim.documents}
                  renderItem={(document) => (
                    <List.Item actions={[<Button key="view" onClick={() => openDocument(document.url)}>View</Button>]}>
                      <List.Item.Meta
                        title={document.label}
                        description={
                          <Space direction="vertical" size={2}>
                            <Text>{document.fileName || 'Uploaded file'}</Text>
                            <Text type="secondary" copyable>{document.url}</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="No submitted documents returned by the backend" />
              )}

              {selectedClaim.responseDocuments?.length ? (
                <>
                  <Divider />
                  <Title level={5}>Customer Response Documents</Title>
                  <List
                    dataSource={selectedClaim.responseDocuments}
                    renderItem={(url, index) => (
                      <List.Item actions={[<Button key="view" onClick={() => openDocument(url)}>View</Button>]}>
                        <List.Item.Meta title={`Response document ${index + 1}`} description={<Text type="secondary" copyable>{url}</Text>} />
                      </List.Item>
                    )}
                  />
                </>
              ) : null}
            </Card>
          </Space>
        ) : null}
      </Modal>
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

function formatReviewStatus(status) {
  if (!status) {
    return 'Not available';
  }

  return String(status)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatTimeRange(start, end) {
  if (!start || !end) {
    return 'Not available';
  }

  const normalize = (value) => String(value).slice(0, 5);
  return `${moment(normalize(start), 'HH:mm').format('hh:mm A')} - ${moment(normalize(end), 'HH:mm').format('hh:mm A')}`;
}

function getRelatedCoverage(claim, coverages) {
  return claim.relatedCoverage || coverages.find((coverage) => coverage.coverageId === claim.coverageId) || null;
}

function openDocument(url) {
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export default ClaimHistoryScreen;
