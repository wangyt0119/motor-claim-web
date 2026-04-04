import React, { useState } from 'react';
import { 
  Card, Typography, Space, Row, Col, Tag, Button, 
  Progress, Divider, Modal, Alert, Steps, Timeline,
  Badge, Tooltip, message, Descriptions
} from 'antd';
import {
  InfoCircleOutlined, CarOutlined, CalendarOutlined,
  FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined,
  CloseCircleOutlined, UploadOutlined, EyeOutlined,
  LightbulbOutlined, CustomerServiceOutlined, FileSearchOutlined,
  BulbOutlined, WarningOutlined, PlusOutlined, CloseOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { Step } = Steps;

const TrackClaimScreen = ({ claims = [] }) => {
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  
  // Rename claims to activeClaims for consistency with the component
  const activeClaims = claims;

  const showClaimDetails = (claim) => {
    setSelectedClaim(claim);
    setDetailsModalVisible(true);
  };

  const showUploadDialog = (claim) => {
    setSelectedClaim(claim);
    setUploadModalVisible(true);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'submitted': return '#2196F3';
      case 'under review': return '#FF9800';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'pending customer action': return '#9C27B0';
      case 'flagged for review': return '#FF5722';
      case 'escalated to supervisor': return '#795548';
      default: return '#607D8B';
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus?.toLowerCase()) {
      case 'paid': return '#4CAF50';
      case 'onhold': return '#FF9800';
      case 'failed': return '#F44336';
      default: return '#2196F3';
    }
  };

  const getPaymentStatusText = (paymentStatus) => {
    switch (paymentStatus?.toLowerCase()) {
      case 'paid': return 'Payment Completed';
      case 'onhold': return 'Payment On Hold';
      case 'failed': return 'Payment Failed';
      default: return 'Payment Pending';
    }
  };

  const getProgressValue = (claim) => {
    switch (claim.status.toLowerCase()) {
      case 'submitted':
        return 0.25;
      case 'under review':
        return 0.5;
      case 'flagged for review':
        return 0.6;
      case 'pending customer action':
        return 0.7;
      case 'escalated to supervisor':
        return 0.75;
      case 'approved':
        return 1.0;
      case 'rejected':
        return 1.0;
      default:
        return 0.0;
    }
  };

  const getProgressPercentage = (claim) => {
    switch (claim.status.toLowerCase()) {
      case 'submitted':
        return '25%';
      case 'under review':
        return '50%';
      case 'flagged for review':
        return '60%';
      case 'pending customer action':
        return '70%';
      case 'escalated to supervisor':
        return '75%';
      case 'approved':
        return '100%';
      case 'rejected':
        return '100%';
      default:
        return '0%';
    }
  };

  const getDaysAgo = (date) => {
    const difference = moment().diff(moment(date), 'days');
    if (difference === 0) {
      return 'Today';
    } else if (difference === 1) {
      return 'Yesterday';
    } else {
      return `${difference} days ago`;
    }
  };

  const getApprovedClaimMessage = (claim) => {
    switch (claim.paymentStatus?.toLowerCase()) {
      case 'paid':
        return 'Payment completed successfully. Funds have been transferred to your account.';
      case 'onhold':
        return 'Payment is temporarily on hold. Our finance team is processing your payment.';
      case 'failed':
        return 'Payment failed. Please contact support to update your banking details.';
      default:
        return 'Your claim has been approved. Payment will be processed within 3-5 business days.';
    }
  };

  const getNextAction = (claim) => {
    switch (claim.status.toLowerCase()) {
      case 'submitted':
        return 'Waiting for claim assessment. Estimated review in 2-3 business days.';
      case 'under review':
        return 'Your claim is being evaluated. An adjuster may contact you soon.';
      case 'flagged for review':
        return 'Your claim requires manual review by an officer. This may take 3-5 business days.';
      case 'pending customer action':
        return 'ACTION REQUIRED: Please upload the requested documents to proceed.';
      case 'escalated to supervisor':
        return 'Your claim has been escalated to a senior officer for specialized review.';
      case 'approved':
        return getApprovedClaimMessage(claim);
      case 'rejected':
        return 'Your claim was rejected. Contact support for more information.';
      default:
        return 'No action required at this time.';
    }
  };

  const isReviewStepActive = (status) => {
    return [
      'under review',
      'flagged for review',
      'pending customer action',
      'escalated to supervisor'
    ].includes(status.toLowerCase());
  };

  const buildEmptyState = () => (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ 
        padding: 24, 
        backgroundColor: '#f5f5f5', 
        borderRadius: '50%', 
        display: 'inline-flex',
        marginBottom: 24
      }}>
        <CheckCircleOutlined style={{ fontSize: 48, color: '#bdbdbd' }} />
      </div>
      <Title level={3} style={{ marginBottom: 8, color: '#616161' }}>
        No active claims
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        You have no active claims in the last 30 days
      </Text>
      <Button 
        type="primary" 
        icon={<PlusOutlined />} 
        size="large"
        style={{ 
          backgroundColor: '#FF6600', 
          borderColor: '#FF6600',
          padding: '0 24px',
          height: 40
        }}
      >
        Submit New Claim
      </Button>
    </div>
  );

  const renderUploadDocumentsModal = () => {
    if (!selectedClaim) return null;
    
    return (
      <Modal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        title={
          <Space>
            <UploadOutlined style={{ color: '#9C27B0' }} />
            <span>Upload Required Documents</span>
          </Space>
        }
        footer={[
          <Button key="cancel" onClick={() => setUploadModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            icon={<UploadOutlined />}
            onClick={() => {
              setUploadModalVisible(false);
              message.success('Document upload feature will be available soon');
            }}
            style={{ backgroundColor: '#9C27B0', borderColor: '#9C27B0' }}
          >
            Upload Documents
          </Button>,
        ]}
      >
        <div>
          <Text strong>
            Your claim {selectedClaim.id} requires additional documentation:
          </Text>
          
          <div style={{ 
            margin: '16px 0', 
            padding: 12,
            backgroundColor: '#FFF3E0',
            borderRadius: 8,
            border: '1px solid #FFE0B2'
          }}>
            <Text strong style={{ color: '#E65100', display: 'block', marginBottom: 8 }}>
              Required Documents:
            </Text>
            
            {selectedClaim.notes?.map((note, index) => (
              <div key={index} style={{ display: 'flex', marginBottom: 4 }}>
                <span style={{ color: '#E65100', marginRight: 4 }}>•</span>
                <Text style={{ color: '#795548' }}>
                  {note}
                </Text>
              </div>
            ))}
            
            {/* If notes are not available, show default required documents */}
            {(!selectedClaim.notes || selectedClaim.notes.length === 0) && (
              <>
                <div style={{ display: 'flex', marginBottom: 4 }}>
                  <span style={{ color: '#E65100', marginRight: 4 }}>•</span>
                  <Text style={{ color: '#795548' }}>
                    Police report or accident statement
                  </Text>
                </div>
                <div style={{ display: 'flex', marginBottom: 4 }}>
                  <span style={{ color: '#E65100', marginRight: 4 }}>•</span>
                  <Text style={{ color: '#795548' }}>
                    Photos of vehicle damage (multiple angles)
                  </Text>
                </div>
                <div style={{ display: 'flex', marginBottom: 4 }}>
                  <span style={{ color: '#E65100', marginRight: 4 }}>•</span>
                  <Text style={{ color: '#795548' }}>
                    Repair cost estimate from authorized workshop
                  </Text>
                </div>
              </>
            )}
          </div>
          
          <Text type="secondary">
            Please upload the requested documents to continue processing your claim.
          </Text>
        </div>
      </Modal>
    );
  };

  const renderClaimDetailsModal = () => {
    if (!selectedClaim) return null;
    
    return (
      <Modal
        visible={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={null}
        width={700}
        className="claim-details-modal"
        closeIcon={<span />} // Hide the default close icon
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            backgroundColor: getStatusColor(selectedClaim.status),
            padding: '16px 24px',
            borderRadius: '8px 8px 0 0',
            marginLeft: -24,
            marginRight: -24,
            marginTop: -24,
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Title level={4} style={{ color: 'white', margin: 0 }}>
              Claim Details: {selectedClaim.id}
            </Title>
            <Button 
              icon={<CloseOutlined />} 
              type="text" 
              style={{ color: 'white' }} 
              onClick={() => setDetailsModalVisible(false)}
            />
          </div>
          
          <Row gutter={[24, 24]}>
            <Col span={12}>
              <Card size="small" title="Claim Information" bordered={false}>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Claim ID">{selectedClaim.id}</Descriptions.Item>
                  <Descriptions.Item label="Type">{selectedClaim.type}</Descriptions.Item>
                  <Descriptions.Item label="Date">
                    {moment(selectedClaim.date).format('DD MMM YYYY')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(selectedClaim.status)}>
                      {selectedClaim.status}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Amount">
                    RM {selectedClaim.claimAmount?.toLocaleString() || 'N/A'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            
            <Col span={12}>
              <Card size="small" title="Claim Progress" bordered={false}>
                <Steps 
                  direction="vertical" 
                  current={
                    selectedClaim.status.toLowerCase() === 'rejected' ? 3 : 
                    selectedClaim.status.toLowerCase() === 'approved' ? 3 :
                    isReviewStepActive(selectedClaim.status) ? 1 :
                    selectedClaim.status.toLowerCase() === 'submitted' ? 0 : 0
                  }
                  status={
                    selectedClaim.status.toLowerCase() === 'rejected' ? 'error' : 
                    'process'
                  }
                  size="small"
                >
                  <Step 
                    title="Claim Submitted" 
                    description={
                      <Text type="secondary">
                        {moment(selectedClaim.date).format('DD MMM YYYY')}
                      </Text>
                    } 
                  />
                  <Step 
                    title="Under Review" 
                    description={
                      isReviewStepActive(selectedClaim.status) ? (
                        <Text type="secondary">
                          {selectedClaim.status}
                        </Text>
                      ) : null
                    } 
                  />
                  <Step 
                    title="Decision" 
                    description={
                      selectedClaim.status.toLowerCase() === 'approved' ? (
                        <Text type="success">Approved</Text>
                      ) : selectedClaim.status.toLowerCase() === 'rejected' ? (
                        <Text type="danger">Rejected</Text>
                      ) : null
                    } 
                  />
                  <Step 
                    title="Payment" 
                    description={
                      selectedClaim.status.toLowerCase() === 'approved' && selectedClaim.paymentStatus ? (
                        <Text style={{ color: getPaymentStatusColor(selectedClaim.paymentStatus) }}>
                          {getPaymentStatusText(selectedClaim.paymentStatus)}
                        </Text>
                      ) : null
                    } 
                  />
                </Steps>
              </Card>
            </Col>
          </Row>
          
          <Card 
            size="small" 
            title="Next Steps" 
            bordered={false} 
            style={{ marginTop: 24 }}
          >
            <Alert
              message={getNextAction(selectedClaim)}
              type={
                selectedClaim.status.toLowerCase() === 'pending customer action' ? 'warning' :
                selectedClaim.status.toLowerCase() === 'rejected' ? 'error' :
                selectedClaim.status.toLowerCase() === 'approved' ? 'success' : 'info'
              }
              showIcon
            />
            
            {selectedClaim.status.toLowerCase() === 'pending customer action' && (
              <Button 
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => {
                  setDetailsModalVisible(false);
                  setUploadModalVisible(true);
                }}
                style={{ 
                  marginTop: 16,
                  backgroundColor: '#9C27B0',
                  borderColor: '#9C27B0'
                }}
              >
                Upload Required Documents
              </Button>
            )}
          </Card>
          
          {selectedClaim.notes && selectedClaim.notes.length > 0 && (
            <Card 
              size="small" 
              title="Notes" 
              bordered={false} 
              style={{ marginTop: 24 }}
            >
              <Timeline>
                {selectedClaim.notes.map((note, index) => (
                  <Timeline.Item key={index}>
                    <Text>{note}</Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          )}
        </div>
      </Modal>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header with icon */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ 
          padding: 16, 
          backgroundColor: '#FFF3E0', 
          borderRadius: 50, 
          display: 'inline-flex',
          marginBottom: 16
        }}>
          <CarOutlined style={{ fontSize: 40, color: '#FF6600' }} />
        </div>
        <Title level={2} style={{ marginBottom: 8 }}>Active Claims Tracker</Title>
        <Text type="secondary">
          Monitor your ongoing insurance claims in real-time
        </Text>
      </div>
      
      {/* Active claims info card */}
      <Alert
        message={
          <Text strong style={{ color: '#E65100' }}>Active Claims Only</Text>
        }
        description="This tracker shows claims that are less than 30 days old and still in progress. For older or completed claims, please visit Claim History."
        type="warning"
        showIcon
        style={{ 
          marginBottom: 24, 
          borderRadius: 12,
          backgroundColor: '#FFF3E0',
          borderColor: '#FFE0B2'
        }}
      />
      
      {/* Claims list */}
      {activeClaims.length === 0 ? (
        buildEmptyState()
      ) : (
        activeClaims.map(claim => (
          <Card
            key={claim.id}
            style={{ 
              marginBottom: 16, 
              borderRadius: 12,
              cursor: 'pointer'
            }}
            bodyStyle={{ padding: 16 }}
            onClick={() => showClaimDetails(claim)}
            hoverable
          >
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <div style={{
                    padding: 8,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 8
                  }}>
                    <CarOutlined style={{ color: '#FF6600', fontSize: 20 }} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>Claim ID: {claim.id}</Text>
                    <div>
                      <Text type="secondary">{claim.type}</Text>
                    </div>
                  </div>
                </Space>
              </Col>
              <Col>
                <Tag color={getStatusColor(claim.status)} style={{ 
                  borderRadius: 16, 
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 'bold'
                }}>
                  {claim.status}
                </Tag>
              </Col>
            </Row>
            
            {/* Progress bar */}
            <div style={{ margin: '16px 0' }}>
              <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
                <Col>
                  <Text type="secondary" style={{ fontSize: 12 }}>Claim Progress</Text>
                </Col>
                <Col>
                  <Text strong style={{ 
                    fontSize: 12, 
                    color: getStatusColor(claim.status) 
                  }}>
                    {getProgressPercentage(claim)}
                  </Text>
                </Col>
              </Row>
              <Progress 
                percent={getProgressValue(claim) * 100} 
                showInfo={false}
                strokeColor={getStatusColor(claim.status)}
                size="small"
                strokeWidth={6}
              />
            </div>
            
            {/* Payment Status (for approved claims) */}
            {claim.status.toLowerCase() === 'approved' && claim.paymentStatus && (
              <div style={{ 
                padding: 12, 
                backgroundColor: `${getPaymentStatusColor(claim.paymentStatus)}10`,
                border: `1px solid ${getPaymentStatusColor(claim.paymentStatus)}30`,
                borderRadius: 8,
                marginBottom: 16
              }}>
                <Row align="middle">
                  {claim.paymentStatus?.toLowerCase() === 'paid' ? (
                    <CheckCircleOutlined style={{ 
                      fontSize: 16, 
                      color: getPaymentStatusColor(claim.paymentStatus) 
                    }} />
                  ) : claim.paymentStatus?.toLowerCase() === 'failed' ? (
                    <CloseCircleOutlined style={{ 
                      fontSize: 16, 
                      color: getPaymentStatusColor(claim.paymentStatus) 
                    }} />
                  ) : (
                    <ClockCircleOutlined style={{ 
                      fontSize: 16, 
                      color: getPaymentStatusColor(claim.paymentStatus) 
                    }} />
                  )}
                  <div style={{ marginLeft: 8, flex: 1 }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 11, fontWeight: 500 }}>
                        Payment Status
                      </Text>
                    </div>
                    <div>
                      <Text strong style={{ 
                        fontSize: 12, 
                        color: getPaymentStatusColor(claim.paymentStatus) 
                      }}>
                        {getPaymentStatusText(claim.paymentStatus)}
                      </Text>
                    </div>
                  </div>
                  {claim.paymentStatus?.toLowerCase() === 'paid' && claim.paymentDate && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {moment(claim.paymentDate).format('DD MMM')}
                    </Text>
                  )}
                </Row>
              </div>
            )}
            
            <Divider style={{ margin: '8px 0 16px' }} />
            
            <Row gutter={16}>
              <Col span={12}>
                <Space>
                  <CalendarOutlined style={{ color: '#6c757d', fontSize: 16 }} />
                  <Text type="secondary">
                    {moment(claim.date).format('DD MMM YYYY')}
                  </Text>
                </Space>
              </Col>
              <Col span={12}>
                <Space>
                  <ClockCircleOutlined style={{ color: '#6c757d', fontSize: 16 }} />
                  <Text type="secondary">
                    {getDaysAgo(claim.date)}
                  </Text>
                </Space>
              </Col>
            </Row>
            
            {/* Next action */}
            <div style={{ 
              padding: 12, 
              backgroundColor: '#f9f9f9', 
              borderRadius: 8,
              border: '1px solid #eee',
              marginTop: 16
            }}>
              <Space align="start">
                <BulbOutlined style={{ color: '#FF9800', fontSize: 16 }} />
                <Text style={{ fontSize: 12, color: '#333' }}>
                  {getNextAction(claim)}
                </Text>
              </Space>
            </div>
            
            {/* Action buttons */}
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              {claim.status.toLowerCase() === 'pending customer action' && (
                <Button 
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    showUploadDialog(claim);
                  }}
                  style={{ 
                    marginRight: 8,
                    backgroundColor: '#9C27B0',
                    borderColor: '#9C27B0'
                  }}
                  size="small"
                >
                  Upload Documents
                </Button>
              )}
              <Button 
                icon={<EyeOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  showClaimDetails(claim);
                }}
                type="link"
                style={{ color: '#FF6600' }}
                size="small"
              >
                Track Details
              </Button>
            </div>
          </Card>
        ))
      )}
      
      {/* Render modals */}
      {renderClaimDetailsModal()}
      {renderUploadDocumentsModal()}
    </div>
  );
};

export default TrackClaimScreen;






















