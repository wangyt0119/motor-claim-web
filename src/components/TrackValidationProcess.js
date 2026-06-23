import React, { useState, useMemo, useCallback } from 'react';
import { 
  Card, Typography, Table, Tag, Button, Space, Input, 
  Row, Col, Select, Progress,
  Empty, Modal, Steps, Timeline, List, Avatar, Spin
} from 'antd';
import { 
  SearchOutlined, 
  ClearOutlined, 
  EyeOutlined, 
  CheckCircleOutlined, 
  WarningOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
  FolderOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileOutlined,
  RobotOutlined,
  SafetyOutlined,
  FieldTimeOutlined,
  CloseOutlined,
  CheckOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Step } = Steps;

// Helper function to create validation claim data
const createValidationClaim = ({
  claimId,
  submissionDate,
  documentStatus,
  aiAssessment,
  policyStatus,
  routingStatus,
  currentStep,
  totalSteps,
  documents,
  aiSummary,
  policyInfo,
  timeline
}) => ({
  claimId,
  submissionDate,
  documentStatus,
  aiAssessment,
  policyStatus,
  routingStatus,
  currentStep,
  totalSteps,
  documents,
  aiSummary,
  policyInfo,
  timeline
});

// Helper function to create validation event
const createValidationEvent = (title, date) => ({
  title,
  date
});

function TrackValidationProcess({ claims = [], loading = false, onRefresh = null }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedAIFilter, setSelectedAIFilter] = useState('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState('All');
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  const validationClaims = useMemo(
    () => claims.map(mapClaimToValidationClaim),
    [claims]
  );

  const matchesDateFilter = useCallback((date) => {
    const now = moment();
    switch (selectedDateFilter) {
      case 'Today':
        return moment(date).isSame(now, 'day');
      case 'This Week':
        return moment(now).diff(moment(date), 'days') <= 7;
      case 'This Month':
        return moment(date).isSame(now, 'month');
      default:
        return true;
    }
  }, [selectedDateFilter]);

  const filteredClaims = useMemo(() => {
    return validationClaims
      .filter((claim) => {
        const matchesSearch = searchQuery === '' ||
          claim.claimId.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = selectedStatusFilter === 'All' ||
          claim.routingStatus.includes(selectedStatusFilter);

        const matchesAI = selectedAIFilter === 'All' ||
          claim.aiAssessment === selectedAIFilter;

        const matchesDate = selectedDateFilter === 'All' ||
          matchesDateFilter(claim.submissionDate);

        return matchesSearch && matchesStatus && matchesAI && matchesDate;
      })
      .sort((left, right) => new Date(right.submissionDate).getTime() - new Date(left.submissionDate).getTime());
  }, [matchesDateFilter, searchQuery, selectedStatusFilter, selectedAIFilter, selectedDateFilter, validationClaims]);

  // Helper functions for status colors
  const getDocumentStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'complete': return '#4CAF50';
      case 'incomplete': return '#E53E3E';
      default: return '#6C757D';
    }
  };

  const getAIStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'valid': return '#4CAF50';
      case 'inconclusive': return '#FF9800';
      case 'processing': return '#2196F3';
      case 'pending': return '#9E9E9E';
      default: return '#6C757D';
    }
  };

  const getPolicyStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active': return '#4CAF50';
      case 'not covered': return '#E53E3E';
      case 'inactive': return '#E53E3E';
      case 'pending': return '#2196F3';
      default: return '#6C757D';
    }
  };

  const getRoutingStatusColor = (status) => {
    if (status.includes('Approved')) return '#4CAF50';
    if (status.includes('Manual Review')) return '#FF9800';
    if (status.includes('In Progress')) return '#2196F3';
    return '#6C757D';
  };

  const getRoutingStatusIcon = (status) => {
    if (status.includes('Approved')) return <CheckCircleOutlined />;
    if (status.includes('Manual Review')) return <WarningOutlined />;
    if (status.includes('In Progress')) return <LoadingOutlined />;
    return <QuestionCircleOutlined />;
  };

  const getProgressStepName = (step) => {
    switch (step) {
      case 1: return 'Submitted';
      case 2: return 'Document Check';
      case 3: return 'AI Analysis';
      case 4: return 'Policy Check';
      case 5: return 'Routed';
      default: return 'Unknown';
    }
  };

  const getDocumentIcon = (filename) => {
    const value = typeof filename === 'string' ? filename : filename?.fileName || filename?.label || '';
    if (value.toLowerCase().includes('.pdf')) return <FilePdfOutlined />;
    if (value.toLowerCase().includes('.jpg') || value.toLowerCase().includes('.jpeg') || value.toLowerCase().includes('.png')) return <FileImageOutlined />;
    return <FileOutlined />;
  };

  // Show claim details modal
  const showClaimDetails = (claim) => {
    setSelectedClaim(claim);
    setDetailsModalVisible(true);
  };

  // Render empty state
  const renderEmptyState = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <div>
          <Text strong style={{ fontSize: 18, color: '#6C757D' }}>No claims found</Text>
          <br />
          <Text style={{ color: '#6C757D' }}>Try adjusting your search or filter criteria</Text>
        </div>
      }
    >
      <Button 
        type="primary" 
        onClick={() => {
          setSearchQuery('');
          setSelectedStatusFilter('All');
          setSelectedAIFilter('All');
          setSelectedDateFilter('All');
        }}
      >
        Clear Filters
      </Button>
    </Empty>
  );

  // Table columns
  const columns = [
    {
      title: 'Claim ID',
      dataIndex: 'claimId',
      key: 'claimId',
      render: (text) => (
        <Text strong>{text}</Text>
      ),
    },
    {
      title: 'Submission Date',
      dataIndex: 'submissionDate',
      key: 'submissionDate',
      defaultSortOrder: 'descend',
      sorter: (left, right) => new Date(left.submissionDate).getTime() - new Date(right.submissionDate).getTime(),
      render: (date) => (
        <Text type="secondary">
          {moment(date).format('DD MMM YYYY')}<br />
          {moment(date).format('HH:mm')}
        </Text>
      ),
    },
    {
      title: 'Document Status',
      dataIndex: 'documentStatus',
      key: 'documentStatus',
      render: (status) => (
        <Tag color={getDocumentStatusColor(status)} style={{ borderRadius: 12 }}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'OCR Assessment',
      dataIndex: 'aiAssessment',
      key: 'aiAssessment',
      render: (status) => (
        <Tag color={getAIStatusColor(status)} style={{ borderRadius: 12 }}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Policy Status',
      dataIndex: 'policyStatus',
      key: 'policyStatus',
      render: (status) => (
        <Tag color={getPolicyStatusColor(status)} style={{ borderRadius: 12 }}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Routing Status',
      dataIndex: 'routingStatus',
      key: 'routingStatus',
      render: (status) => (
        <Space>
          {getRoutingStatusIcon(status)}
          <Text style={{ color: getRoutingStatusColor(status) }}>{status}</Text>
        </Space>
      ),
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Progress 
              percent={(record.currentStep / record.totalSteps) * 100} 
              size="small" 
              showInfo={false}
              strokeColor={record.currentStep === record.totalSteps ? '#4CAF50' : '#FF6600'}
            />
            <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
              {record.currentStep}/{record.totalSteps}
            </Text>
          </div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {getProgressStepName(record.currentStep)}
          </Text>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          icon={<EyeOutlined />} 
          size="small" 
          type="primary" 
          style={{ 
            backgroundColor: 'rgba(255, 102, 0, 0.1)', 
            borderColor: 'rgba(255, 102, 0, 0.1)',
            color: '#FF6600'
          }}
          onClick={() => showClaimDetails(record)}
        >
          View
        </Button>
      ),
    },
  ];

  // Render claim details modal
  const renderClaimDetailsModal = () => {
    if (!selectedClaim) return null;

    return (
      <Modal
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={null}
        width={1000}
        title={`Claim ${selectedClaim.claimId} - Validation Details`}
        closeIcon={<CloseOutlined />}
      >
        <div style={{ padding: '0 16px' }}>
          {/* Progress Steps */}
          <Card style={{ marginBottom: 24 }}>
            <Title level={5}>Validation Progress</Title>
            <Steps current={selectedClaim.currentStep - 1}>
              {[...Array(selectedClaim.totalSteps)].map((_, index) => (
                <Step 
                  key={index} 
                  title={getProgressStepName(index + 1)}
                  icon={selectedClaim.currentStep > index ? <CheckOutlined /> : null}
                />
              ))}
            </Steps>
          </Card>

          {/* Details Sections */}
          <Row gutter={24}>
            <Col span={16}>
              <Card 
                title={
                  <Space>
                    <FolderOutlined style={{ color: '#FF6600' }} />
                    <span>Uploaded Documents</span>
                  </Space>
                } 
                style={{ marginBottom: 24 }}
              >
                <List
                  dataSource={selectedClaim.documents}
                  renderItem={doc => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            icon={getDocumentIcon(doc)} 
                            style={{ backgroundColor: '#f0f0f0', color: '#6C757D' }} 
                          />
                        }
                        title={
                          <Space wrap>
                            <Text strong>{doc.label}</Text>
                            <Tag color={getDocumentValidationColor(doc.status)}>{doc.status}</Tag>
                            {doc.ocrStatus ? <Tag color={getDocumentValidationColor(doc.ocrStatus)}>{doc.ocrStatus}</Tag> : null}
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={4}>
                            <Text type="secondary">{doc.fileName}</Text>
                            <Text type="secondary">{doc.message}</Text>
                          </Space>
                        }
                      />
                      {doc.status === 'Issue Found' ? (
                        <WarningOutlined style={{ color: '#FF9800' }} />
                      ) : (
                        <CheckCircleOutlined style={{ color: '#4CAF50' }} />
                      )}
                    </List.Item>
                  )}
                />
              </Card>

              <Card 
                title={
                  <Space>
                    <RobotOutlined style={{ color: '#2196F3' }} />
                    <span>AI Damage Analysis</span>
                  </Space>
                }
              >
                <div style={{ padding: 16, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                  <Tag 
                    color={getAIStatusColor(selectedClaim.aiAssessment)} 
                    style={{ marginBottom: 12 }}
                  >
                    {selectedClaim.aiAssessment}
                  </Tag>
                  <Paragraph>{selectedClaim.aiSummary}</Paragraph>
                </div>
              </Card>
            </Col>

            <Col span={8}>
              <Card 
                title={
                  <Space>
                    <SafetyOutlined style={{ color: '#9C27B0' }} />
                    <span>Policy Information</span>
                  </Space>
                } 
                style={{ marginBottom: 24 }}
              >
                <div style={{ padding: 16, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                  <Tag 
                    color={getPolicyStatusColor(selectedClaim.policyStatus)} 
                    style={{ marginBottom: 12 }}
                  >
                    {selectedClaim.policyStatus}
                  </Tag>
                  <Paragraph>{selectedClaim.policyInfo}</Paragraph>
                </div>
              </Card>

              <Card 
                title={
                  <Space>
                    <FieldTimeOutlined style={{ color: '#FF9800' }} />
                    <span>Validation Timeline</span>
                  </Space>
                }
              >
                <Timeline>
                  {selectedClaim.timeline.map((event, index) => (
                    <Timeline.Item key={index} color="#4CAF50">
                      <Text strong>{event.title}</Text>
                      <br />
                      <Text type="secondary">
                        {moment(event.date).format('DD MMM YYYY, HH:mm')}
                      </Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            </Col>
          </Row>
        </div>
      </Modal>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <div className="portal-dashboard-hero portal-dashboard-theme-soft" style={{ marginBottom: 24 }}>
        <div className="portal-dashboard-hero-content">
          <span className="portal-dashboard-kicker portal-dashboard-kicker-soft">Officer Review</span>
          <Title level={2} className="portal-dashboard-title">Track Validation Process</Title>
          <Text className="portal-dashboard-description">
            Monitor claim validation and routing progress in one view.
          </Text>
          <div className="portal-dashboard-chip-row">
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Claims</span>
              <span className="portal-dashboard-chip-value">{validationClaims.length}</span>
            </div>
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Shown</span>
              <span className="portal-dashboard-chip-value">{filteredClaims.length}</span>
            </div>
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Refresh</span>
              <span className="portal-dashboard-chip-value" style={{ cursor: 'pointer' }} onClick={() => onRefresh?.()}>Now</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Row gutter={[16, 16]}>
          <Col span={18}>
            <Search
              placeholder="Search by Claim ID..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={6}>
            <Button 
              icon={<ClearOutlined />} 
              onClick={() => {
                setSearchQuery('');
                setSelectedStatusFilter('All');
                setSelectedAIFilter('All');
                setSelectedDateFilter('All');
              }}
              size="large"
              style={{ width: '100%' }}
            >
              Clear Filters
            </Button>
          </Col>
          <Col span={8}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Status</Text>
            <Select
              value={selectedStatusFilter}
              onChange={(value) => setSelectedStatusFilter(value)}
              style={{ width: '100%' }}
            >
              <Option value="All">All</Option>
              <Option value="Approved">Approved</Option>
              <Option value="Manual Review">Manual Review</Option>
              <Option value="In Progress">In Progress</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>OCR Result</Text>
            <Select
              value={selectedAIFilter}
              onChange={(value) => setSelectedAIFilter(value)}
              style={{ width: '100%' }}
            >
              <Option value="All">All</Option>
              <Option value="Valid">Valid</Option>
              <Option value="Inconclusive">Inconclusive</Option>
              <Option value="Processing">Processing</Option>
              <Option value="Pending">Pending</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Date</Text>
            <Select
              value={selectedDateFilter}
              onChange={(value) => setSelectedDateFilter(value)}
              style={{ width: '100%' }}
            >
              <Option value="All">All</Option>
              <Option value="Today">Today</Option>
              <Option value="This Week">This Week</Option>
              <Option value="This Month">This Month</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Claims Table */}
      <Card style={{ borderRadius: 12 }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Spin size="large" />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Loading validation data...</Text>
            </div>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredClaims}
            rowKey="claimId"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: renderEmptyState() }}
          />
        )}
      </Card>

      {/* Claim Details Modal */}
      {renderClaimDetailsModal()}
    </div>
  );
}

function mapClaimToValidationClaim(claim) {
  const submissionDate = claim.createdAt || claim.date || claim.incidentDate || new Date();
  const validation = claim.validationResult || null;
  const coverage = claim.coverage || null;
  const documents = buildDocumentValidationChecklist(claim, validation);
  const policyStatus = resolvePolicyStatus(coverage);
  const aiAssessment = resolveAiAssessment(claim, validation);
  const routingStatus = resolveRoutingStatus(claim, validation);
  const timeline = buildClaimTimeline(claim, validation);

  return createValidationClaim({
    claimId: claim.id,
    submissionDate,
    documentStatus: documents.length > 0 && documents.every((document) => document.status !== 'Issue Found') ? 'Complete' : 'Incomplete',
    aiAssessment,
    policyStatus,
    routingStatus,
    currentStep: resolveCurrentStep(claim, validation),
    totalSteps: 5,
    documents,
    aiSummary: buildAiSummary(claim, validation),
    policyInfo: buildPolicyInfo(claim, coverage),
    timeline,
  });
}

function buildDocumentValidationChecklist(claim, validation) {
  const diagnostics = validation?.documentDiagnostics || [];

  return (claim.documents || []).map((document) => {
    const label = document.label || document.fileName || 'Uploaded document';
    const fileName = document.fileName || extractDisplayName(document.url) || label;
    const extension = String(document.extension || extractExtension(fileName)).toLowerCase();
    const diagnostic = findDocumentDiagnostic(label, diagnostics);
    const supportedFormat = ['pdf', 'jpg', 'jpeg', 'png'].includes(extension);

    if (diagnostic) {
      const ocrPassed = diagnostic.ocrSucceeded && diagnostic.confidencePassed && diagnostic.isMatched !== false;
      return {
        key: document.key || label,
        label,
        fileName,
        status: ocrPassed ? 'Validated' : 'Issue Found',
        ocrStatus: diagnostic.ocrSucceeded ? 'OCR checked' : 'OCR failed',
        message: buildOcrValidationMessage(diagnostic),
      };
    }

    return {
      key: document.key || label,
      label,
      fileName,
      status: supportedFormat ? 'Ready for Review' : 'Issue Found',
      ocrStatus: null,
      message: supportedFormat
        ? 'File uploaded successfully. Format is supported and available for officer review.'
        : 'File uploaded, but the file type is not one of the preferred formats: PDF, JPG, JPEG, or PNG.',
    };
  });
}

function findDocumentDiagnostic(label, diagnostics) {
  const normalizedLabel = normalizeDocumentName(label);

  return diagnostics.find((diagnostic) => {
    const normalizedDiagnosticName = normalizeDocumentName(diagnostic.documentName);
    return (
      normalizedLabel === normalizedDiagnosticName ||
      normalizedLabel.includes(normalizedDiagnosticName) ||
      normalizedDiagnosticName.includes(normalizedLabel) ||
      isGroupedOcrDocumentMatch(normalizedLabel, normalizedDiagnosticName)
    );
  });
}

function isGroupedOcrDocumentMatch(label, diagnosticName) {
  return (
    (label.includes('identity') && diagnosticName.includes('identity')) ||
    (label.includes('driving license') && diagnosticName.includes('driving license')) ||
    (label.includes('vehicle ownership') && diagnosticName.includes('vehicle ownership')) ||
    (label.includes('police report') && diagnosticName.includes('police report'))
  );
}

function buildOcrValidationMessage(diagnostic) {
  if (diagnostic.errorMessage) {
    return diagnostic.errorMessage;
  }

  if (diagnostic.matchMessage) {
    return diagnostic.matchMessage;
  }

  if (diagnostic.extractedName || diagnostic.extractedVehicleNumber) {
    return [
      diagnostic.extractedName ? `Name extracted: ${diagnostic.extractedName}` : null,
      diagnostic.extractedVehicleNumber ? `Vehicle extracted: ${diagnostic.extractedVehicleNumber}` : null,
    ].filter(Boolean).join(' | ');
  }

  return diagnostic.ocrSucceeded
    ? 'OCR check completed for this document.'
    : 'OCR was attempted but did not complete successfully.';
}

function getDocumentValidationColor(status) {
  switch (status) {
    case 'Validated':
      return 'green';
    case 'Ready for Review':
      return 'blue';
    case 'OCR checked':
      return 'purple';
    case 'OCR failed':
    case 'Issue Found':
      return 'orange';
    default:
      return 'default';
  }
}

function normalizeDocumentName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/document|file/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function extractDisplayName(url) {
  if (!url) {
    return '';
  }

  const cleanUrl = String(url).split('?')[0];
  const segments = cleanUrl.split('/');
  return segments[segments.length - 1] || cleanUrl;
}

function extractExtension(fileName) {
  const segments = String(fileName || '').split('.');
  return segments.length > 1 ? segments[segments.length - 1] : '';
}

function resolveAiAssessment(claim, validation) {
  if (!validation) {
    return 'Pending';
  }

  if (claim.status === 'Approved' || validation.isApproved) {
    return 'Valid';
  }

  if (validation.reasons?.length) {
    return 'Inconclusive';
  }

  if (validation.stpStatus === 'Pending') {
    return 'Processing';
  }

  return 'Pending';
}

function resolvePolicyStatus(coverage) {
  if (!coverage) {
    return 'Pending';
  }

  const expiryDate = coverage.expiryDate ? moment(coverage.expiryDate) : null;
  const effectiveDate = coverage.effectiveDate ? moment(coverage.effectiveDate) : null;
  const now = moment();

  if (effectiveDate?.isValid() && expiryDate?.isValid() && now.isBetween(effectiveDate, expiryDate, undefined, '[]')) {
    return 'Active';
  }

  if (expiryDate?.isValid() && expiryDate.isBefore(now)) {
    return 'Inactive';
  }

  return 'Pending';
}

function resolveRoutingStatus(claim, validation) {
  if (claim.status === 'Approved') {
    return claim.isStpApproved || validation?.stpStatus === 'AutoApproved'
      ? 'Approved - STP'
      : 'Approved';
  }

  if (claim.status === 'Rejected') {
    return 'Manual Review - Rejected';
  }

  if (String(claim.status || '').includes('Pending Customer Action')) {
    return 'Manual Review - Missing Documents';
  }

  if (String(claim.status || '').includes('Customer Responded')) {
    return 'In Progress - Customer Response';
  }

  if (validation?.reasons?.length || validation?.stpStatus === 'ManualReview') {
    return 'Manual Review - AI Inconclusive';
  }

  if (validation?.stpStatus === 'Pending') {
    return 'In Progress - AI Analysis';
  }

  return 'In Progress - Validation';
}

function resolveCurrentStep(claim, validation) {
  if (claim.status === 'Approved' || claim.status === 'Rejected' || claim.decidedAt) {
    return 5;
  }

  if (claim.coverage || validation) {
    return 4;
  }

  if (validation || claim.documents?.length) {
    return 3;
  }

  if (claim.documents?.length) {
    return 2;
  }

  return 1;
}

function buildAiSummary(claim, validation) {
  if (!validation) {
    return 'Validation result is not available yet.';
  }

  if (validation.reasons?.length) {
    return validation.reasons.join(' ');
  }

  if (claim.workshopRepairEstimate?.totalAmount) {
    return `Vehicle damage review completed. Workshop estimate recorded at RM ${Number(claim.workshopRepairEstimate.totalAmount).toFixed(2)}.`;
  }

  if (validation.isApproved) {
    return 'Validation checks passed and the claim is eligible for straight-through processing.';
  }

  return 'Validation is in progress.';
}

function buildPolicyInfo(claim, coverage) {
  if (!coverage) {
    return `Policy ${claim.policyNumber || 'not linked yet'} - coverage data is still pending.`;
  }

  return `Policy ${claim.policyNumber || 'Unknown'} - ${coverage.coverageType || 'Vehicle coverage'} from ${formatTimelineDate(coverage.effectiveDate)} until ${formatTimelineDate(coverage.expiryDate)}.`;
}

function buildClaimTimeline(claim, validation) {
  const events = [
    createValidationEvent('Submitted', claim.createdAt || claim.date || claim.incidentDate),
  ];

  if (claim.documents?.length) {
    events.push(createValidationEvent('Document Check', claim.createdAt || claim.date || claim.incidentDate));
  }

  if (validation) {
    events.push(createValidationEvent('AI Analysis', claim.createdAt || claim.date || claim.incidentDate));
    events.push(createValidationEvent('Policy Check', claim.createdAt || claim.date || claim.incidentDate));
  }

  if (claim.decidedAt || claim.requestedAt || claim.respondedAt || claim.status) {
    events.push(createValidationEvent('Routed', claim.decidedAt || claim.respondedAt || claim.requestedAt || claim.createdAt || claim.date));
  }

  return events.filter((event) => Boolean(event.date));
}

function formatTimelineDate(value) {
  return value ? moment(value).format('DD MMM YYYY') : 'Not available';
}

export default TrackValidationProcess;


