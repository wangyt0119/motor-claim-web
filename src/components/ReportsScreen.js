import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Row, Col, Select, DatePicker, Button, 
  Divider, Space, Tag, Table, Statistic, Spin, Input, 
  Slider, Badge, Alert, Tooltip, Progress, notification
} from 'antd';
import { 
  DownloadOutlined, 
  FilterOutlined, 
  BarChartOutlined, 
  CalendarOutlined,
  ClearOutlined,
  PieChartOutlined,
  LineChartOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  RiseOutlined,  // Replace TrendingUpOutlined with RiseOutlined
  FileTextOutlined,
  ReloadOutlined,
  AreaChartOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Sample claim data class (similar to the Flutter ClaimData)
class ClaimData {
  constructor({
    id, date, type, status, location, vehicleModel,
    vehicleRegistration, claimAmount, policyNumber, notes
  }) {
    this.id = id;
    this.date = date;
    this.type = type;
    this.status = status;
    this.location = location;
    this.vehicleModel = vehicleModel;
    this.vehicleRegistration = vehicleRegistration;
    this.claimAmount = claimAmount;
    this.policyNumber = policyNumber;
    this.notes = notes || [];
  }
}

function ReportsScreen() {
  // Report criteria state
  const [startDate, setStartDate] = useState(moment().subtract(30, 'days'));
  const [endDate, setEndDate] = useState(moment());
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [reportType, setReportType] = useState('Summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [amountRange, setAmountRange] = useState([0, 50000]);
  
  // Generated report data
  const [reportData, setReportData] = useState(null);
  
  // Sample claims data for reporting
  const allClaims = [
    new ClaimData({
      id: 'CLM001',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      type: 'Vehicle Collision',
      status: 'Flagged for Review',
      location: 'Kuala Lumpur',
      vehicleModel: 'Honda Civic 2020',
      vehicleRegistration: 'WXY 1234',
      claimAmount: 15800.00,
      policyNumber: 'POL-78901234',
      notes: ['High claim amount', 'Multiple previous claims'],
    }),
    new ClaimData({
      id: 'CLM002',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      type: 'Minor Accident',
      status: 'Approved',
      location: 'Petaling Jaya',
      vehicleModel: 'Toyota Vios 2018',
      vehicleRegistration: 'XYZ 5678',
      claimAmount: 1200.00,
      policyNumber: 'POL-12345678',
      notes: ['Standard processing'],
    }),
    new ClaimData({
      id: 'CLM003',
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      type: 'Theft',
      status: 'Pending Customer Action',
      location: 'Shah Alam',
      vehicleModel: 'Honda City 2021',
      vehicleRegistration: 'DEF 3456',
      claimAmount: 8500.00,
      policyNumber: 'POL-34567890',
      notes: ['Documents required'],
    }),
    new ClaimData({
      id: 'CLM004',
      date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      type: 'Fire Damage',
      status: 'Escalated to Supervisor',
      location: 'Subang Jaya',
      vehicleModel: 'BMW X3 2020',
      vehicleRegistration: 'GHI 7890',
      claimAmount: 45000.00,
      policyNumber: 'POL-56789012',
      notes: ['Complex case'],
    }),
    new ClaimData({
      id: 'CLM005',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      type: 'Weather Damage',
      status: 'Rejected',
      location: 'Johor Bahru',
      vehicleModel: 'Mazda 3 2019',
      vehicleRegistration: 'ABC 9012',
      claimAmount: 3500.00,
      policyNumber: 'POL-98765432',
      notes: ['Policy exclusion'],
    }),
    new ClaimData({
      id: 'CLM006',
      date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      type: 'Vehicle Collision',
      status: 'Approved',
      location: 'Kuching',
      vehicleModel: 'Proton X70 2021',
      vehicleRegistration: 'KLM 3456',
      claimAmount: 12500.00,
      policyNumber: 'POL-11223344',
      notes: ['Standard processing'],
    }),
    new ClaimData({
      id: 'CLM007',
      date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
      type: 'Minor Accident',
      status: 'Approved',
      location: 'Penang',
      vehicleModel: 'Perodua Myvi 2020',
      vehicleRegistration: 'NOP 7890',
      claimAmount: 800.00,
      policyNumber: 'POL-55667788',
      notes: ['Quick approval'],
    }),
    new ClaimData({
      id: 'CLM008',
      date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      type: 'Theft',
      status: 'Rejected',
      location: 'Ipoh',
      vehicleModel: 'Toyota Camry 2019',
      vehicleRegistration: 'QRS 1234',
      claimAmount: 25000.00,
      policyNumber: 'POL-99887766',
      notes: ['Fraudulent activity suspected'],
    }),
  ];

  // Build amount range field
  const buildAmountRangeField = () => (
    <div style={{ marginTop: 16, marginBottom: 20 }}>
      <Text strong>Amount Range (RM)</Text>
      <div style={{ marginTop: 8 }}>
        <Row gutter={8} align="middle">
          <Col flex="1">
            <Input
              prefix={<DollarOutlined style={{ color: '#6C757D' }} />}
              value={`Min: ${amountRange[0]}`}
              readOnly
              style={{ 
                borderRadius: 8,
                padding: '8px 12px',
                cursor: 'default'
              }}
            />
          </Col>
          <Col>
            <Text type="secondary">to</Text>
          </Col>
          <Col flex="1">
            <Input
              prefix={<DollarOutlined style={{ color: '#6C757D' }} />}
              value={`Max: ${amountRange[1] === 50000 ? 'Any' : amountRange[1]}`}
              readOnly
              style={{ 
                borderRadius: 8,
                padding: '8px 12px',
                cursor: 'default'
              }}
            />
          </Col>
        </Row>
        <Slider
          range
          min={0}
          max={50000}
          value={amountRange}
          onChange={value => setAmountRange(value)}
          tipFormatter={value => `RM ${value}`}
          style={{ marginTop: 16 }}
        />
        <Text type="secondary" italic style={{ fontSize: 12 }}>
          Drag sliders to set custom amount range
        </Text>
      </div>
    </div>
  );

  // Generate report function
  const generateReport = () => {
    setIsGenerating(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Filter claims based on criteria
      const filteredClaims = allClaims.filter(claim => {
        const claimDate = moment(claim.date);
        const dateInRange = claimDate.isBetween(startDate, endDate, null, '[]');
        const statusMatch = selectedStatus === 'All' || claim.status === selectedStatus;
        const typeMatch = selectedType === 'All' || claim.type === selectedType;
        const locationMatch = selectedLocation === 'All' || claim.location === selectedLocation;
        const amountMatch = claim.claimAmount >= amountRange[0] && claim.claimAmount <= amountRange[1];
        
        return dateInRange && statusMatch && typeMatch && locationMatch && amountMatch;
      });
      
      // Calculate summary statistics
      const totalClaims = filteredClaims.length;
      const totalAmount = filteredClaims.reduce((sum, claim) => sum + claim.claimAmount, 0);
      const avgAmount = totalClaims > 0 ? totalAmount / totalClaims : 0;
      
      // Count by status
      const statusCounts = {};
      filteredClaims.forEach(claim => {
        statusCounts[claim.status] = (statusCounts[claim.status] || 0) + 1;
      });
      
      // Count by type
      const typeCounts = {};
      filteredClaims.forEach(claim => {
        typeCounts[claim.type] = (typeCounts[claim.type] || 0) + 1;
      });
      
      // Calculate approval rate
      const approvedCount = filteredClaims.filter(claim => claim.status === 'Approved').length;
      const approvalRate = totalClaims > 0 ? (approvedCount / totalClaims) * 100 : 0;
      
      // Set report data
      setReportData({
        filteredClaims,
        totalClaims,
        totalAmount,
        avgAmount,
        statusCounts,
        typeCounts,
        approvalRate,
        generatedAt: new Date(),
      });
      
      setIsGenerating(false);
    }, 1500);
  };
  
  // Export report function
  const exportReport = () => {
    notification.success({
      message: 'Report Exported',
      description: 'Report exported successfully!',
      icon: <DownloadOutlined style={{ color: '#4CAF50' }} />,
      placement: 'bottomRight',
      duration: 3,
    });
  };
  
  // Clear filters function
  const clearFilters = () => {
    setStartDate(moment().subtract(30, 'days'));
    setEndDate(moment());
    setSelectedStatus('All');
    setSelectedType('All');
    setReportType('Summary');
    setSelectedLocation('All');
    setSelectedPriority('All');
    setAmountRange([0, 50000]);
    setReportData(null);
    
    notification.success({
      message: 'Filters Cleared',
      description: 'All report filters have been reset to default values.',
      icon: <ReloadOutlined style={{ color: '#4CAF50' }} />,
      placement: 'bottomRight',
    });
  };
  
  // Handle date range change
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setStartDate(dates[0]);
      setEndDate(dates[1]);
    }
  };

  // Build report panel
  const buildReportPanel = () => {
    if (isGenerating) {
      return (
        <Card style={{ borderRadius: 12, height: '100%' }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Generating report...</Text>
            </div>
          </div>
        </Card>
      );
    }
    
    if (!reportData) {
      return (
        <Card style={{ borderRadius: 12, height: '100%' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            height: 400,
            background: '#f5f5f5',
            borderRadius: 8,
            padding: 24
          }}>
            <div style={{ 
              padding: 24,
              background: '#f8f9fa',
              borderRadius: '50%',
              marginBottom: 24
            }}>
              <BarChartOutlined style={{ fontSize: 48, color: '#6C757D' }} />
            </div>
            <Title level={4}>No Report Generated</Title>
            <Text type="secondary" style={{ fontSize: 16, marginBottom: 24, textAlign: 'center' }}>
              Select your criteria and click "Generate Report" to view analytics
            </Text>
            <Button 
              type="primary" 
              icon={<BarChartOutlined />}
              onClick={generateReport}
              size="large"
            >
              Generate Report
            </Button>
          </div>
        </Card>
      );
    }
    
    return (
      <Card 
        style={{ borderRadius: 12 }}
        bodyStyle={{ padding: 24 }}
      >
        {buildReportHeader()}
        <div style={{ marginTop: 24 }}>
          {buildSummaryCards()}
          <div style={{ marginTop: 24 }}>
            {buildStatusBreakdown()}
          </div>
          <div style={{ marginTop: 24 }}>
            {buildTypeBreakdown()}
          </div>
          {reportType === 'Detailed' && (
            <div style={{ marginTop: 24 }}>
              {buildDetailedTable()}
            </div>
          )}
          {reportType === 'Financial' && (
            <div style={{ marginTop: 24 }}>
              {buildFinancialAnalysis()}
            </div>
          )}
        </div>
      </Card>
    );
  };
  
  // Build report header
  const buildReportHeader = () => (
    <Row justify="space-between" align="middle">
      <Col>
        <Title level={3} style={{ margin: 0 }}>{reportType} Report</Title>
        <Text type="secondary">
          Generated on {moment(reportData.generatedAt).format('DD MMM YYYY, HH:mm')}
        </Text>
        <div>
          <Text type="secondary">
            Period: {startDate.format('DD MMM YYYY')} - {endDate.format('DD MMM YYYY')}
          </Text>
        </div>
      </Col>
      <Col>
        <Tag 
          color="#4CAF50"
          style={{ 
            padding: '4px 12px', 
            borderRadius: 16,
            fontSize: 12,
            fontWeight: 600
          }}
        >
          {reportData.filteredClaims.length} Claims
        </Tag>
      </Col>
    </Row>
  );
  
  // Build summary cards
  const buildSummaryCards = () => (
    <Row gutter={16}>
      <Col span={6}>
        {buildSummaryCard({
          title: 'Total Claims',
          value: reportData.totalClaims.toString(),
          icon: <FileTextOutlined />,
          color: '#2196F3'
        })}
      </Col>
      <Col span={6}>
        {buildSummaryCard({
          title: 'Total Amount',
          value: `RM ${reportData.totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          icon: <DollarOutlined />,
          color: '#4CAF50'
        })}
      </Col>
      <Col span={6}>
        {buildSummaryCard({
          title: 'Average Amount',
          value: `RM ${reportData.avgAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          icon: <RiseOutlined />,
          color: '#FF9800'
        })}
      </Col>
      <Col span={6}>
        {buildSummaryCard({
          title: 'Approval Rate',
          value: `${reportData.approvalRate.toFixed(1)}%`,
          icon: <CheckCircleOutlined />,
          color: '#9C27B0'
        })}
      </Col>
    </Row>
  );
  
  // Build summary card
  const buildSummaryCard = ({ title, value, icon, color }) => (
    <Card
      style={{ 
        backgroundColor: `${color}10`,
        borderRadius: 12,
        border: `1px solid ${color}20`
      }}
      bodyStyle={{ padding: 20 }}
    >
      <Row justify="space-between" align="middle">
        <Col>
          {React.cloneElement(icon, { style: { fontSize: 24, color } })}
        </Col>
        <Col>
          <div
            style={{
              padding: 8,
              backgroundColor: `${color}20`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RiseOutlined style={{ fontSize: 16, color }} />
          </div>
        </Col>
      </Row>
      <div style={{ marginTop: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{value}</Title>
        <Text type="secondary">{title}</Text>
      </div>
    </Card>
  );
  
  // Build status breakdown
  const buildStatusBreakdown = () => {
    const statusBreakdown = reportData.statusCounts;
    const totalClaims = reportData.totalClaims;
    
    return (
      <Card
        title="Status Breakdown"
        style={{ 
          backgroundColor: '#F8F9FA',
          borderRadius: 12,
          border: '1px solid #E9ECEF'
        }}
        bodyStyle={{ padding: 20 }}
      >
        {Object.entries(statusBreakdown).map(([status, count]) => (
          <div key={status} style={{ marginBottom: 12 }}>
            {buildBreakdownItem(status, count, totalClaims, getStatusColor(status))}
          </div>
        ))}
      </Card>
    );
  };
  
  // Build type breakdown
  const buildTypeBreakdown = () => {
    const typeBreakdown = reportData.typeCounts;
    const totalClaims = reportData.totalClaims;
    
    return (
      <Card
        title="Claim Type Breakdown"
        style={{ 
          backgroundColor: '#F8F9FA',
          borderRadius: 12,
          border: '1px solid #E9ECEF'
        }}
        bodyStyle={{ padding: 20 }}
      >
        {Object.entries(typeBreakdown).map(([type, count]) => (
          <div key={type} style={{ marginBottom: 12 }}>
            {buildBreakdownItem(type, count, totalClaims, '#6C757D')}
          </div>
        ))}
      </Card>
    );
  };
  
  // Build breakdown item
  const buildBreakdownItem = (label, count, total, color) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <div style={{ marginBottom: 12 }}>
        <Row align="middle">
          <div 
            style={{ 
              width: 12, 
              height: 12, 
              backgroundColor: color, 
              borderRadius: 2 
            }} 
          />
          <div style={{ width: 12 }} />
          <Col flex="1">
            <Text style={{ fontSize: 14, color: '#1A1A1A' }}>
              {label}
            </Text>
          </Col>
          <Text strong style={{ fontSize: 14, color: '#1A1A1A' }}>
            {count} ({percentage.toFixed(1)}%)
          </Text>
        </Row>
      </div>
    );
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#E53E3E';
      case 'flagged for review':
        return '#FF6600';
      case 'pending customer action':
        return '#9C27B0';
      case 'escalated to supervisor':
        return '#673AB7';
      default:
        return '#6C757D';
    }
  };
  
  // Build detailed table
  const buildDetailedTable = () => (
    <div 
      style={{ 
        padding: 20, 
        backgroundColor: '#F8F9FA', 
        borderRadius: 12, 
        border: '1px solid #E9ECEF' 
      }}
    >
      <Title level={4} style={{ marginTop: 0 }}>Detailed Claims List</Title>
      <div style={{ marginTop: 16 }}>
        <div 
          style={{ 
            backgroundColor: 'white', 
            borderRadius: 8, 
            border: '1px solid #E0E0E0' 
          }}
        >
          {/* Table Header */}
          <div 
            style={{ 
              padding: 16, 
              backgroundColor: '#F8F9FA', 
              borderTopLeftRadius: 8, 
              borderTopRightRadius: 8 
            }}
          >
            <Row>
              <Col flex="2"><Text strong>Claim ID</Text></Col>
              <Col flex="2"><Text strong>Date</Text></Col>
              <Col flex="3"><Text strong>Type</Text></Col>
              <Col flex="3"><Text strong>Status</Text></Col>
              <Col flex="2"><Text strong>Amount</Text></Col>
            </Row>
          </div>
          
          {/* Table Rows */}
          {reportData.filteredClaims.slice(0, 10).map((claim, index) => (
            <div 
              key={claim.id}
              style={{ 
                padding: 16, 
                borderBottom: index < Math.min(reportData.filteredClaims.length, 10) - 1 ? '0.5px solid #E0E0E0' : 'none' 
              }}
            >
              <Row align="middle">
                <Col flex="2"><Text style={{ fontSize: 14 }}>{claim.id}</Text></Col>
                <Col flex="2"><Text style={{ fontSize: 14 }}>{moment(claim.date).format('DD/MM/YYYY')}</Text></Col>
                <Col flex="3"><Text style={{ fontSize: 14 }}>{claim.type}</Text></Col>
                <Col flex="3">
                  <div 
                    style={{ 
                      padding: '4px 8px', 
                      backgroundColor: `${getStatusColor(claim.status)}1A`, 
                      borderRadius: 12,
                      display: 'inline-block'
                    }}
                  >
                    <Text 
                      style={{ 
                        fontSize: 12, 
                        color: getStatusColor(claim.status),
                        fontWeight: 600
                      }}
                    >
                      {claim.status}
                    </Text>
                  </div>
                </Col>
                <Col flex="2">
                  <Text style={{ fontSize: 14 }}>
                    RM {claim.claimAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </Col>
              </Row>
            </div>
          ))}
          
          {/* Show limited results message */}
          {reportData.filteredClaims.length > 10 && (
            <div style={{ padding: 16 }}>
              <Text 
                type="secondary" 
                italic 
                style={{ fontSize: 12 }}
              >
                Showing first 10 of {reportData.filteredClaims.length} claims
              </Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  // Build financial analysis
  const buildFinancialAnalysis = () => {
    const claims = reportData.filteredClaims;
    const totalAmount = reportData.totalAmount;
    const averageAmount = reportData.avgAmount;
    
    // Calculate additional financial metrics
    const approvedAmount = claims
      .filter(claim => claim.status === 'Approved')
      .reduce((sum, claim) => sum + claim.claimAmount, 0);
      
    const rejectedAmount = claims
      .filter(claim => claim.status === 'Rejected')
      .reduce((sum, claim) => sum + claim.claimAmount, 0);
      
    const pendingAmount = claims
      .filter(claim => !['Approved', 'Rejected'].includes(claim.status))
      .reduce((sum, claim) => sum + claim.claimAmount, 0);
    
    return (
      <div 
        style={{ 
          padding: 20, 
          backgroundColor: '#F8F9FA', 
          borderRadius: 12, 
          border: '1px solid #E9ECEF' 
        }}
      >
        <Title level={4} style={{ marginTop: 0 }}>Financial Analysis</Title>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={8}>
            {buildFinancialCard({
              title: 'Approved Amount',
              amount: approvedAmount,
              color: '#4CAF50',
              icon: <CheckCircleOutlined />
            })}
          </Col>
          <Col span={8}>
            {buildFinancialCard({
              title: 'Rejected Amount',
              amount: rejectedAmount,
              color: '#E53E3E',
              icon: <CloseCircleOutlined />
            })}
          </Col>
          <Col span={8}>
            {buildFinancialCard({
              title: 'Pending Amount',
              amount: pendingAmount,
              color: '#FF9800',
              icon: <ClockCircleOutlined />
            })}
          </Col>
        </Row>
      </div>
    );
  };

  // Add the buildFinancialCard function
  const buildFinancialCard = ({ title, amount, color, icon }) => (
    <div 
      style={{ 
        padding: 16, 
        backgroundColor: 'white', 
        borderRadius: 8, 
        border: `1px solid ${color}33` 
      }}
    >
      <Row align="middle">
        {React.cloneElement(icon, { style: { color, fontSize: 20 } })}
        <div style={{ width: 8 }} />
        <Text style={{ fontSize: 14, color: '#6C757D' }}>
          {title}
        </Text>
      </Row>
      <div style={{ height: 8 }} />
      <Text style={{ fontSize: 18, fontWeight: 'bold', color }}>
        RM {amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={2}>Claims Reports & Analytics</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Generate comprehensive reports and insights
          </Text>
        </Col>
        <Col>
          <Tag 
            icon={<BarChartOutlined />} 
            color="#4CAF50"
            style={{ 
              padding: '8px 16px', 
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8
            }}
          >
            {allClaims.length} Total Claims
          </Tag>
        </Col>
      </Row>
      
      {/* Main Content */}
      <Row gutter={24} style={{ marginTop: 24 }}>
        {/* Left Panel - Report Criteria */}
        <Col span={8}>
          <Card 
            title={
              <Space>
                <FilterOutlined style={{ color: '#FF6600' }} />
                <span>Report Criteria</span>
              </Space>
            }
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 24 }}
          >
            {/* Report Type */}
            <div style={{ marginBottom: 20 }}>
              <Text strong>Report Type</Text>
              <Select
                style={{ width: '100%', marginTop: 8 }}
                value={reportType}
                onChange={value => setReportType(value)}
              >
                <Option value="Summary">Summary</Option>
                <Option value="Detailed">Detailed</Option>
                <Option value="Financial">Financial</Option>
                <Option value="Performance">Performance</Option>
              </Select>
            </div>
            
            {/* Date Range */}
            <div style={{ marginBottom: 20 }}>
              <Text strong>Date Range</Text>
              <RangePicker
                style={{ width: '100%', marginTop: 8 }}
                value={[startDate, endDate]}
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
              />
            </div>
            
            {/* Status Filter */}
            <div style={{ marginBottom: 20 }}>
              <Text strong>Status Filter</Text>
              <Select
                style={{ width: '100%', marginTop: 8 }}
                value={selectedStatus}
                onChange={value => setSelectedStatus(value)}
              >
                <Option value="All">All</Option>
                <Option value="Approved">Approved</Option>
                <Option value="Rejected">Rejected</Option>
                <Option value="Flagged for Review">Flagged for Review</Option>
                <Option value="Pending Customer Action">Pending Customer Action</Option>
                <Option value="Escalated to Supervisor">Escalated to Supervisor</Option>
              </Select>
            </div>
            
            {/* Type Filter */}
            <div style={{ marginBottom: 20 }}>
              <Text strong>Claim Type</Text>
              <Select
                style={{ width: '100%', marginTop: 8 }}
                value={selectedType}
                onChange={value => setSelectedType(value)}
              >
                <Option value="All">All</Option>
                <Option value="Vehicle Collision">Vehicle Collision</Option>
                <Option value="Minor Accident">Minor Accident</Option>
                <Option value="Theft">Theft</Option>
                <Option value="Fire Damage">Fire Damage</Option>
                <Option value="Weather Damage">Weather Damage</Option>
              </Select>
            </div>
            
            {/* Additional Filters */}
            <Divider />
            <Text strong style={{ fontSize: 16 }}>Additional Filters</Text>
            
            {/* Amount Range */}
            {buildAmountRangeField()}
            
            {/* Location Filter */}
            <div style={{ marginBottom: 20 }}>
              <Text strong>Location Filter</Text>
              <Select
                style={{ width: '100%', marginTop: 8 }}
                value={selectedLocation}
                onChange={value => setSelectedLocation(value)}
              >
                <Option value="All">All</Option>
                <Option value="Kuala Lumpur">Kuala Lumpur</Option>
                <Option value="Petaling Jaya">Petaling Jaya</Option>
                <Option value="Shah Alam">Shah Alam</Option>
                <Option value="Subang Jaya">Subang Jaya</Option>
                <Option value="Johor Bahru">Johor Bahru</Option>
                <Option value="Penang">Penang</Option>
                <Option value="Kuching">Kuching</Option>
                <Option value="Ipoh">Ipoh</Option>
              </Select>
            </div>
            
            {/* Priority Filter */}
            <div style={{ marginBottom: 20 }}>
              <Text strong>Priority Level</Text>
              <Select
                style={{ width: '100%', marginTop: 8 }}
                value={selectedPriority}
                onChange={value => setSelectedPriority(value)}
              >
                <Option value="All">All</Option>
                <Option value="High">High</Option>
                <Option value="Medium">Medium</Option>
                <Option value="Low">Low</Option>
              </Select>
            </div>
            
            {/* Action Buttons */}
            <Divider />
            <Button
              type="primary"
              icon={<BarChartOutlined />}
              loading={isGenerating}
              onClick={generateReport}
              block
              style={{ marginBottom: 12, height: 48 }}
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
            
            {reportData && (
              <Row gutter={8}>
                <Col span={12}>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={exportReport}
                    block
                  >
                    Export
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    icon={<ClearOutlined />}
                    onClick={clearFilters}
                    block
                  >
                    Clear
                  </Button>
                </Col>
              </Row>
            )}
          </Card>
        </Col>
        
        {/* Right Panel - Report Display */}
        <Col span={16}>
          {buildReportPanel()}
        </Col>
      </Row>
    </div>
  );
}

export default ReportsScreen;













