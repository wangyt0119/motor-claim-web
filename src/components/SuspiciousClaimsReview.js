import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Table, Tag, Button, Space, Input, Select, Row, Col, 
  Divider, Statistic, Badge, Alert, Tooltip, Empty, notification,
  Modal, Descriptions, List, Form, Tabs, Drawer
} from 'antd';
import { 
  WarningOutlined, 
  SearchOutlined, 
  DownloadOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FlagOutlined,
  InfoCircleOutlined,
  ArrowUpOutlined,
  CloseOutlined,
  FileSearchOutlined, // Instead of SearchOffOutlined
  ExclamationOutlined // Instead of DangerOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

function SuspiciousClaimsReview() {
  // State variables
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('risk_desc'); // risk_desc, risk_asc, date_desc, date_asc
  
  // Sample suspicious claims data
  const [suspiciousClaims, setSuspiciousClaims] = useState([
    createSuspiciousClaimData({
      claimId: 'CLM013',
      submissionDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
      aiRiskScore: 92,
      flagReason: 'Multiple similar claims from same location',
      status: 'Under Review',
      severity: 'High Risk',
      customerName: 'Ahmad bin Rahman',
      vehicleModel: 'Toyota Vios 2019',
      vehicleRegistration: 'ABC 1234',
      claimAmount: 8500.00,
      incidentLocation: 'Jalan Sultan Ismail, KL',
      incidentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      riskIndicators: [
        'Duplicate incident location (3 claims in 30 days)',
        'Similar damage pattern to previous claims',
        'High claim amount for vehicle age',
        'Submission outside business hours',
      ],
      duplicateDetection: {
        similarClaims: 3,
        sameLocation: true,
        similarDamage: true,
        timePattern: 'Suspicious timing pattern detected',
      },
      aiAnalysis: 'High probability of coordinated fraud. Multiple claims with similar characteristics submitted from same geographical area.',
      officerNotes: '',
    }),
    createSuspiciousClaimData({
      claimId: 'CLM014',
      submissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      aiRiskScore: 78,
      flagReason: 'Inconsistent damage assessment',
      status: 'Pending Investigation',
      severity: 'Medium Risk',
      customerName: 'Siti Aminah',
      vehicleModel: 'Honda City 2020',
      vehicleRegistration: 'DEF 5678',
      claimAmount: 12000.00,
      incidentLocation: 'Petaling Jaya',
      incidentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      riskIndicators: [
        'Damage inconsistent with reported incident',
        'Photos show pre-existing damage',
        'Repair estimate significantly inflated',
      ],
      duplicateDetection: {
        similarClaims: 0,
        sameLocation: false,
        similarDamage: false,
        timePattern: 'Normal submission pattern',
      },
      aiAnalysis: 'Damage assessment inconsistencies detected. Recommended for detailed inspection.',
      officerNotes: 'Scheduled for physical inspection on 15 Dec 2024',
    }),
    createSuspiciousClaimData({
      claimId: 'CLM015',
      submissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      aiRiskScore: 85,
      flagReason: 'Duplicate claim detection',
      status: 'Escalated',
      severity: 'High Risk',
      customerName: 'Raj Kumar Singh',
      vehicleModel: 'Proton X70 2021',
      vehicleRegistration: 'GHI 9012',
      claimAmount: 15600.00,
      incidentLocation: 'Shah Alam',
      incidentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      riskIndicators: [
        'Identical incident reported by different customer',
        'Same workshop recommended',
        'Similar documentation submitted',
        'Coordinated submission timing',
      ],
      duplicateDetection: {
        similarClaims: 2,
        sameLocation: true,
        similarDamage: true,
        timePattern: 'Coordinated submission detected',
      },
      aiAnalysis: 'Potential duplicate claim with CLM016. High confidence of fraudulent activity.',
      officerNotes: 'Escalated to fraud investigation team. Case linked with CLM016.',
    }),
    createSuspiciousClaimData({
      claimId: 'CLM016',
      submissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
      aiRiskScore: 88,
      flagReason: 'Coordinated fraud pattern',
      status: 'Under Review',
      severity: 'High Risk',
      customerName: 'Lim Wei Chong',
      vehicleModel: 'Nissan Almera 2020',
      vehicleRegistration: 'JKL 3456',
      claimAmount: 15800.00,
      incidentLocation: 'Shah Alam',
      incidentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      riskIndicators: [
        'Identical incident to CLM015',
        'Same repair workshop',
        'Similar damage photos',
        'Suspicious customer behavior pattern',
      ],
      duplicateDetection: {
        similarClaims: 2,
        sameLocation: true,
        similarDamage: true,
        timePattern: 'Coordinated submission detected',
      },
      aiAnalysis: 'Linked to CLM015. Strong indicators of coordinated fraudulent activity.',
      officerNotes: 'Under investigation with CLM015. Awaiting fraud team analysis.',
    }),
    createSuspiciousClaimData({
      claimId: 'CLM017',
      submissionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      aiRiskScore: 65,
      flagReason: 'Unusual claim pattern',
      status: 'Approved',
      severity: 'Low Risk',
      customerName: 'Fatimah Hassan',
      vehicleModel: 'Perodua Myvi 2018',
      vehicleRegistration: 'MNO 7890',
      claimAmount: 3200.00,
      incidentLocation: 'Johor Bahru',
      incidentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      riskIndicators: [
        'Multiple claims in short period',
        'Different incident types',
      ],
      duplicateDetection: {
        similarClaims: 0,
        sameLocation: false,
        similarDamage: false,
        timePattern: 'Multiple claims pattern',
      },
      aiAnalysis: 'Customer has multiple recent claims but each appears legitimate upon review.',
      officerNotes: 'Reviewed and approved. Customer explanation satisfactory.',
    }),
    createSuspiciousClaimData({
      claimId: 'CLM018',
      submissionDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      aiRiskScore: 73,
      flagReason: 'AI behavioral analysis flag',
      status: 'Rejected',
      severity: 'Medium Risk',
      customerName: 'Wong Kar Wai',
      vehicleModel: 'BMW 320i 2019',
      vehicleRegistration: 'PQR 2468',
      claimAmount: 22000.00,
      incidentLocation: 'Kuala Lumpur',
      incidentDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      riskIndicators: [
        'Inconsistent incident description',
        'Delayed reporting without valid reason',
        'High-value claim for minor incident',
        'Customer evasive during verification',
      ],
      duplicateDetection: {
        similarClaims: 0,
        sameLocation: false,
        similarDamage: false,
        timePattern: 'Delayed submission pattern',
      },
      aiAnalysis: 'Behavioral analysis indicates potential deception. Inconsistencies in customer statements.',
      officerNotes: 'Claim rejected due to inconsistent information and lack of supporting evidence.',
    }),
  ]);

  // Filtered claims
  const [filteredClaims, setFilteredClaims] = useState([]);

  // Filter and sort claims when filters or sort order changes
  useEffect(() => {
    let filtered = suspiciousClaims.filter(claim => {
      const matchesSeverity = selectedSeverityFilter === 'All' || 
                            claim.severity === selectedSeverityFilter;
      const matchesStatus = selectedStatusFilter === 'All' || 
                          claim.status === selectedStatusFilter;
      const matchesSearch = searchQuery === '' ||
                          claim.claimId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          claim.aiRiskScore.toString().includes(searchQuery);
      return matchesSeverity && matchesStatus && matchesSearch;
    });

    // Sort claims
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'risk_asc':
          return a.aiRiskScore - b.aiRiskScore;
        case 'risk_desc':
          return b.aiRiskScore - a.aiRiskScore;
        case 'date_asc':
          return a.submissionDate.getTime() - b.submissionDate.getTime();
        case 'date_desc':
          return b.submissionDate.getTime() - a.submissionDate.getTime();
        default:
          return b.aiRiskScore - a.aiRiskScore;
      }
    });

    setFilteredClaims(filtered);
  }, [suspiciousClaims, selectedSeverityFilter, selectedStatusFilter, searchQuery, sortBy]);

  // Export suspicious report
  const exportSuspiciousReport = () => {
    console.log('Exporting suspicious claims report...');
    // Implementation would go here
  };

  // Format time since submission
  const getTimeSince = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHrs / 24);
    
    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHrs > 0) {
      return `${diffHrs}h ago`;
    } else {
      return `${diffMins}m ago`;
    }
  };

  // Build header section
  const buildHeader = () => (
    <Row justify="space-between" align="middle">
      <Col>
        <Title level={2} style={{ margin: 0 }}>Suspicious Claims Review</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Review and investigate potentially fraudulent claims
        </Text>
      </Col>
      <Col>
        <Space>
          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={exportSuspiciousReport}
            style={{ 
              backgroundColor: '#4CAF50', 
              borderColor: '#4CAF50' 
            }}
          >
            Export Report
          </Button>
          <Tag 
            icon={<WarningOutlined />} 
            color="#E53E3E"
            style={{ 
              padding: '8px 16px', 
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8
            }}
          >
            {suspiciousClaims.length} Flagged
          </Tag>
        </Space>
      </Col>
    </Row>
  );

  // Build filters row
  const buildFiltersRow = () => (
    <Row gutter={16}>
      <Col span={12}>
        <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
          Risk Severity
        </Text>
        <Select
          value={selectedSeverityFilter}
          onChange={setSelectedSeverityFilter}
          style={{ width: '100%', marginTop: 4 }}
          bordered
        >
          <Option value="All">All</Option>
          <Option value="High Risk">High Risk</Option>
          <Option value="Medium Risk">Medium Risk</Option>
          <Option value="Low Risk">Low Risk</Option>
        </Select>
      </Col>
      <Col span={12}>
        <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
          Review Status
        </Text>
        <Select
          value={selectedStatusFilter}
          onChange={setSelectedStatusFilter}
          style={{ width: '100%', marginTop: 4 }}
          bordered
        >
          <Option value="All">All</Option>
          <Option value="Under Review">Under Review</Option>
          <Option value="Pending Investigation">Pending Investigation</Option>
          <Option value="Escalated">Escalated</Option>
          <Option value="Approved">Approved</Option>
          <Option value="Rejected">Rejected</Option>
        </Select>
      </Col>
    </Row>
  );

  // Build search and sort row
  const buildSearchAndSort = () => (
    <Row gutter={16}>
      <Col span={16}>
        <Input
          placeholder="Search by Claim ID or Risk Score..."
          prefix={<SearchOutlined style={{ color: '#6C757D' }} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%' }}
        />
      </Col>
      <Col span={8}>
        <Select
          value={sortBy}
          onChange={setSortBy}
          style={{ width: '100%' }}
        >
          <Option value="risk_desc">Highest Risk First</Option>
          <Option value="risk_asc">Lowest Risk First</Option>
          <Option value="date_desc">Newest First</Option>
          <Option value="date_asc">Oldest First</Option>
        </Select>
      </Col>
    </Row>
  );

  // Build stats row
  const buildStatsRow = () => {
    const highRisk = suspiciousClaims.filter(c => c.severity === 'High Risk').length;
    const mediumRisk = suspiciousClaims.filter(c => c.severity === 'Medium Risk').length;
    const lowRisk = suspiciousClaims.filter(c => c.severity === 'Low Risk').length;
    const underReview = suspiciousClaims.filter(c => c.status === 'Under Review').length;
    const escalated = suspiciousClaims.filter(c => c.status === 'Escalated').length;
    const avgRiskScore = suspiciousClaims.reduce((sum, claim) => sum + claim.aiRiskScore, 0) / suspiciousClaims.length;

    return (
      <Row align="middle">
        <Col>
          {buildStatChip('High Risk', highRisk, '#E53E3E')}
        </Col>
        <Col style={{ marginLeft: 12 }}>
          {buildStatChip('Medium Risk', mediumRisk, '#FF9800')}
        </Col>
        <Col style={{ marginLeft: 12 }}>
          {buildStatChip('Low Risk', lowRisk, '#FFC107')}
        </Col>
        <Col style={{ marginLeft: 12 }}>
          {buildStatChip('Under Review', underReview, '#2196F3')}
        </Col>
        <Col style={{ marginLeft: 12 }}>
          {buildStatChip('Escalated', escalated, '#9C27B0')}
        </Col>
        <Col flex="auto" style={{ textAlign: 'right' }}>
          <Text style={{ fontSize: 14, color: '#E53E3E', fontWeight: 600 }}>
            Avg Risk Score: {avgRiskScore.toFixed(1)}
          </Text>
          <div>
            <Text style={{ fontSize: 12, color: '#6C757D' }}>
              {suspiciousClaims.length} total flagged claims
            </Text>
          </div>
        </Col>
      </Row>
    );
  };

  // Build stat chip
  const buildStatChip = (label, count, color) => (
    <Tag
      style={{
        backgroundColor: `${color}19`, // 10% opacity
        borderColor: `${color}4D`, // 30% opacity
        color: color,
        borderRadius: 16,
        padding: '6px 12px',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <span 
        style={{ 
          display: 'inline-block', 
          width: 8, 
          height: 8, 
          borderRadius: '50%', 
          backgroundColor: color,
          marginRight: 6,
        }} 
      />
      {label} ({count})
    </Tag>
  );

  // Build claims list
  const buildClaimsList = () => {
    if (filteredClaims.length === 0) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: 48, 
          background: '#fff', 
          borderRadius: 12,
          border: '1px solid #eee'
        }}>
          <FileSearchOutlined style={{ fontSize: 64, color: '#6C757D' }} />
          <div style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 600, color: '#6C757D' }}>
              No suspicious claims found
            </Text>
          </div>
          <div style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 14, color: '#6C757D' }}>
              Try adjusting your search or filter criteria
            </Text>
          </div>
        </div>
      );
    }

    return (
      <div>
        {filteredClaims.map(claim => buildSuspiciousClaimCard(claim))}
      </div>
    );
  };

  // Build suspicious claim card
  const buildSuspiciousClaimCard = (claim) => {
    const severityColor = getSeverityColor(claim.severity);
    const statusColor = getStatusColor(claim.status);
    const severityIcon = getSeverityIcon(claim.severity);

    return (
      <Card
        key={claim.claimId}
        style={{ 
          marginBottom: 16, 
          borderRadius: 12,
          border: `2px solid ${severityColor}4D`, // 30% opacity
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}
        bodyStyle={{ padding: 20 }}
      >
        <Row>
          <Col span={24}>
            {/* Header Row */}
            <Row align="middle">
              {/* Severity Icon */}
              <Col>
                <div style={{ 
                  padding: 8, 
                  backgroundColor: `${severityColor}1A`, // 10% opacity
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {severityIcon}
                </div>
              </Col>
              
              {/* Claim Info */}
              <Col flex="1" style={{ marginLeft: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 18, marginRight: 8 }}>
                    {claim.claimId}
                  </Text>
                  <Tag
                    color={statusColor}
                    style={{ 
                      padding: '0 6px', 
                      borderRadius: 10,
                      fontSize: 10,
                      fontWeight: 'bold'
                    }}
                  >
                    {claim.status.toUpperCase()}
                  </Tag>
                </div>
                <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
                  {claim.customerName}
                </Text>
              </Col>
              
              {/* Risk Score */}
              <Col>
                <div style={{ 
                  padding: 12, 
                  backgroundColor: `${severityColor}1A`, // 10% opacity
                  borderRadius: 8,
                  border: `1px solid ${severityColor}4D`, // 30% opacity
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: 10, 
                    fontWeight: 'bold', 
                    color: severityColor 
                  }}>
                    RISK SCORE
                  </div>
                  <div style={{ 
                    fontSize: 24, 
                    fontWeight: 'bold', 
                    color: severityColor 
                  }}>
                    {claim.aiRiskScore}
                  </div>
                </div>
              </Col>
            </Row>
            
            {/* Flag Reason */}
            <div style={{ 
              padding: 12, 
              backgroundColor: '#FFF3CD', 
              borderRadius: 8,
              border: '1px solid #FFE69C',
              marginTop: 16
            }}>
              <Row align="top">
                <Col>
                  <FlagOutlined style={{ color: '#856404', fontSize: 16 }} />
                </Col>
                <Col flex="1" style={{ marginLeft: 8 }}>
                  <div style={{ 
                    fontSize: 12, 
                    fontWeight: 600, 
                    color: '#856404' 
                  }}>
                    Flag Reason:
                  </div>
                  <div style={{ 
                    fontSize: 13, 
                    color: '#856404' 
                  }}>
                    {claim.flagReason}
                  </div>
                </Col>
              </Row>
            </div>
            
            {/* Details Row */}
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={6}>
                {buildDetailItem('Submission Date', moment(claim.submissionDate).format('DD MMM YYYY, HH:mm'))}
              </Col>
              <Col span={6}>
                {buildDetailItem('Vehicle', `${claim.vehicleModel}\n${claim.vehicleRegistration}`)}
              </Col>
              <Col span={6}>
                {buildDetailItem('Amount', `RM ${claim.claimAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}
              </Col>
              <Col span={6}>
                {buildDetailItem('Location', claim.incidentLocation)}
              </Col>
            </Row>
            
            {/* Action Buttons */}
            <Row gutter={8} style={{ marginTop: 16 }}>
              <Col span={claim.status === 'Under Review' ? 8 : 24}>
                <Button 
                  type="primary" 
                  icon={<EyeOutlined />} 
                  block
                  onClick={() => reviewClaim(claim)}
                  style={{ 
                    backgroundColor: '#2196F3', 
                    borderColor: '#2196F3',
                    height: 40
                  }}
                >
                  Review
                </Button>
              </Col>
              
              {claim.status === 'Under Review' && (
                <>
                  <Col span={8}>
                    <Button 
                      icon={<CheckCircleOutlined />} 
                      block
                      onClick={() => quickApprove(claim)}
                      style={{ 
                        borderColor: '#4CAF50', 
                        color: '#4CAF50',
                        height: 40
                      }}
                    >
                      Quick Approve
                    </Button>
                  </Col>
                  <Col span={8}>
                    <Button 
                      icon={<ArrowUpOutlined />} 
                      block
                      onClick={() => escalateClaim(claim)}
                      style={{ 
                        borderColor: '#E53E3E', 
                        color: '#E53E3E',
                        height: 40
                      }}
                    >
                      Escalate
                    </Button>
                  </Col>
                </>
              )}
            </Row>
          </Col>
        </Row>
      </Card>
    );
  };

  // Build detail item
  const buildDetailItem = (label, value) => (
    <div>
      <div style={{ 
        fontSize: 12, 
        color: '#6C757D', 
        fontWeight: 500 
      }}>
        {label}
      </div>
      <div style={{ 
        fontSize: 13, 
        fontWeight: 600, 
        color: '#1A1A1A',
        marginTop: 4,
        whiteSpace: 'pre-line'
      }}>
        {value}
      </div>
    </div>
  );

  // Helper functions for colors
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High Risk': return '#E53E3E';
      case 'Medium Risk': return '#FF9800';
      case 'Low Risk': return '#FFC107';
      default: return '#6C757D';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Under Review': return 'processing';
      case 'Pending Investigation': return 'warning';
      case 'Escalated': return 'error';
      case 'Approved': return 'success';
      case 'Rejected': return 'default';
      default: return 'default';
    }
  };

  const getRiskScoreColor = (score) => {
    if (score >= 80) return '#E53E3E';
    if (score >= 70) return '#FF9800';
    return '#FFC107';
  };

  // Helper functions for icons
  const getSeverityIcon = (severity) => {
    switch (severity.toLowerCase()) {
      case 'high risk':
        return <ExclamationOutlined style={{ color: getSeverityColor(severity), fontSize: 20 }} />;
      case 'medium risk':
        return <WarningOutlined style={{ color: getSeverityColor(severity), fontSize: 20 }} />;
      case 'low risk':
        return <InfoCircleOutlined style={{ color: getSeverityColor(severity), fontSize: 20 }} />;
      default:
        return <InfoCircleOutlined style={{ color: getSeverityColor(severity), fontSize: 20 }} />;
    }
  };

  // Review claim in detail
  const reviewClaim = (claim) => {
    console.log("Reviewing claim:", claim); // Add this for debugging
    
    // Create a simplified version of the modal with just basic information
    Modal.info({
      title: `Claim Review: ${claim.claimId}`,
      width: 700,
      content: (
        <div>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Customer Name">{claim.customerName || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Vehicle">{claim.vehicleModel || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Registration">{claim.vehicleRegistration || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Claim Amount">
              {claim.claimAmount ? `RM ${claim.claimAmount.toLocaleString()}` : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Risk Score">{claim.aiRiskScore || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Flag Reason">{claim.flagReason || 'N/A'}</Descriptions.Item>
          </Descriptions>
          
          <div style={{ marginTop: 16 }}>
            <Alert
              message="Risk Indicators"
              description={
                <ul>
                  {claim.riskIndicators && claim.riskIndicators.length > 0 ? 
                    claim.riskIndicators.map((indicator, index) => (
                      <li key={index}>{indicator}</li>
                    )) : 
                    <li>No risk indicators found</li>
                  }
                </ul>
              }
              type="warning"
              showIcon
            />
          </div>
        </div>
      ),
      onOk() {},
    });
  };

  // Helper function to build review sections
  const buildReviewSection = (title, content) => (
    <div style={{ marginBottom: 24 }}>
      <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>
        {title}
      </Text>
      <div style={{ marginLeft: 8 }}>{content}</div>
    </div>
  );

  // Helper function to build review rows
  const buildReviewRow = (label, value) => (
    <div style={{ marginBottom: 8 }}>
      <Text type="secondary" style={{ fontSize: 14 }}>{label}</Text>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
    </div>
  );

  // Action handlers
  const quickApprove = (claim) => {
    notification.success({
      message: 'Claim Approved',
      description: `Claim ${claim.claimId} has been approved and moved to processing.`,
      placement: 'topRight',
    });
  };

  const escalateClaim = (claim) => {
    notification.info({
      message: 'Claim Escalated',
      description: `Claim ${claim.claimId} has been escalated to the fraud investigation team.`,
      placement: 'topRight',
    });
  };

  const approveClaim = (claim) => {
    notification.success({
      message: 'Claim Approved',
      description: `Claim ${claim.claimId} has been approved after detailed review.`,
      placement: 'topRight',
    });
  };

  const rejectClaim = (claim) => {
    notification.error({
      message: 'Claim Rejected',
      description: `Claim ${claim.claimId} has been rejected due to suspicious activity.`,
      placement: 'topRight',
    });
  };

  const requestInfo = (claim) => {
    notification.info({
      message: 'Information Requested',
      description: `Additional information has been requested for claim ${claim.claimId}.`,
      placement: 'topRight',
    });
  };

  // Add CSS for the modal
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .claim-review-modal .ant-modal-content {
        border-radius: 12px;
        overflow: hidden;
      }
      .claim-review-modal .ant-modal-body {
        padding: 24px;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={{ padding: 24 }}>
      {buildHeader()}
      <div style={{ marginTop: 24 }}>
        {buildFiltersRow()}
      </div>
      <div style={{ marginTop: 16 }}>
        {buildSearchAndSort()}
      </div>
      <div style={{ marginTop: 24 }}>
        {buildStatsRow()}
      </div>
      <div style={{ marginTop: 24 }}>
        {buildClaimsList()}
      </div>
    </div>
  );
}

// Data model for suspicious claims
const createSuspiciousClaimData = ({
  claimId,
  submissionDate,
  aiRiskScore,
  flagReason,
  status,
  severity,
  customerName,
  vehicleModel,
  vehicleRegistration,
  claimAmount,
  incidentLocation,
  incidentDate,
  riskIndicators,
  duplicateDetection,
  aiAnalysis,
  officerNotes,
}) => ({
  claimId,
  submissionDate,
  aiRiskScore,
  flagReason,
  status,
  severity,
  customerName,
  vehicleModel,
  vehicleRegistration,
  claimAmount,
  incidentLocation,
  incidentDate,
  riskIndicators,
  duplicateDetection,
  aiAnalysis,
  officerNotes,
});

export default SuspiciousClaimsReview;






