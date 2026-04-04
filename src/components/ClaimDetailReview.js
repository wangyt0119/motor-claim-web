import React, { useState } from 'react';
import { 
  Card, Typography, Descriptions, Tag, Button, Table, Timeline, 
  Divider, Space, Modal, Tabs, Upload, message, Row, Col, Alert
} from 'antd';
import { 
  WarningOutlined, 
  FileUnknownOutlined, 
  FilePdfOutlined, 
  FileImageOutlined, 
  FileExcelOutlined, 
  FileWordOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FlagOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

function ClaimDetailReview({ flaggedClaim }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('1');
  
  // If flaggedClaim is not passed as a prop, try to get it from location state
  // This is useful when navigating from another component
  const location = useLocation();
  if (!flaggedClaim && location.state?.flaggedClaim) {
    flaggedClaim = location.state.flaggedClaim;
  }
  
  // If we still don't have a flaggedClaim, use a sample one
  if (!flaggedClaim) {
    flaggedClaim = {
      claimData: {
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
      },
      flagReason: 'High Claim Amount',
      flagDetails: 'Claim amount exceeds RM15,000 threshold',
      priority: 'High',
      flaggedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      assignedOfficer: 'Sarah Johnson',
      documents: [
        { name: 'Accident Report.pdf', type: 'pdf', size: '2.4 MB', uploadDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { name: 'Vehicle Damage Photos.zip', type: 'zip', size: '15.8 MB', uploadDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { name: 'Repair Estimate.xlsx', type: 'excel', size: '1.2 MB', uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      ],
      history: [
        { type: 'submission', action: 'Claim Submitted', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), time: '10:23 AM', comment: 'Initial claim submission' },
        { type: 'update', action: 'Documents Uploaded', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), time: '11:45 AM', comment: 'Uploaded accident report and damage photos' },
        { type: 'flag', action: 'Flagged for Review', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), time: '09:15 AM', comment: 'Claim amount exceeds threshold' },
        { type: 'update', action: 'Additional Document Uploaded', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), time: '02:30 PM', comment: 'Uploaded repair estimate' },
      ]
    };
  }

  const getDocumentIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FilePdfOutlined style={{ fontSize: 24, color: '#FF5733' }} />;
      case 'image':
      case 'jpg':
      case 'png':
      case 'jpeg':
        return <FileImageOutlined style={{ fontSize: 24, color: '#4CAF50' }} />;
      case 'excel':
      case 'xlsx':
      case 'xls':
        return <FileExcelOutlined style={{ fontSize: 24, color: '#217346' }} />;
      case 'word':
      case 'doc':
      case 'docx':
        return <FileWordOutlined style={{ fontSize: 24, color: '#2B579A' }} />;
      default:
        return <FileUnknownOutlined style={{ fontSize: 24, color: '#6C757D' }} />;
    }
  };

  const documentColumns = [
    {
      title: 'Document',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {getDocumentIcon(record.type)}
          <Button type="link" onClick={() => viewDocument(record)}>{text}</Button>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text) => text.toUpperCase(),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: 'Upload Date',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
      render: (date) => date.toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => viewDocument(record)}>View</Button>
          <Button size="small" type="primary" ghost>Download</Button>
        </Space>
      ),
    },
  ];

  const viewDocument = (document) => {
    Modal.info({
      title: document.name,
      content: (
        <div style={{ textAlign: 'center' }}>
          {getDocumentIcon(document.type)}
          <div style={{ fontSize: 64, margin: '20px 0' }}>
            <FileUnknownOutlined />
          </div>
          <p>Document preview would be shown here</p>
          <p style={{ color: '#6C757D' }}>Size: {document.size}</p>
        </div>
      ),
      width: 500,
      okText: 'Close',
      cancelText: 'Download',
      onCancel: () => {
        // Implement download functionality
      },
    });
  };

  const handleApprove = () => {
    Modal.confirm({
      title: 'Approve Claim',
      content: 'Are you sure you want to approve this claim?',
      okText: 'Approve',
      okButtonProps: { style: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' } },
      cancelText: 'Cancel',
      onOk: () => {
        message.success('Claim approved successfully');
        navigate(-1);
      },
    });
  };

  const handleReject = () => {
    Modal.confirm({
      title: 'Reject Claim',
      content: 'Are you sure you want to reject this claim?',
      okText: 'Reject',
      okButtonProps: { style: { backgroundColor: '#E53E3E', borderColor: '#E53E3E' } },
      cancelText: 'Cancel',
      onOk: () => {
        message.error('Claim rejected');
        navigate(-1);
      },
    });
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3}>Claim Review #{flaggedClaim.claimData.id}</Title>
        <Tag color="red" icon={<WarningOutlined />} style={{ fontSize: '16px' }}>
          Flagged for Review
        </Tag>
      </div>

      <Descriptions title="Claim Information" bordered>
        <Descriptions.Item label="Policy Number">{flaggedClaim.claimData.policyNumber}</Descriptions.Item>
        <Descriptions.Item label="Claim Type">{flaggedClaim.claimData.type}</Descriptions.Item>
        <Descriptions.Item label="Date">{flaggedClaim.claimData.date.toLocaleDateString()}</Descriptions.Item>
        <Descriptions.Item label="Vehicle">{flaggedClaim.claimData.vehicleModel}</Descriptions.Item>
        <Descriptions.Item label="Registration">{flaggedClaim.claimData.vehicleRegistration}</Descriptions.Item>
        <Descriptions.Item label="Amount">RM {flaggedClaim.claimData.claimAmount.toFixed(2)}</Descriptions.Item>
        <Descriptions.Item label="Location" span={3}>{flaggedClaim.claimData.location}</Descriptions.Item>
      </Descriptions>

      <Card 
        title={<Text strong><WarningOutlined style={{ color: 'red' }} /> Flag Information</Text>}
        style={{ marginBottom: 24, marginTop: 24 }}
      >
        <Descriptions bordered>
          <Descriptions.Item label="Flag Reason">{flaggedClaim.flagReason}</Descriptions.Item>
          <Descriptions.Item label="Priority">
            <Tag color={flaggedClaim.priority === 'High' ? 'red' : flaggedClaim.priority === 'Medium' ? 'orange' : 'blue'}>
              {flaggedClaim.priority}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Flagged Date">{flaggedClaim.flaggedDate.toLocaleDateString()}</Descriptions.Item>
          <Descriptions.Item label="Flag Details" span={3}>{flaggedClaim.flagDetails}</Descriptions.Item>
          <Descriptions.Item label="Assigned Officer">{flaggedClaim.assignedOfficer}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs defaultActiveKey="1" onChange={setActiveTab} style={{ marginTop: 24 }}>
        <TabPane tab="Documents" key="1">
          <Table 
            dataSource={flaggedClaim.documents} 
            columns={documentColumns} 
            rowKey="name"
          />
        </TabPane>
        <TabPane tab="Claim History" key="2">
          <Timeline
            items={flaggedClaim.history.map(item => ({
              color: item.type === 'submission' ? 'blue' : 
                    item.type === 'update' ? 'green' : 
                    item.type === 'flag' ? 'red' : 'gray',
              children: (
                <>
                  <Text strong>{item.action}</Text>
                  <br />
                  <Text type="secondary">{item.date.toLocaleDateString()} - {item.time}</Text>
                  {item.comment && (
                    <>
                      <br />
                      <Text>{item.comment}</Text>
                    </>
                  )}
                </>
              )
            }))}
          />
        </TabPane>
        <TabPane tab="Notes" key="3">
          <Alert
            message="Claim Notes"
            description={
              <ul>
                {flaggedClaim.claimData.notes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            }
            type="info"
            showIcon
          />
        </TabPane>
      </Tabs>

      <Divider />

      <Row gutter={16}>
        <Col span={12}>
          <Button 
            block 
            size="large" 
            onClick={() => navigate(-1)}
          >
            Back to Queue
          </Button>
        </Col>
        <Col span={6}>
          <Button 
            block 
            size="large" 
            danger
            icon={<CloseCircleOutlined />}
            onClick={handleReject}
          >
            Reject
          </Button>
        </Col>
        <Col span={6}>
          <Button 
            block 
            type="primary" 
            size="large" 
            icon={<CheckCircleOutlined />}
            style={{ backgroundColor: '#4CAF50', borderColor: '#4CAF50' }}
            onClick={handleApprove}
          >
            Approve
          </Button>
        </Col>
      </Row>
    </Card>
  );
}

export default ClaimDetailReview;
