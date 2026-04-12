import React from 'react';
import { Alert, Button, Card, Descriptions, Empty, List, Space, Tag, Typography } from 'antd';
import { EyeOutlined, FileTextOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Text } = Typography;

function WorkshopRepairEstimateCard({ estimate, emptyDescription = 'No workshop repair estimate submitted yet.' }) {
  if (!estimate) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription} />;
  }

  return (
    <Card
      title={
        <Space>
          <SafetyCertificateOutlined />
          <span>Workshop Submission</span>
        </Space>
      }
      style={{ borderRadius: 12 }}
    >
      <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
        <Tag color={getEstimateStatusColor(estimate.status)}>{formatEstimateStatus(estimate.status)}</Tag>
        <Tag color={estimate.isStpApproved ? 'green' : 'orange'}>
          {estimate.isStpApproved ? 'STP Approved' : formatReviewMode(estimate.reviewMode)}
        </Tag>
        <Tag color="processing">RM {estimate.totalAmount.toFixed(2)}</Tag>
      </Space>

      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Workshop">{estimate.workshopName || 'Not available'}</Descriptions.Item>
        <Descriptions.Item label="Total amount">
          <Text strong>RM {estimate.totalAmount.toFixed(2)}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Submitted at">{formatDateTime(estimate.submittedAt)}</Descriptions.Item>
        <Descriptions.Item label="Reviewed at">{formatDateTime(estimate.reviewedAt)}</Descriptions.Item>
        <Descriptions.Item label="Review note">{estimate.reviewNote || 'No review note yet'}</Descriptions.Item>
        <Descriptions.Item label="Requested changes">
          {estimate.requestedItems?.length ? estimate.requestedItems.map((item) => item.label || item).join(', ') : 'No requested changes'}
        </Descriptions.Item>
        <Descriptions.Item label="Remarks">{estimate.remarks || 'No remarks'}</Descriptions.Item>
      </Descriptions>

      {estimate.receiptOrQuotationDocument ? (
        <List
          style={{ marginTop: 16 }}
          dataSource={[
            {
              key: 'receipt-or-quotation-document',
              label: 'Receipt / quotation document',
              url: estimate.receiptOrQuotationDocument,
              icon: <FileTextOutlined />,
            },
          ]}
          renderItem={(item) => (
            <List.Item actions={[<Button key="open" icon={<EyeOutlined />} onClick={() => openDocument(item.url)}>Open</Button>]}>
              <List.Item.Meta avatar={item.icon} title={item.label} description={<Text type="secondary" copyable>{item.url}</Text>} />
            </List.Item>
          )}
        />
      ) : null}

      {estimate.supportingDocuments?.length ? (
        <List
          style={{ marginTop: 16 }}
          dataSource={estimate.supportingDocuments}
          renderItem={(url, index) => (
            <List.Item actions={[<Button key="open" icon={<EyeOutlined />} onClick={() => openDocument(url)}>Open</Button>]}>
              <List.Item.Meta
                avatar={<FileTextOutlined />}
                title={`Supporting document ${index + 1}`}
                description={<Text type="secondary" copyable>{url}</Text>}
              />
            </List.Item>
          )}
        />
      ) : null}

      {estimate.totalAmount <= 2000 ? (
        <Alert
          style={{ marginTop: 16 }}
          type="success"
          showIcon
          message="STP threshold met"
          description="The submitted total is at or below RM 2000.00, so the backend marks it for STP approval."
        />
      ) : (
        <Alert
          style={{ marginTop: 16 }}
          type="warning"
          showIcon
          message="Manual review required"
          description="The submitted total is above RM 2000.00, so the backend routes it for officer review."
        />
      )}
    </Card>
  );
}

export function getEstimateStatusColor(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'stpapproved') return 'green';
  if (normalized === 'approved') return 'green';
  if (normalized === 'pendingmanualreview') return 'orange';
  if (normalized === 'revisionrequested') return 'purple';
  if (normalized === 'rejected') return 'red';
  if (normalized === 'submitted') return 'blue';
  return 'default';
}

export function formatEstimateStatus(status) {
  if (!status) {
    return 'No estimate status';
  }

  return String(status)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function formatReviewMode(value) {
  if (!value) {
    return 'No review mode';
  }

  return String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDateTime(value) {
  return value ? moment(value).format('DD MMM YYYY, hh:mm A') : 'Not available';
}

function openDocument(url) {
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export default WorkshopRepairEstimateCard;
