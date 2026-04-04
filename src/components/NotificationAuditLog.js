import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Input, Button, Space, Typography, Tag, 
  Select, DatePicker, Badge, Table, Modal, Descriptions
} from 'antd';
import { 
  SearchOutlined, DownloadOutlined, FilterOutlined, 
  CheckCircleOutlined, CloseCircleOutlined, SyncOutlined,
  ClockCircleOutlined, EyeOutlined
} from '@ant-design/icons';
import moment from 'moment';
import NotificationAuditEntry from '../models/NotificationAuditEntry';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

function NotificationAuditLog() {
  // State for filters
  const [searchText, setSearchText] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState([
    moment().subtract(30, 'days'),
    moment()
  ]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Sample audit log data
  const [auditLogs, setAuditLogs] = useState([
    new NotificationAuditEntry({
      id: 'AUDIT001',
      claimId: 'CLM002',
      customerName: 'Ahmad bin Abdullah',
      contactMethod: 'Email',
      statusUpdate: 'Approved',
      dateSent: moment().subtract(2, 'hours'),
      deliveryStatus: 'Sent',
      recipientContact: 'ahmad.abdullah@email.com',
      messageTemplate: 'Claim Approval Notification',
      messageContent: 'Your claim CLM002 has been approved. Payment of RM 1,200.00 will be processed within 3-5 business days.',
      errorMessage: null,
      retryCount: 0,
      officerName: 'Sarah Johnson',
      metadata: {
        'messageId': 'MSG-ETQ-240001',
        'provider': 'SendGrid',
        'templateId': 'TMPL-APPROVAL-001',
        'priority': 'High',
        'category': 'Claim Status Update',
      },
    }),
    new NotificationAuditEntry({
      id: 'AUDIT007',
      claimId: 'CLM005',
      customerName: 'Kumar Selvam',
      contactMethod: 'SMS',
      statusUpdate: 'Under Review',
      dateSent: moment().subtract(8, 'days'),
      deliveryStatus: 'Failed',
      recipientContact: '+60198765432',
      messageTemplate: 'Status Update SMS',
      messageContent: 'Etiqa: Your claim CLM005 is under review. We will update you within 2-3 business days.',
      errorMessage: 'Network error - message delivery failed',
      retryCount: 2,
      officerName: 'Alex Tan',
      metadata: {
        'messageId': 'SMS-ETQ-240007',
        'provider': 'Twilio',
        'cost': 'RM 0.15',
        'priority': 'Medium',
        'category': 'Status Update',
      },
    }),
  ]);

  const [filteredLogs, setFilteredLogs] = useState([]);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    applyFilters();
  }, [searchText, selectedDateRange, selectedStatus, selectedMethod, auditLogs]);

  const applyFilters = () => {
    let filtered = [...auditLogs];
    
    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(log => 
        log.claimId.toLowerCase().includes(searchLower) ||
        log.customerName.toLowerCase().includes(searchLower) ||
        log.recipientContact.toLowerCase().includes(searchLower) ||
        log.messageContent.toLowerCase().includes(searchLower) ||
        log.id.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply date range filter
    if (selectedDateRange && selectedDateRange.length === 2) {
      const [startDate, endDate] = selectedDateRange;
      filtered = filtered.filter(log => 
        moment(log.dateSent).isSameOrAfter(startDate, 'day') && 
        moment(log.dateSent).isSameOrBefore(endDate, 'day')
      );
    }
    
    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(log => 
        log.deliveryStatus.toLowerCase() === selectedStatus.toLowerCase()
      );
    }
    
    // Apply contact method filter
    if (selectedMethod !== 'all') {
      filtered = filtered.filter(log => 
        log.contactMethod.toLowerCase() === selectedMethod.toLowerCase()
      );
    }
    
    setFilteredLogs(filtered);
  };

  const exportToCSV = () => {
    // Implementation for exporting to CSV
    console.log('Exporting to CSV...');
  };

  const showDetailModal = (entry) => {
    setSelectedEntry(entry);
    setDetailModalVisible(true);
  };

  const getStatusTag = (status) => {
    switch (status.toLowerCase()) {
      case 'sent':
        return <Tag icon={<CheckCircleOutlined />} color="success">Sent</Tag>;
      case 'delivered':
        return <Tag icon={<CheckCircleOutlined />} color="success">Delivered</Tag>;
      case 'failed':
        return <Tag icon={<CloseCircleOutlined />} color="error">Failed</Tag>;
      case 'retried':
        return <Tag icon={<SyncOutlined spin />} color="warning">Retried</Tag>;
      case 'pending':
        return <Tag icon={<ClockCircleOutlined />} color="processing">Pending</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const getMethodTag = (method) => {
    switch (method.toLowerCase()) {
      case 'email':
        return <Tag color="blue">Email</Tag>;
      case 'sms':
        return <Tag color="purple">SMS</Tag>;
      case 'push':
        return <Tag color="cyan">Push</Tag>;
      default:
        return <Tag>{method}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Audit ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: 'Claim ID',
      dataIndex: 'claimId',
      key: 'claimId',
      width: 100,
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 180,
    },
    {
      title: 'Method',
      dataIndex: 'contactMethod',
      key: 'contactMethod',
      width: 100,
      render: (method) => getMethodTag(method),
    },
    {
      title: 'Status Update',
      dataIndex: 'statusUpdate',
      key: 'statusUpdate',
      width: 140,
    },
    {
      title: 'Date Sent',
      dataIndex: 'dateSent',
      key: 'dateSent',
      width: 150,
      render: (date) => moment(date).format('DD MMM YYYY, HH:mm'),
    },
    {
      title: 'Delivery Status',
      dataIndex: 'deliveryStatus',
      key: 'deliveryStatus',
      width: 150,
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Recipient',
      dataIndex: 'recipientContact',
      key: 'recipientContact',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button 
          type="text" 
          icon={<EyeOutlined />} 
          onClick={() => showDetailModal(record)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>Notification Audit Log</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Monitor customer notification delivery status and history
          </Text>
        </Col>
        <Col>
          <Space>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              onClick={exportToCSV}
              style={{ backgroundColor: '#4CAF50', borderColor: '#4CAF50' }}
            >
              Export CSV
            </Button>
            <Tag 
              color="#2196F3"
              style={{ 
                padding: '8px 16px', 
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8
              }}
            >
              {auditLogs.length} Entries
            </Tag>
          </Space>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Row gutter={24}>
          <Col span={8}>
            <Text strong>Delivery Status</Text>
            <div style={{ marginTop: 8 }}>
              <Select 
                style={{ width: '100%' }} 
                value={selectedStatus}
                onChange={value => setSelectedStatus(value)}
              >
                <Option value="all">All Statuses</Option>
                <Option value="sent">Sent</Option>
                <Option value="delivered">Delivered</Option>
                <Option value="failed">Failed</Option>
                <Option value="retried">Retried</Option>
              </Select>
            </div>
          </Col>
          <Col span={8}>
            <Text strong>Contact Method</Text>
            <div style={{ marginTop: 8 }}>
              <Select 
                style={{ width: '100%' }} 
                value={selectedMethod}
                onChange={value => setSelectedMethod(value)}
              >
                <Option value="all">All Methods</Option>
                <Option value="email">Email</Option>
                <Option value="sms">SMS</Option>
                <Option value="push">Push Notification</Option>
              </Select>
            </div>
          </Col>
          <Col span={8}>
            <Text strong>Status Update</Text>
            <div style={{ marginTop: 8 }}>
              <Select defaultValue="all" style={{ width: '100%' }}>
                <Option value="all">All Updates</Option>
                <Option value="approved">Approved</Option>
                <Option value="rejected">Rejected</Option>
                <Option value="under review">Under Review</Option>
                <Option value="payment processed">Payment Processed</Option>
              </Select>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Search and Date Filter */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Input 
            placeholder="Search by claim ID, customer name, or contact..." 
            prefix={<SearchOutlined />} 
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ borderRadius: 8 }}
            allowClear
          />
        </Col>
        <Col span={8}>
          <RangePicker 
            style={{ width: '100%', borderRadius: 8 }}
            value={selectedDateRange}
            onChange={dates => setSelectedDateRange(dates)}
            ranges={{
              'Today': [moment(), moment()],
              'This Week': [moment().startOf('week'), moment()],
              'This Month': [moment().startOf('month'), moment()],
              'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            }}
          />
        </Col>
      </Row>

      {/* Stats Row */}
      <Row align="middle" style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Space size={12}>
            {renderStatChip('Successful', 
              filteredLogs.filter(log => 
                log.deliveryStatus === 'Sent' || log.deliveryStatus === 'Delivered'
              ).length, 
              '#4CAF50'
            )}
            {renderStatChip('Failed', 
              filteredLogs.filter(log => log.deliveryStatus === 'Failed').length, 
              '#E53E3E'
            )}
            {renderStatChip('Retried', 
              filteredLogs.filter(log => log.deliveryStatus === 'Retried').length, 
              '#FF9800'
            )}
            {renderStatChip('Email', 
              filteredLogs.filter(log => log.contactMethod === 'Email').length, 
              '#2196F3'
            )}
            {renderStatChip('SMS', 
              filteredLogs.filter(log => log.contactMethod === 'SMS').length, 
              '#9C27B0'
            )}
          </Space>
        </Col>
        <Col>
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
            Total: {filteredLogs.length} notifications
          </Text>
        </Col>
      </Row>

      {/* Table */}
      <Card style={{ borderRadius: 12 }}>
        <Table 
          columns={columns} 
          dataSource={filteredLogs}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <div>
            <Text strong style={{ fontSize: 18 }}>Notification Details</Text>
            <div style={{ marginTop: 8 }}>
              {selectedEntry && (
                <>
                  {getStatusTag(selectedEntry.deliveryStatus)}
                  {getMethodTag(selectedEntry.contactMethod)}
                  <Tag color="orange">{selectedEntry.statusUpdate}</Tag>
                </>
              )}
            </div>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedEntry && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Audit ID">{selectedEntry.id}</Descriptions.Item>
            <Descriptions.Item label="Claim ID">{selectedEntry.claimId}</Descriptions.Item>
            <Descriptions.Item label="Customer Name">{selectedEntry.customerName}</Descriptions.Item>
            <Descriptions.Item label="Recipient">{selectedEntry.recipientContact}</Descriptions.Item>
            <Descriptions.Item label="Date Sent">
              {moment(selectedEntry.dateSent).format('DD MMM YYYY, HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="Message Template">{selectedEntry.messageTemplate}</Descriptions.Item>
            <Descriptions.Item label="Message Content">
              <div style={{ whiteSpace: 'pre-wrap' }}>{selectedEntry.messageContent}</div>
            </Descriptions.Item>
            {selectedEntry.errorMessage && (
              <Descriptions.Item label="Error Message" contentStyle={{ color: '#E53E3E' }}>
                {selectedEntry.errorMessage}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Retry Count">{selectedEntry.retryCount}</Descriptions.Item>
            <Descriptions.Item label="Officer Name">{selectedEntry.officerName}</Descriptions.Item>
            <Descriptions.Item label="Metadata">
              <pre style={{ maxHeight: 200, overflow: 'auto' }}>
                {JSON.stringify(selectedEntry.metadata, null, 2)}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

// Helper function for rendering stat chips
function renderStatChip(label, count, color) {
  return (
    <div style={{ 
      backgroundColor: `${color}10`, 
      borderRadius: 16,
      padding: '6px 12px',
      display: 'inline-flex',
      alignItems: 'center'
    }}>
      <Badge color={color} />
      <Text style={{ marginLeft: 8, color, fontWeight: 600 }}>
        {label}: {count}
      </Text>
    </div>
  );
}

export default NotificationAuditLog;

