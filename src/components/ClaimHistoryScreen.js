import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Table, 
  Tag, 
  Input, 
  Select, 
  Button, 
  Space, 
  Row, 
  Col, 
  Modal, 
  Divider, 
  Timeline, 
  Badge, 
  message,
  Empty,
  Dropdown,
  Menu,
  Radio
} from 'antd';
import { 
  SearchOutlined, 
  HistoryOutlined, 
  FileTextOutlined, 
  DownloadOutlined, 
  PrinterOutlined, 
  CloseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined as SearchIcon,
  DollarOutlined,
  CarOutlined,
  EnvironmentOutlined,
  FileProtectOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  DownOutlined,
  EyeOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

function ClaimHistoryScreen({ claims }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Date (Newest)');
  const [filteredClaims, setFilteredClaims] = useState([]);
  
  useEffect(() => {
    if (claims) {
      let filtered = [...claims];
      
      // Apply status filter
      if (statusFilter !== 'All') {
        filtered = filtered.filter(claim => claim.status === statusFilter);
      }
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(claim => 
          claim.id.toLowerCase().includes(query) ||
          claim.type.toLowerCase().includes(query) ||
          claim.vehicleRegistration?.toLowerCase().includes(query)
        );
      }
      
      // Apply sorting
      if (sortBy === 'Date (Newest)') {
        filtered.sort((a, b) => b.date - a.date);
      } else if (sortBy === 'Date (Oldest)') {
        filtered.sort((a, b) => a.date - b.date);
      } else if (sortBy === 'Amount (Highest)') {
        filtered.sort((a, b) => b.claimAmount - a.claimAmount);
      } else if (sortBy === 'Amount (Lowest)') {
        filtered.sort((a, b) => a.claimAmount - b.claimAmount);
      }
      
      setFilteredClaims(filtered);
    }
  }, [claims, statusFilter, searchQuery, sortBy]);
  
  // Define showClaimDetails function
  const showClaimDetails = (claim) => {
    console.log("Opening modal for claim:", claim.id); // Add logging
    Modal.info({
      title: null,
      icon: null,
      className: 'claim-history-modal',
      width: 700,
      maskClosable: true,
      content: (
        <div className="claim-detail-modal">
          <div className="modal-header" style={{ 
            backgroundColor: '#FF6600', 
            padding: '16px 24px',
            margin: '-20px -24px 24px -24px',
            borderRadius: '2px 2px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Title level={4} style={{ color: 'white', margin: 0 }}>
              Claim Details: {claim.id}
            </Title>
            <Button 
              icon={<CloseOutlined />} 
              type="text" 
              style={{ color: 'white' }} 
              onClick={() => Modal.destroyAll()}
            />
          </div>
          
          <div style={{ padding: '0 20px' }}>
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Text type="secondary">Claim Type</Text>
                <div><Text strong>{claim.type}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Status</Text>
                <div>
                  <Tag color={
                    claim.status === 'Approved' ? 'green' : 
                    claim.status === 'Rejected' ? 'red' : 
                    claim.status.includes('Pending') ? 'orange' : 
                    claim.status.includes('Flagged') ? 'purple' : 'blue'
                  }>
                    {claim.status}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Date Submitted</Text>
                <div><Text strong>{claim.date.toLocaleDateString()}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Claim Amount</Text>
                <div><Text strong>RM {claim.claimAmount.toFixed(2)}</Text></div>
              </Col>
            </Row>
            
            <Divider />
            
            <Title level={5}>Vehicle Information</Title>
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Text type="secondary">Vehicle Model</Text>
                <div><Text strong>{claim.vehicleModel}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Registration Number</Text>
                <div><Text strong>{claim.vehicleRegistration}</Text></div>
              </Col>
              <Col span={24}>
                <Text type="secondary">Incident Location</Text>
                <div><Text strong>{claim.location}</Text></div>
              </Col>
            </Row>
          </div>
        </div>
      ),
      okButtonProps: { style: { display: 'none' } }
    });
  };
  
  // Render claim card - updated with proper event handling
  const renderClaimCard = (claim) => (
    <Card 
      key={claim.id}
      className="claim-card"
      style={{ 
        marginBottom: 16, 
        borderRadius: 12,
        border: '1px solid #e8e8e8',
        boxShadow: 'none'
      }}
      bodyStyle={{ padding: 16 }}
      hoverable
      onClick={() => showClaimDetails(claim)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Tag color={
            claim.status === 'Approved' ? 'green' : 
            claim.status === 'Rejected' ? 'red' : 
            claim.status.includes('Pending') ? 'orange' : 
            claim.status.includes('Flagged') ? 'purple' : 'blue'
          }>
            {claim.status}
          </Tag>
          <Text strong style={{ marginLeft: 8, fontSize: 16 }}>{claim.id}</Text>
        </div>
        <Text type="secondary">{claim.date.toLocaleDateString()}</Text>
      </div>
      
      <Divider style={{ margin: '16px 0' }} />
      
      <Row gutter={16}>
        <Col span={8}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Claim Type</Text>
            <div><Text strong>{claim.type}</Text></div>
          </div>
        </Col>
        <Col span={8}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Vehicle</Text>
            <div><Text strong>{claim.vehicleRegistration}</Text></div>
          </div>
        </Col>
        <Col span={8}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Amount</Text>
            <div><Text strong>RM {claim.claimAmount.toFixed(2)}</Text></div>
          </div>
        </Col>
      </Row>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <Button 
          type="link" 
          icon={<EyeOutlined />} 
          style={{ color: '#FF6600', padding: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            showClaimDetails(claim);
          }}
        >
          View Details
        </Button>
      </div>
    </Card>
  );
  
  return (
    <div className="claim-history-container" style={{ padding: 24 }}>
      <Title level={2}>Claim History</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Input
            placeholder="Search claims by ID, type, or vehicle"
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={6}>
          <Select
            style={{ width: '100%' }}
            value={statusFilter}
            onChange={value => setStatusFilter(value)}
          >
            <Select.Option value="All">All Statuses</Select.Option>
            <Select.Option value="Approved">Approved</Select.Option>
            <Select.Option value="Rejected">Rejected</Select.Option>
            <Select.Option value="Pending Review">Pending Review</Select.Option>
            <Select.Option value="Flagged">Flagged</Select.Option>
          </Select>
        </Col>
        <Col span={6}>
          <Select
            style={{ width: '100%' }}
            value={sortBy}
            onChange={value => setSortBy(value)}
          >
            <Select.Option value="Date (Newest)">Date (Newest)</Select.Option>
            <Select.Option value="Date (Oldest)">Date (Oldest)</Select.Option>
            <Select.Option value="Amount (Highest)">Amount (Highest)</Select.Option>
            <Select.Option value="Amount (Lowest)">Amount (Lowest)</Select.Option>
          </Select>
        </Col>
      </Row>
      
      <div className="claims-list">
        {filteredClaims.length > 0 ? (
          filteredClaims.map(claim => renderClaimCard(claim))
        ) : (
          <Empty description="No claims found matching your criteria" />
        )}
      </div>
    </div>
  );
}

export default ClaimHistoryScreen;







