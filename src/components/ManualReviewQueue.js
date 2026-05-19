import React, { useEffect, useMemo, useState } from 'react';
import { 
  Card, Typography, Input, Select, Row, Col, 
  Tag, Button, Empty
} from 'antd';
import { 
  FlagOutlined, 
  SearchOutlined, 
  EyeOutlined, 
} from '@ant-design/icons';
import moment from 'moment';
import ClaimWorkflowDrawer from './ClaimWorkflowDrawer';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

function ManualReviewQueue({ claims = [], onClaimsChanged }) {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);

  const flaggedClaims = useMemo(() => {
    return claims
      .filter((claim) => ['Pending Manual Review', 'Customer Responded'].includes(claim.status))
      .map((claim) => {
        const reasons = claim.validationResult?.reasons || [];
        const priority = getManualReviewPriority(claim);
        return {
          ...claim,
          priority,
          flagReason: reasons[0] || getPriorityReason(priority, claim),
          flagDetails: reasons.join(' ') || getPriorityDescription(priority, claim),
          flaggedDate: claim.date,
        };
      });
  }, [claims]);

  useEffect(() => {
    let filtered = flaggedClaims.filter(claim => {
      const matchesFilter = selectedFilter === 'All' || claim.priority === selectedFilter;
      const matchesSearch = !searchQuery || 
                          claim.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          String(claim.coverageId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          claim.flagReason.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
    
    // Sort by priority and date
    filtered.sort((a, b) => {
      const priorityCompare = getPriorityValue(b.priority) - getPriorityValue(a.priority);
      if (priorityCompare !== 0) return priorityCompare;
      return b.flaggedDate.getTime() - a.flaggedDate.getTime();
    });
    
    setFilteredClaims(filtered);
  }, [flaggedClaims, searchQuery, selectedFilter]);

  const getPriorityValue = (priority) => {
    switch (priority) {
      case 'High': return 3;
      case 'Medium': return 2;
      case 'Low': return 1;
      default: return 0;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#E53E3E';
      case 'Medium': return '#FF9800';
      case 'Low': return '#4CAF50';
      default: return '#6C757D';
    }
  };

  const getTimeSinceFlagged = (date) => {
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

  const buildHeader = () => (
    <div className="portal-dashboard-hero portal-dashboard-theme-soft">
      <div className="portal-dashboard-hero-content">
        <span className="portal-dashboard-kicker portal-dashboard-kicker-soft">Officer Review</span>
        <Title level={2} className="portal-dashboard-title">Manual Review Queue</Title>
        <Text className="portal-dashboard-description">
          Claims flagged for manual review and approval.
        </Text>
        <div className="portal-dashboard-chip-row">
          <div className="portal-dashboard-chip portal-dashboard-chip-soft">
            <span className="portal-dashboard-chip-label">Flagged</span>
            <span className="portal-dashboard-chip-value">{flaggedClaims.length}</span>
          </div>
          <div className="portal-dashboard-chip portal-dashboard-chip-soft">
            <span className="portal-dashboard-chip-label">High Priority</span>
            <span className="portal-dashboard-chip-value">{flaggedClaims.filter((claim) => claim.priority === 'High').length}</span>
          </div>
          <div className="portal-dashboard-chip portal-dashboard-chip-soft">
            <span className="portal-dashboard-chip-label">Customer Responded</span>
            <span className="portal-dashboard-chip-value">{flaggedClaims.filter((claim) => String(claim.status || '').toLowerCase() === 'customer responded').length}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const buildFiltersAndSearch = () => (
    <div style={{ display: 'flex', marginBottom: 24 }}>
      <Select
        value={selectedFilter}
        onChange={setSelectedFilter}
        style={{ 
          width: 120, 
          marginRight: 16,
          borderRadius: 8
        }}
        dropdownStyle={{ borderRadius: 8 }}
      >
        <Option value="All">All</Option>
        <Option value="High">High</Option>
        <Option value="Medium">Medium</Option>
        <Option value="Low">Low</Option>
      </Select>
      
      <Search
        placeholder="Search by claim ID, vehicle registration, or flag reason..."
        allowClear
        enterButton={<SearchOutlined />}
        size="middle"
        onSearch={setSearchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        style={{ 
          flex: 1,
          borderRadius: 8
        }}
      />
    </div>
  );

  const renderStatChip = (label, count, color) => (
    <Tag 
      style={{ 
        backgroundColor: `${color}20`, 
        borderColor: `${color}40`,
        color: color,
        padding: '6px 12px',
        borderRadius: 16,
        marginRight: 12
      }}
    >
      <span 
        style={{ 
          display: 'inline-block', 
          width: 8, 
          height: 8, 
          borderRadius: '50%', 
          backgroundColor: color,
          marginRight: 6
        }} 
      />
      {`${label} (${count})`}
    </Tag>
  );

  const buildStatsRow = () => {
    const highPriorityCount = flaggedClaims.filter(c => c.priority === 'High').length;
    const mediumPriorityCount = flaggedClaims.filter(c => c.priority === 'Medium').length;
    const lowPriorityCount = flaggedClaims.filter(c => c.priority === 'Low').length;

    return (
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        {renderStatChip('High Priority', highPriorityCount, '#E53E3E')}
        {renderStatChip('Medium Priority', mediumPriorityCount, '#FF9800')}
        {renderStatChip('Low Priority', lowPriorityCount, '#4CAF50')}
        <div style={{ marginLeft: 'auto' }}>
          <Text type="secondary">Total: {flaggedClaims.length} claims</Text>
        </div>
      </div>
    );
  };

  const renderDetailItem = (label, value) => (
    <div>
      <Text type="secondary" style={{ 
        fontSize: 12, 
        fontWeight: 500 
      }}>
        {label}
      </Text>
      <div style={{ marginTop: 4 }}>
        <Text style={{ 
          fontSize: 14, 
          color: '#1A1A1A', 
          fontWeight: 600,
          whiteSpace: 'pre-line' 
        }}>
          {value}
        </Text>
      </div>
    </div>
  );

  const renderFlaggedClaimCard = (claim) => {
    const priorityColor = getPriorityColor(claim.priority);
    
    return (
      <Card 
        hoverable
        onClick={() => setSelectedClaim(claim)}
        style={{ 
          marginBottom: 16, 
          borderRadius: 12,
          border: `1px solid ${priorityColor}30`,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}
        bodyStyle={{ padding: 20 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Tag 
              color={priorityColor} 
              style={{ 
                fontWeight: 'bold', 
                textTransform: 'uppercase',
                borderRadius: 12,
                fontSize: 10,
                padding: '4px 8px',
                margin: 0
              }}
            >
              {claim.priority}
            </Tag>
            <Title level={4} style={{ margin: '0 0 0 12px' }}>{claim.id}</Title>
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {getTimeSinceFlagged(claim.flaggedDate)}
          </Text>
        </div>
        
        <div 
          style={{ 
            margin: '16px 0', 
            padding: 12, 
            backgroundColor: '#FFF3CD', 
            borderRadius: 8, 
            border: '1px solid #FFE69C' 
          }}
        >
          <div style={{ display: 'flex' }}>
            <FlagOutlined style={{ color: '#FF8C00', fontSize: 20, marginRight: 8, marginTop: 2 }} />
            <div>
              <Text strong style={{ fontSize: 14, color: '#8B4513' }}>
                Flagged: {claim.flagReason}
              </Text>
              <div>
                <Text style={{ fontSize: 12, color: '#8B4513' }}>
                  {claim.flagDetails}
                </Text>
              </div>
            </div>
          </div>
        </div>
        
        <Row gutter={24} style={{ marginBottom: 16 }}>
          <Col span={6}>
            {renderDetailItem('Coverage', claim.coverageId || 'Not available')}
          </Col>
          <Col span={6}>
            {renderDetailItem('Type', claim.type)}
          </Col>
          <Col span={6}>
            {renderDetailItem('STP Status', claim.stpStatus || 'Manual Review')}
          </Col>
          <Col span={6}>
            {renderDetailItem('Submitted', moment(claim.date).format('DD MMM YYYY'))}
          </Col>
        </Row>
        
        <Row gutter={12}>
          <Col span={24}>
            <Button 
              block
              icon={<EyeOutlined />} 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedClaim(claim);
              }}
              style={{ 
                borderColor: '#FF6600', 
                color: '#FF6600',
                height: 40
              }}
            >
              Review Details
            </Button>
          </Col>
        </Row>
      </Card>
    );
  };

  const buildClaimsList = () => {
    if (filteredClaims.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <p style={{ fontSize: 18, fontWeight: 600, color: '#6C757D' }}>No claims found</p>
              <p style={{ fontSize: 14, color: '#6C757D' }}>Try adjusting your search or filter criteria</p>
            </div>
          }
        />
      );
    }

    return (
      <div>
        {filteredClaims.map(claim => renderFlaggedClaimCard(claim))}
      </div>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      {buildHeader()}
      <div style={{ marginTop: 24 }}>
        {buildFiltersAndSearch()}
      </div>
      {buildStatsRow()}
      {buildClaimsList()}

      <ClaimWorkflowDrawer
        claim={selectedClaim}
        open={Boolean(selectedClaim)}
        onClose={() => setSelectedClaim(null)}
        onWorkflowUpdated={onClaimsChanged}
      />
    </div>
  );
}

export default ManualReviewQueue;

function getManualReviewPriority(claim) {
  const validation = claim.validationResult || {};
  const reasons = (validation.reasons || []).join(' ').toLowerCase();
  const amount = Number(claim.claimAmount || 0);
  const normalizedStatus = String(claim.status || '').toLowerCase();
  const manualFlagReason = String(claim.manualReviewFlagReason || '').toLowerCase();
  const isRepeatCoverageFlag =
    claim.isFlaggedForManualReview &&
    /another submitted claim within the last|last 30 days|same coverage/i.test(
      claim.manualReviewFlagReason || ''
    );

  const hasCriticalMismatch =
    validation.isIdentityMatched === false ||
    validation.isVehicleMatched === false ||
    validation.isPoliceReportMatched === false ||
    validation.isDrivingLicenseMatched === false;

  const hasCriticalDocumentIssue =
    validation.isDocumentComplete === false ||
    /ocr failed|missing|does not match|fraud|suspicious|confidence is too low/.test(reasons) ||
    /duplicate|repeat claim|same coverage|last 30 days/.test(manualFlagReason);

  if (isRepeatCoverageFlag || hasCriticalMismatch || hasCriticalDocumentIssue || amount >= 5000) {
    return 'High';
  }

  if (normalizedStatus === 'customer responded') {
    return 'Medium';
  }

  return 'Medium';
}

function getPriorityReason(priority, claim) {
  if (claim.isFlaggedForManualReview && claim.manualReviewFlagReason) {
    return claim.manualReviewFlagReason;
  }

  if (priority === 'High') {
    return 'Critical mismatch or missing key evidence';
  }

  if (String(claim.status || '').toLowerCase() === 'customer responded') {
    return 'Customer follow-up needs officer review';
  }

  return 'Needs officer review';
}

function getPriorityDescription(priority, claim) {
  if (claim.isFlaggedForManualReview && claim.manualReviewFlagReason) {
    return 'This claim was automatically routed to manual review by a backend fraud or repeat-claim rule.';
  }

  if (priority === 'High') {
    return 'This claim has a key document mismatch, missing evidence, suspicious indicator, or a higher-risk review signal.';
  }

  if (String(claim.status || '').toLowerCase() === 'customer responded') {
    return 'The customer has replied and the officer should verify whether the updated information is sufficient.';
  }

  return 'This claim needs manual officer assessment before it can move forward.';
}




