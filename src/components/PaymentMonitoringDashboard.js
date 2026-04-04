import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Input, Select, Row, Col, 
  Tag, Button, Space, Empty, Divider, Modal,
  List, Badge, message, Alert, DatePicker
} from 'antd';
import { 
  SearchOutlined, 
  DownloadOutlined,
  DollarOutlined, // Replace PaymentOutlined
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  CalendarOutlined,
  ClearOutlined,
  ExclamationOutlined, // Replace ErrorOutlined
  EyeOutlined,
  SyncOutlined, // Replace RefreshOutlined
  SettingOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

function PaymentMonitoringDashboard() {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState(null);

  // Sample payment data
  const [payments] = useState([
    {
      claimId: 'CLM002',
      customerName: 'Ahmad bin Abdullah',
      payoutAmount: 1200.00,
      bankName: 'Maybank',
      maskedAccountNumber: '****1234',
      paymentStatus: 'Paid',
      failureReason: null,
      retryCount: 0,
      lastAttemptDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      paymentReference: 'PAY-ETQ-240001',
      officerAssigned: 'Sarah Johnson',
      processingNotes: 'Payment completed successfully',
    },
    {
      claimId: 'CLM006',
      customerName: 'Siti Nurhaliza',
      payoutAmount: 8500.00,
      bankName: 'CIMB Bank',
      maskedAccountNumber: '****5678',
      paymentStatus: 'On Hold',
      failureReason: 'Bank verification required - additional documentation needed',
      retryCount: 0,
      lastAttemptDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
      paymentReference: 'PAY-ETQ-240002',
      officerAssigned: 'Michael Chen',
      processingNotes: 'Waiting for customer to provide additional bank verification documents',
    },
    {
      claimId: 'CLM007',
      customerName: 'Raj Kumar',
      payoutAmount: 2800.00,
      bankName: 'Public Bank',
      maskedAccountNumber: '****9012',
      paymentStatus: 'Failed',
      failureReason: 'Invalid bank account details - account number incorrect',
      retryCount: 2,
      lastAttemptDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
      paymentReference: 'PAY-ETQ-240003',
      officerAssigned: 'Lisa Wong',
      processingNotes: 'Customer contacted to update bank details. Awaiting response.',
    },
    {
      claimId: 'CLM008',
      customerName: 'Tan Wei Ming',
      payoutAmount: 15600.00,
      bankName: 'Hong Leong Bank',
      maskedAccountNumber: '****3456',
      paymentStatus: 'Paid',
      failureReason: null,
      retryCount: 0,
      lastAttemptDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      paymentReference: 'PAY-ETQ-240004',
      officerAssigned: 'David Lim',
      processingNotes: 'Large amount payment processed with supervisor approval',
    },
    {
      claimId: 'CLM012',
      customerName: 'Wong Kar Wai',
      payoutAmount: 3200.00,
      bankName: 'Standard Chartered',
      maskedAccountNumber: '****8642',
      paymentStatus: 'Failed',
      failureReason: 'Bank system timeout - network connectivity issue',
      retryCount: 3,
      lastAttemptDate: new Date(Date.now() - 30 * 60 * 1000),
      paymentReference: 'PAY-ETQ-240008',
      officerAssigned: 'Kevin Loh',
      processingNotes: 'Multiple retry attempts failed. Escalating to technical team.',
    },
  ]);

  const [filteredPayments, setFilteredPayments] = useState([]);

  useEffect(() => {
    let filtered = payments.filter(payment => {
      const matchesStatus = selectedStatusFilter === 'All' || 
                          payment.paymentStatus === selectedStatusFilter;
      const matchesSearch = !searchQuery || 
                          payment.claimId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          payment.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = !selectedDateRange || 
                        (payment.lastAttemptDate >= selectedDateRange[0].toDate() && 
                         payment.lastAttemptDate <= selectedDateRange[1].endOf('day').toDate());
      return matchesStatus && matchesSearch && matchesDate;
    });

    // Sort by last attempt date (newest first)
    filtered.sort((a, b) => b.lastAttemptDate - a.lastAttemptDate);
    
    setFilteredPayments(filtered);
  }, [selectedStatusFilter, searchQuery, selectedDateRange, payments]);

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid': return '#4CAF50';
      case 'Pending': return '#2196F3';
      case 'On Hold': return '#FF9800';
      case 'Failed': return '#E53E3E';
      default: return '#6C757D';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid': return <CheckCircleOutlined />;
      case 'Pending': return <ClockCircleOutlined />;
      case 'On Hold': return <ExclamationCircleOutlined />;
      case 'Failed': return <CloseCircleOutlined />;
      default: return <WarningOutlined />;
    }
  };

  // Helper functions for actions
  const exportPaymentReport = () => {
    message.success(`Exporting ${filteredPayments.length} payment records to CSV...`);
    // Actual export logic would go here
  };

  const handleDateRangeChange = (dates) => {
    setSelectedDateRange(dates);
  };

  const clearDateFilter = () => {
    setSelectedDateRange(null);
  };

  const viewPaymentDetails = (payment) => {
    Modal.info({
      title: 'Payment Details',
      icon: <FileTextOutlined />,
      width: 600,
      content: (
        <div style={{ maxHeight: '60vh', overflow: 'auto', marginTop: 16 }}>
          {renderModalSection('Payment Information', [
            renderModalRow('Claim ID:', payment.claimId),
            renderModalRow('Customer:', payment.customerName),
            renderModalRow('Amount:', `RM ${payment.payoutAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`),
            renderModalRow('Status:', payment.paymentStatus),
            renderModalRow('Reference:', payment.paymentReference),
          ])}

          <Divider style={{ margin: '16px 0' }} />

          {renderModalSection('Bank Information', [
            renderModalRow('Bank Name:', payment.bankName),
            renderModalRow('Account Number:', payment.maskedAccountNumber),
          ])}

          <Divider style={{ margin: '16px 0' }} />

          {renderModalSection('Processing Details', [
            renderModalRow('Officer Assigned:', payment.officerAssigned),
            renderModalRow('Last Attempt:', moment(payment.lastAttemptDate).format('DD MMM YYYY, HH:mm:ss')),
            renderModalRow('Retry Count:', payment.retryCount.toString()),
            payment.failureReason && renderModalRow('Failure Reason:', payment.failureReason),
          ])}

          <Divider style={{ margin: '16px 0' }} />

          {renderModalSection('Processing Notes', [
            <div 
              key="processing-notes"
              style={{ 
                width: '100%', 
                padding: 12, 
                backgroundColor: '#F8F9FA', 
                borderRadius: 8, 
                border: '1px solid #E9ECEF',
                marginTop: 8
              }}
            >
              <Text style={{ fontSize: 13, lineHeight: 1.5 }}>
                {payment.processingNotes}
              </Text>
            </div>
          ])}
        </div>
      ),
      okText: 'Close',
      maskClosable: true,
    });
  };

  const retryPayment = (payment) => {
    message.info(`Retrying payment for ${payment.claimId}...`);
    // Actual retry logic would go here
  };

  const notifyAdmin = (payment) => {
    Modal.confirm({
      title: 'Notify Admin',
      icon: <SettingOutlined />,
      content: (
        <div>
          <p>Send notification to admin regarding:</p>
          <p>Claim ID: {payment.claimId}</p>
          <p>Customer: {payment.customerName}</p>
          <p>Amount: RM {payment.payoutAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p>Status: {payment.paymentStatus}</p>
          {payment.failureReason && <p>Issue: {payment.failureReason}</p>}
        </div>
      ),
      okText: 'Notify Admin',
      cancelText: 'Cancel',
      okButtonProps: { style: { backgroundColor: '#9C27B0', borderColor: '#9C27B0' } },
      onOk: () => {
        message.success(`Admin notified about ${payment.claimId}`);
      },
    });
  };

  // Render helper functions
  const renderDetailItem = (label, value) => (
    <div>
      <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
      <div>
        <Text style={{ fontSize: 13, fontWeight: 600 }}>{value}</Text>
      </div>
    </div>
  );

  const renderModalSection = (title, children) => (
    <div>
      <Text strong style={{ fontSize: 16 }}>{title}</Text>
      <div style={{ marginTop: 8 }}>
        {children}
      </div>
    </div>
  );

  const renderModalRow = (label, value) => (
    <Row style={{ marginBottom: 8 }} key={label}>
      <Col span={8}>
        <Text type="secondary" style={{ fontSize: 13 }}>{label}</Text>
      </Col>
      <Col span={16}>
        <Text strong style={{ fontSize: 13 }}>{value}</Text>
      </Col>
    </Row>
  );

  // Render stat chip for payment status counts
  const renderStatChip = (label, count, color) => (
    <Tag 
      style={{ 
        backgroundColor: `${color}10`, 
        borderColor: `${color}30`,
        borderRadius: 16,
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}
    >
      <Badge color={color} />
      <span style={{ color, fontWeight: 600, fontSize: 12 }}>
        {label} ({count})
      </span>
    </Tag>
  );

  // Build header section
  const buildHeader = () => (
    <Row justify="space-between" align="middle">
      <Col>
        <Title level={2} style={{ margin: 0 }}>Payment Monitoring Dashboard</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Monitor and manage approved claim payments
        </Text>
      </Col>
      <Col>
        <Space>
          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={exportPaymentReport}
            style={{ backgroundColor: '#4CAF50', borderColor: '#4CAF50' }}
          >
            Export Report
          </Button>
          <Tag 
            icon={<DollarOutlined />}
            color="#2196F3"
            style={{ 
              padding: '8px 16px', 
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8
            }}
          >
            {payments.length} Payments
          </Tag>
        </Space>
      </Col>
    </Row>
  );

  // Build filters row
  const buildFiltersRow = () => (
    <Row>
      <Col span={24}>
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
            Payment Status
          </Text>
        </div>
        <Select
          value={selectedStatusFilter}
          onChange={setSelectedStatusFilter}
          style={{ width: '100%' }}
          bordered
        >
          <Option value="All">All</Option>
          <Option value="Paid">Paid</Option>
          <Option value="Pending">Pending</Option>
          <Option value="On Hold">On Hold</Option>
          <Option value="Failed">Failed</Option>
        </Select>
      </Col>
    </Row>
  );

  // Build search and date filter
  const buildSearchAndDateFilter = () => (
    <Row gutter={16}>
      <Col flex="2">
        <Input
          placeholder="Search by Claim ID or Customer Name..."
          prefix={<SearchOutlined style={{ color: '#6C757D' }} />}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ height: 48 }}
        />
      </Col>
      <Col flex="1">
        <RangePicker
          value={selectedDateRange}
          onChange={handleDateRangeChange}
          style={{ height: 48 }}
          format="DD/MM/YYYY"
          placeholder={['Start Date', 'End Date']}
        />
        {selectedDateRange && (
          <Button
            icon={<ClearOutlined />}
            onClick={clearDateFilter}
            size="small"
            type="text"
            style={{ marginLeft: 8 }}
          />
        )}
      </Col>
    </Row>
  );

  // Build stats row
  const buildStatsRow = () => {
    const paid = payments.filter(p => p.paymentStatus === 'Paid').length;
    const pending = payments.filter(p => p.paymentStatus === 'Pending').length;
    const onHold = payments.filter(p => p.paymentStatus === 'On Hold').length;
    const failed = payments.filter(p => p.paymentStatus === 'Failed').length;
    const totalAmount = payments.reduce((sum, payment) => sum + payment.payoutAmount, 0);
    const totalRetries = payments.reduce((sum, payment) => sum + payment.retryCount, 0);

    return (
      <Row align="middle">
        <Col>
          <Space>
            {renderStatChip('Paid', paid, '#4CAF50')}
            {renderStatChip('Pending', pending, '#2196F3')}
            {renderStatChip('On Hold', onHold, '#FF9800')}
            {renderStatChip('Failed', failed, '#E53E3E')}
          </Space>
        </Col>
        <Col style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <Text strong style={{ fontSize: 14, color: '#4CAF50', display: 'block' }}>
            Total Amount: RM {totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={{ fontSize: 12, color: '#E53E3E' }}>
            Total Retries: {totalRetries}
          </Text>
        </Col>
      </Row>
    );
  };

  // Build payments list
  const buildPaymentsList = () => {
    if (!filteredPayments || filteredPayments.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#6C757D' }}>
                No payments found
              </div>
              <div style={{ fontSize: 14, color: '#6C757D' }}>
                Try adjusting your search or filter criteria
              </div>
            </div>
          }
        />
      );
    }

    return (
      <List
        dataSource={filteredPayments}
        renderItem={buildPaymentCard}
        itemLayout="vertical"
      />
    );
  };

  // Build payment card
  const buildPaymentCard = (payment) => {
    const statusColor = getPaymentStatusColor(payment.paymentStatus);
    
    return (
      <Card 
        key={payment.claimId}
        style={{ 
          marginBottom: 16, 
          borderRadius: 12,
          borderColor: `${statusColor}30`,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}
        bodyStyle={{ padding: 20 }}
      >
        <Row align="middle">
          {(payment.paymentStatus === 'Failed' || payment.retryCount > 0) && (
            <Col style={{ marginRight: 12 }}>
              <div style={{ 
                padding: 6, 
                backgroundColor: `${statusColor}10`,
                borderRadius: 6
              }}>
                <ExclamationOutlined style={{ color: statusColor, fontSize: 16 }} />
              </div>
            </Col>
          )}
          
          <Col flex="1">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Text strong style={{ fontSize: 16 }}>{payment.claimId}</Text>
              <Tag 
                color={statusColor}
                style={{ 
                  marginLeft: 8, 
                  textTransform: 'uppercase',
                  fontSize: 10,
                  fontWeight: 'bold',
                  padding: '2px 6px',
                  borderRadius: 10
                }}
              >
                {payment.paymentStatus}
              </Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
              {payment.customerName}
            </Text>
          </Col>
          
          <Col>
            <Text strong style={{ fontSize: 18, color: '#4CAF50' }}>
              RM {payment.payoutAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </Col>
        </Row>
        
        <Divider style={{ margin: '16px 0 16px 0' }} />
        
        <Row gutter={16}>
          <Col span={6}>
            {renderDetailItem('Bank Details', `${payment.bankName}\n${payment.maskedAccountNumber}`)}
          </Col>
          <Col span={6}>
            {renderDetailItem('Officer', payment.officerAssigned)}
          </Col>
          <Col span={6}>
            {renderDetailItem('Last Attempt', moment(payment.lastAttemptDate).format('DD MMM YYYY, HH:mm'))}
          </Col>
          {payment.retryCount > 0 && (
            <Col span={6}>
              {renderDetailItem('Retries', `${payment.retryCount} attempt${payment.retryCount > 1 ? 's' : ''}`)}
            </Col>
          )}
        </Row>
        
        {payment.failureReason && (
          <div 
            style={{ 
              marginTop: 12,
              padding: 12,
              backgroundColor: '#E53E3E10',
              borderRadius: 8,
              border: '1px solid #E53E3E30',
              display: 'flex',
              alignItems: 'flex-start'
            }}
          >
            <ExclamationOutlined style={{ color: '#E53E3E', fontSize: 16, marginTop: 2, marginRight: 8 }} />
            <div>
              <Text style={{ fontSize: 12, fontWeight: 600, color: '#E53E3E', display: 'block' }}>
                Failure Reason:
              </Text>
              <Text style={{ fontSize: 12, color: '#E53E3E' }}>
                {payment.failureReason}
              </Text>
            </div>
          </div>
        )}
        
        {payment.processingNotes && (
          <div 
            style={{ 
              marginTop: 12,
              padding: 12,
              backgroundColor: '#F8F9FA',
              borderRadius: 8,
              border: '1px solid #E9ECEF',
              display: 'flex',
              alignItems: 'flex-start'
            }}
          >
            <FileTextOutlined style={{ color: '#6C757D', fontSize: 16, marginTop: 2, marginRight: 8 }} />
            <Text style={{ fontSize: 12, color: '#6C757D', fontStyle: 'italic' }}>
              {payment.processingNotes}
            </Text>
          </div>
        )}
        
        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Space>
              <Button 
                icon={<EyeOutlined />} 
                onClick={() => viewPaymentDetails(payment)}
                style={{ color: '#2196F3', borderColor: '#2196F3' }}
              >
                View Details
              </Button>
              
              {payment.paymentStatus === 'Failed' && (
                <Button 
                  icon={<SyncOutlined />} 
                  onClick={() => retryPayment(payment)}
                  style={{ backgroundColor: '#FF9800', borderColor: '#FF9800', color: 'white' }}
                >
                  Retry Payment
                </Button>
              )}
              
              <Button 
                icon={<SettingOutlined />} 
                onClick={() => notifyAdmin(payment)}
                style={{ backgroundColor: '#9C27B0', borderColor: '#9C27B0', color: 'white' }}
              >
                Notify Admin
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      {buildHeader()}
      <div style={{ marginTop: 24 }}>
        {buildFiltersRow()}
      </div>
      <div style={{ marginTop: 16 }}>
        {buildSearchAndDateFilter()}
      </div>
      <div style={{ marginTop: 24 }}>
        {buildStatsRow()}
      </div>
      <div style={{ marginTop: 24 }}>
        {buildPaymentsList()}
      </div>
    </div>
  );
}

export default PaymentMonitoringDashboard;








