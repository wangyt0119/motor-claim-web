import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Input, Select, Row, Col, 
  Tag, Button, Space, Empty, Statistic, Divider,
  List, Avatar, Badge, Modal, message, Alert
} from 'antd';
import { 
  SearchOutlined, 
  PaymentOutlined,
  BankOutlined,
  FileTextOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  EyeOutlined,
  WarningOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

function MyClaimPaymentsScreen() {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample payment data
  const [payments, setPayments] = useState([
    {
      claimId: 'CLM002',
      payoutAmount: 1200.00,
      bankName: 'Maybank',
      maskedAccountNumber: '****1234',
      paymentStatus: 'Paid',
      datePaid: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      paymentReference: 'PAY-ETQ-240001',
      receiptUrl: 'https://etiqa.com/receipts/PAY-ETQ-240001.pdf',
      failureReason: null,
    },
    {
      claimId: 'CLM006',
      payoutAmount: 8500.00,
      bankName: 'CIMB Bank',
      maskedAccountNumber: '****5678',
      paymentStatus: 'On Hold',
      datePaid: null,
      paymentReference: 'PAY-ETQ-240002',
      receiptUrl: null,
      failureReason: 'Bank verification required - additional documentation needed',
    },
    {
      claimId: 'CLM007',
      payoutAmount: 2800.00,
      bankName: 'Public Bank',
      maskedAccountNumber: '****9012',
      paymentStatus: 'Failed',
      datePaid: null,
      paymentReference: 'PAY-ETQ-240003',
      receiptUrl: null,
      failureReason: 'Invalid bank account details - account number incorrect',
    },
    {
      claimId: 'CLM008',
      payoutAmount: 15600.00,
      bankName: 'Hong Leong Bank',
      maskedAccountNumber: '****3456',
      paymentStatus: 'Paid',
      datePaid: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      paymentReference: 'PAY-ETQ-240004',
      receiptUrl: 'https://etiqa.com/receipts/PAY-ETQ-240004.pdf',
      failureReason: null,
    },
    {
      claimId: 'CLM009',
      payoutAmount: 22000.00,
      bankName: 'RHB Bank',
      maskedAccountNumber: '****7890',
      paymentStatus: 'Paid',
      datePaid: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      paymentReference: 'PAY-ETQ-240005',
      receiptUrl: 'https://etiqa.com/receipts/PAY-ETQ-240005.pdf',
      failureReason: null,
    },
    {
      claimId: 'CLM010',
      payoutAmount: 4500.00,
      bankName: 'AmBank',
      maskedAccountNumber: '****2468',
      paymentStatus: 'Pending',
      datePaid: null,
      paymentReference: 'PAY-ETQ-240006',
      receiptUrl: null,
      failureReason: null,
    },
    {
      claimId: 'CLM011',
      payoutAmount: 6750.00,
      bankName: 'Alliance Bank',
      maskedAccountNumber: '****1357',
      paymentStatus: 'On Hold',
      datePaid: null,
      paymentReference: 'PAY-ETQ-240007',
      receiptUrl: null,
      failureReason: 'Compliance review in progress - large amount verification',
    },
  ]);

  const [filteredPayments, setFilteredPayments] = useState([]);

  useEffect(() => {
    let filtered = payments.filter(payment => {
      const matchesStatus = selectedStatusFilter === 'All' || payment.paymentStatus === selectedStatusFilter;
      const matchesSearch = !searchQuery || payment.claimId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });

    // Sort by date (newest first, then by claim ID for pending/failed)
    filtered.sort((a, b) => {
      if (a.datePaid && b.datePaid) {
        return b.datePaid.getTime() - a.datePaid.getTime();
      } else if (a.datePaid) {
        return -1;
      } else if (b.datePaid) {
        return 1;
      } else {
        return b.claimId.localeCompare(a.claimId);
      }
    });

    setFilteredPayments(filtered);
  }, [selectedStatusFilter, searchQuery, payments]);

  const getStatusColor = (status) => {
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
      default: return null;
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'Pending': return 'Payment being processed';
      case 'On Hold': return 'Verification required';
      case 'Failed': return 'Payment unsuccessful';
      default: return status;
    }
  };

  const downloadReceipt = (payment) => {
    message.success(`Downloading receipt for ${payment.claimId}...`);
    // Actual download logic would go here
    window.open(payment.receiptUrl, '_blank');
  };

  const reportIssue = (payment) => {
    Modal.confirm({
      title: 'Report Payment Issue',
      content: (
        <div>
          <p>Claim ID: {payment.claimId}</p>
          <p>Amount: RM {payment.payoutAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p>Status: {payment.paymentStatus}</p>
          {payment.failureReason && <p>Issue: {payment.failureReason}</p>}
          <p style={{ marginTop: 16 }}>Our customer service team will contact you within 24 hours to resolve this issue.</p>
        </div>
      ),
      okText: 'Report Issue',
      cancelText: 'Cancel',
      okButtonProps: { style: { backgroundColor: '#FF9800', borderColor: '#FF9800' } },
      onOk: () => {
        message.info(`Issue reported for ${payment.claimId}. We will contact you soon.`, 5);
      },
    });
  };

  const updateBankDetails = (payment) => {
    message.info(`Redirecting to update bank details for ${payment.claimId}...`);
    // Navigation logic would go here
  };

  const viewPaymentDetails = (payment) => {
    Modal.info({
      title: 'Payment Details',
      content: (
        <div>
          <p>Claim ID: {payment.claimId}</p>
          <p>Amount: RM {payment.payoutAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p>Bank: {payment.bankName}</p>
          <p>Account: {payment.maskedAccountNumber}</p>
          <p>Reference: {payment.paymentReference}</p>
          <p>Status: {payment.paymentStatus}</p>
          <p style={{ marginTop: 16 }}>Your payment is currently being processed. You will receive a notification once completed.</p>
        </div>
      ),
      okText: 'Close',
    });
  };

  const buildHeader = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <Title level={2} style={{ margin: 0 }}>My Claim Payments</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Track your approved claim payments and download receipts
        </Text>
      </div>
      <Tag 
        color="#4CAF50"
        icon={<PaymentOutlined />}
        style={{ 
          padding: '8px 16px', 
          fontSize: 14,
          fontWeight: 600,
          borderRadius: 8
        }}
      >
        {payments.length} Payments
      </Tag>
    </div>
  );

  const buildFiltersAndSearch = () => (
    <div style={{ display: 'flex', marginBottom: 24 }}>
      <Select
        value={selectedStatusFilter}
        onChange={setSelectedStatusFilter}
        style={{ 
          width: 120, 
          marginRight: 16,
          borderRadius: 8
        }}
        dropdownStyle={{ borderRadius: 8 }}
      >
        <Option value="All">All</Option>
        <Option value="Paid">Paid</Option>
        <Option value="Pending">Pending</Option>
        <Option value="On Hold">On Hold</Option>
        <Option value="Failed">Failed</Option>
      </Select>
      
      <Search
        placeholder="Search by Claim ID..."
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
    const paidCount = payments.filter(p => p.paymentStatus === 'Paid').length;
    const pendingCount = payments.filter(p => p.paymentStatus === 'Pending').length;
    const onHoldCount = payments.filter(p => p.paymentStatus === 'On Hold').length;
    const failedCount = payments.filter(p => p.paymentStatus === 'Failed').length;
    const totalPaid = payments
      .filter(p => p.paymentStatus === 'Paid')
      .reduce((sum, payment) => sum + payment.payoutAmount, 0);

    return (
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {renderStatChip('Paid', paidCount, '#4CAF50')}
          {renderStatChip('Pending', pendingCount, '#2196F3')}
          {renderStatChip('On Hold', onHoldCount, '#FF9800')}
          {renderStatChip('Failed', failedCount, '#E53E3E')}
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <Text strong style={{ fontSize: 14, color: '#4CAF50' }}>
            Total Paid: RM {totalPaid.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {payments.length} total payments
            </Text>
          </div>
        </div>
      </div>
    );
  };

  const renderDetailItem = (label, value) => (
    <div style={{ marginBottom: 8 }}>
      <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
        {label}
      </Text>
      <div>
        <Text strong style={{ fontSize: 14 }}>
          {value}
        </Text>
      </div>
    </div>
  );

  const buildPaymentsList = () => {
    if (filteredPayments.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <p style={{ fontSize: 18, fontWeight: 600, color: '#6C757D' }}>No payments found</p>
              <p style={{ fontSize: 14, color: '#6C757D' }}>Try adjusting your search or filter criteria</p>
            </div>
          }
        />
      );
    }

    return (
      <div>
        {filteredPayments.map(payment => renderPaymentCard(payment))}
      </div>
    );
  };

  const renderPaymentCard = (payment) => {
    const statusColor = getStatusColor(payment.paymentStatus);
    
    return (
      <Card 
        key={payment.paymentReference}
        style={{ 
          marginBottom: 16, 
          borderRadius: 12,
          borderColor: `${statusColor}40`,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}
        bodyStyle={{ padding: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Tag 
            icon={getStatusIcon(payment.paymentStatus)} 
            color={statusColor}
            style={{ 
              textTransform: 'uppercase', 
              fontWeight: 'bold',
              fontSize: 10,
              padding: '4px 8px',
              borderRadius: 12
            }}
          >
            {payment.paymentStatus}
          </Tag>
          <Text strong style={{ fontSize: 18, marginLeft: 12 }}>
            {payment.claimId}
          </Text>
          <div style={{ marginLeft: 'auto' }}>
            <Text strong style={{ fontSize: 20, color: '#4CAF50' }}>
              RM {payment.payoutAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </div>
        </div>
        
        <div style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              {renderDetailItem('Bank Account', `${payment.bankName}\n${payment.maskedAccountNumber}`)}
            </Col>
            <Col span={8}>
              {renderDetailItem('Payment Reference', payment.paymentReference)}
            </Col>
            <Col span={8}>
              {renderDetailItem(
                payment.datePaid ? 'Date Paid' : 'Status',
                payment.datePaid 
                  ? payment.datePaid.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
                  : getStatusDescription(payment.paymentStatus)
              )}
            </Col>
          </Row>
        </div>
        
        {payment.failureReason && (
          <Alert
            message="Issue Details:"
            description={payment.failureReason}
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ 
              marginTop: 16,
              backgroundColor: '#FFEBEE', 
              border: '1px solid #FFCDD2'
            }}
          />
        )}
        
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          {payment.paymentStatus === 'Paid' && payment.receiptUrl && (
            <Button 
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => downloadReceipt(payment)}
              style={{ 
                backgroundColor: '#4CAF50', 
                borderColor: '#4CAF50',
                marginRight: 8
              }}
            >
              Download Receipt
            </Button>
          )}
          
          {(payment.paymentStatus === 'Failed' || payment.paymentStatus === 'On Hold') && (
            <Button 
              icon={<WarningOutlined />}
              onClick={() => reportIssue(payment)}
              style={{ 
                color: '#FF9800', 
                borderColor: '#FF9800',
                marginRight: 8
              }}
            >
              Report Issue
            </Button>
          )}
          
          {payment.paymentStatus === 'Failed' && (
            <Button 
              type="primary"
              icon={<EditOutlined />}
              onClick={() => updateBankDetails(payment)}
              style={{ 
                backgroundColor: '#2196F3', 
                borderColor: '#2196F3',
                marginRight: 8
              }}
            >
              Update Bank Details
            </Button>
          )}
          
          {payment.paymentStatus === 'Pending' && (
            <Button 
              icon={<EyeOutlined />}
              onClick={() => viewPaymentDetails(payment)}
              style={{ 
                color: '#6C757D', 
                borderColor: '#E9ECEF'
              }}
            >
              View Details
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      {buildHeader()}
      <div style={{ marginTop: 24 }}>
        {buildFiltersAndSearch()}
      </div>
      {buildStatsRow()}
      {buildPaymentsList()}
    </div>
  );
}

export default MyClaimPaymentsScreen;

