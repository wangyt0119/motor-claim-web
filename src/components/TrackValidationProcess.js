import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Table, Tag, Button, Space, Input, 
  Row, Col, Select, Progress, Badge, Tooltip, Divider,
  Empty, Modal, Steps, Timeline, Tabs, List, Avatar
} from 'antd';
import { 
  SearchOutlined, 
  ClearOutlined, 
  EyeOutlined, 
  HistoryOutlined,
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  WarningOutlined,
  LoadingOutlined,
  BarChartOutlined,
  FileTextOutlined,
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
const { TabPane } = Tabs;

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

function TrackValidationProcess() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedAIFilter, setSelectedAIFilter] = useState('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState('All');
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  // Sample validation data
  const validationClaims = [
    createValidationClaim({
      claimId: 'CLM001',
      submissionDate: moment().subtract(2, 'hours').toDate(),
      documentStatus: 'Complete',
      aiAssessment: 'Valid',
      policyStatus: 'Active',
      routingStatus: 'Approved - STP',
      currentStep: 5,
      totalSteps: 5,
      documents: ['police_report.pdf', 'vehicle_photos.jpg', 'insurance_cert.pdf'],
      aiSummary: 'Minor front bumper damage detected. Estimated repair cost: RM 2,500',
      policyInfo: 'Policy POL-78901234 - Active until Dec 2024',
      timeline: [
        createValidationEvent('Submitted', moment().subtract(2, 'hours').toDate()),
        createValidationEvent('Document Check', moment().subtract(2, 'hours').subtract(5, 'minutes').toDate()),
        createValidationEvent('AI Analysis', moment().subtract(1, 'hours').subtract(45, 'minutes').toDate()),
        createValidationEvent('Policy Check', moment().subtract(1, 'hours').subtract(30, 'minutes').toDate()),
        createValidationEvent('Routed', moment().subtract(1, 'hours').subtract(15, 'minutes').toDate()),
      ],
    }),
    createValidationClaim({
      claimId: 'CLM002',
      submissionDate: moment().subtract(4, 'hours').toDate(),
      documentStatus: 'Incomplete',
      aiAssessment: 'Pending',
      policyStatus: 'Active',
      routingStatus: 'Manual Review - Missing Documents',
      currentStep: 2,
      totalSteps: 5,
      documents: ['police_report.pdf'],
      aiSummary: 'Pending - Insufficient documents for analysis',
      policyInfo: 'Policy POL-12345678 - Active until Mar 2025',
      timeline: [
        createValidationEvent('Submitted', moment().subtract(4, 'hours').toDate()),
        createValidationEvent('Document Check', moment().subtract(3, 'hours').subtract(55, 'minutes').toDate()),
      ],
    }),
    createValidationClaim({
      claimId: 'CLM003',
      submissionDate: moment().subtract(6, 'hours').toDate(),
      documentStatus: 'Complete',
      aiAssessment: 'Inconclusive',
      policyStatus: 'Active',
      routingStatus: 'Manual Review - AI Inconclusive',
      currentStep: 4,
      totalSteps: 5,
      documents: ['police_report.pdf', 'vehicle_photos.jpg', 'insurance_cert.pdf', 'witness_statement.pdf'],
      aiSummary: 'Complex damage pattern detected. Manual review required for accurate assessment',
      policyInfo: 'Policy POL-98765432 - Active until Jun 2024',
      timeline: [
        createValidationEvent('Submitted', moment().subtract(6, 'hours').toDate()),
        createValidationEvent('Document Check', moment().subtract(5, 'hours').subtract(55, 'minutes').toDate()),
        createValidationEvent('AI Analysis', moment().subtract(5, 'hours').subtract(30, 'minutes').toDate()),
        createValidationEvent('Policy Check', moment().subtract(5, 'hours').subtract(15, 'minutes').toDate()),
      ],
    }),
    createValidationClaim({
      claimId: 'CLM004',
      submissionDate: moment().subtract(8, 'hours').toDate(),
      documentStatus: 'Complete',
      aiAssessment: 'Valid',
      policyStatus: 'Not Covered',
      routingStatus: 'Manual Review - Policy Not Covered',
      currentStep: 4,
      totalSteps: 5,
      documents: ['police_report.pdf', 'vehicle_photos.jpg', 'insurance_cert.pdf'],
      aiSummary: 'Rear-end collision damage detected. Estimated repair cost: RM 4,200',
      policyInfo: 'Policy POL-11223344 - Exclusion: Pre-existing damage clause applies',
      timeline: [
        createValidationEvent('Submitted', moment().subtract(8, 'hours').toDate()),
        createValidationEvent('Document Check', moment().subtract(7, 'hours').subtract(55, 'minutes').toDate()),
        createValidationEvent('AI Analysis', moment().subtract(7, 'hours').subtract(30, 'minutes').toDate()),
        createValidationEvent('Policy Check', moment().subtract(7, 'hours').subtract(15, 'minutes').toDate()),
      ],
    }),
    createValidationClaim({
      claimId: 'CLM005',
      submissionDate: moment().subtract(30, 'minutes').toDate(),
      documentStatus: 'Complete',
      aiAssessment: 'Processing',
      policyStatus: 'Pending',
      routingStatus: 'In Progress - AI Analysis',
      currentStep: 3,
      totalSteps: 5,
      documents: ['police_report.pdf', 'vehicle_photos.jpg', 'insurance_cert.pdf'],
      aiSummary: 'Analysis in progress...',
      policyInfo: 'Policy verification in progress...',
      timeline: [
        createValidationEvent('Submitted', moment().subtract(30, 'minutes').toDate()),
        createValidationEvent('Document Check', moment().subtract(25, 'minutes').toDate()),
        createValidationEvent('AI Analysis', moment().subtract(10, 'minutes').toDate()),
      ],
    }),
  ];

  // Filter claims based on search and filters
  useEffect(() => {
    const filtered = validationClaims.filter(claim => {
      const matchesSearch = searchQuery === '' || 
        claim.claimId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = selectedStatusFilter === 'All' || 
        claim.routingStatus.includes(selectedStatusFilter);
      
      const matchesAI = selectedAIFilter === 'All' || 
        claim.aiAssessment === selectedAIFilter;
      
      const matchesDate = selectedDateFilter === 'All' || 
        matchesDateFilter(claim.submissionDate);
      
      return matchesSearch && matchesStatus && matchesAI && matchesDate;
    });
    
    setFilteredClaims(filtered);
  }, [searchQuery, selectedStatusFilter, selectedAIFilter, selectedDateFilter]);

  // Helper function to match date filter
  const matchesDateFilter = (date) => {
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
  };

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
    if (filename.toLowerCase().includes('.pdf')) return <FilePdfOutlined />;
    if (filename.toLowerCase().includes('.jpg') || filename.toLowerCase().includes('.png')) return <FileImageOutlined />;
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
      title: 'AI Assessment',
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
        visible={detailsModalVisible}
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
                        title={doc}
                      />
                      <CheckCircleOutlined style={{ color: '#4CAF50' }} />
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
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
        <Col>
          <Title level={2} style={{ marginBottom: 8 }}>Track Validation Process</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Monitor claim validation and routing process
          </Text>
        </Col>
        <Col>
          <Badge 
            count={validationClaims.length} 
            style={{ backgroundColor: '#4CAF50' }}
          >
            <Button 
              icon={<BarChartOutlined />} 
              style={{ 
                backgroundColor: '#E8F5E9', 
                color: '#4CAF50',
                border: '1px solid #C8E6C9',
                borderRadius: 8,
                padding: '0 16px'
              }}
            >
              Claims
            </Button>
          </Badge>
        </Col>
      </Row>

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
            <Text strong style={{ display: 'block', marginBottom: 8 }}>AI Result</Text>
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
        <Table
          columns={columns}
          dataSource={filteredClaims}
          rowKey="claimId"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: renderEmptyState() }}
        />
      </Card>

      {/* Claim Details Modal */}
      {renderClaimDetailsModal()}
    </div>
  );
}

export default TrackValidationProcess;


