import React, { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Descriptions,
  Drawer,
  Input,
  List,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  EyeOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import {
  approveWorkshopRepairEstimate,
  rejectWorkshopRepairEstimate,
  requestWorkshopRepairEstimateChanges,
} from '../services/workshopService';
import { formatEstimateStatus, formatReviewMode, getEstimateStatusColor } from './WorkshopRepairEstimateCard';

const { Text } = Typography;
const { TextArea } = Input;

const WORKSHOP_ESTIMATE_REQUEST_OPTIONS = [
  { key: 'total_amount', label: 'Revise total amount' },
  { key: 'receipt_document', label: 'Upload clearer receipt or quotation document' },
  { key: 'supporting_documents', label: 'Upload clearer supporting documents' },
  { key: 'remarks', label: 'Revise remarks' },
];

function WorkshopSubmissionReviewDrawer({ claim, open, onClose, onWorkflowUpdated }) {
  const [actionModal, setActionModal] = useState({ open: false, type: null });
  const [decisionNote, setDecisionNote] = useState('');
  const [selectedRequestItems, setSelectedRequestItems] = useState([]);
  const [customRequestText, setCustomRequestText] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const estimate = claim?.workshopRepairEstimate || null;

  async function handleEstimateAction() {
    if (!estimate) {
      return;
    }

    const trimmedCustomText = customRequestText.trim();

    if (actionModal.type === 'request_changes' && selectedRequestItems.length === 0 && !trimmedCustomText) {
      message.warning('Select at least one requested change or describe what the workshop needs to update.');
      return;
    }

    setSubmittingAction(true);
    try {
      if (actionModal.type === 'approve') {
        await approveWorkshopRepairEstimate(estimate.estimateId, decisionNote);
      } else if (actionModal.type === 'reject') {
        await rejectWorkshopRepairEstimate(estimate.estimateId, decisionNote);
      } else if (actionModal.type === 'request_changes') {
        const selectedLabels = WORKSHOP_ESTIMATE_REQUEST_OPTIONS
          .filter((item) => selectedRequestItems.includes(item.key))
          .map((item) => item.label);

        await requestWorkshopRepairEstimateChanges(estimate.estimateId, {
          requestedItems: [...selectedLabels, trimmedCustomText].filter(Boolean).join('\n'),
          reviewNote: decisionNote,
        });
      }

      message.success('Workshop submission review saved.');
      resetActionState();

      if (onWorkflowUpdated) {
        await onWorkflowUpdated();
      }
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.title ||
          (typeof error?.response?.data === 'string' ? error.response.data : null) ||
          error?.message ||
          'Unable to save the workshop submission review.'
      );
    } finally {
      setSubmittingAction(false);
    }
  }

  function resetActionState() {
    setActionModal({ open: false, type: null });
    setDecisionNote('');
    setSelectedRequestItems([]);
    setCustomRequestText('');
  }

  return (
    <Drawer
      title={claim ? `Workshop Submission ${claim.id}` : 'Workshop submission'}
      placement="right"
      width={840}
      open={open}
      onClose={() => {
        resetActionState();
        onClose();
      }}
    >
      {!claim || !estimate ? null : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card style={{ borderRadius: 16 }}>
            <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
              <Tag color="blue">{claim.id}</Tag>
              <Tag color={getEstimateStatusColor(estimate.status)}>{formatEstimateStatus(estimate.status)}</Tag>
              <Tag color={estimate.isStpApproved ? 'green' : 'orange'}>
                {estimate.isStpApproved ? 'STP Approved' : formatReviewMode(estimate.reviewMode)}
              </Tag>
              <Tag color="processing">RM {Number(estimate.totalAmount || 0).toFixed(2)}</Tag>
            </Space>

            <Descriptions title="Quotation Summary" bordered column={1} size="middle">
              <Descriptions.Item label="Workshop">{estimate.workshopName || claim.workshopAppointment?.workshopName || 'Not available'}</Descriptions.Item>
              <Descriptions.Item label="Vehicle No">{claim.coverage?.vehicleNo || 'Not available'}</Descriptions.Item>
              <Descriptions.Item label="Submitted At">{formatDateTime(estimate.submittedAt)}</Descriptions.Item>
              <Descriptions.Item label="Reviewed At">{formatDateTime(estimate.reviewedAt)}</Descriptions.Item>
              <Descriptions.Item label="Remarks">{estimate.remarks || 'No remarks'}</Descriptions.Item>
              <Descriptions.Item label="Review Note">{estimate.reviewNote || 'No review note yet'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Alert
            type={estimate.isStpApproved ? 'success' : 'warning'}
            showIcon
            message={estimate.isStpApproved ? 'Straight-through approved by amount threshold' : 'Officer review required'}
            description={
              estimate.isStpApproved
                ? 'This quotation amount is within the STP threshold, so the backend marked it as STP approved.'
                : 'This quotation needs officer review before it can be finalized.'
            }
          />

          <Card
            title={
              <Space>
                <SafetyCertificateOutlined />
                <span>Workshop Actions</span>
              </Space>
            }
            style={{ borderRadius: 16 }}
          >
            <Space wrap>
              <Button
                type="primary"
                style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                onClick={() => setActionModal({ open: true, type: 'approve' })}
              >
                Approve Submission
              </Button>
              <Button danger onClick={() => setActionModal({ open: true, type: 'reject' })}>
                Reject Submission
              </Button>
              <Button icon={<SendOutlined />} onClick={() => setActionModal({ open: true, type: 'request_changes' })}>
                Request Changes
              </Button>
            </Space>
          </Card>

          <Card
            title={
              <Space>
                <FileTextOutlined />
                <span>Submitted Documents</span>
              </Space>
            }
            style={{ borderRadius: 16 }}
          >
            <List
              dataSource={[
                estimate.receiptOrQuotationDocument
                  ? {
                      key: 'quotation-document',
                      label: 'Receipt / quotation document',
                      url: estimate.receiptOrQuotationDocument,
                    }
                  : null,
                ...(estimate.supportingDocuments || []).map((url, index) => ({
                  key: `supporting-${index + 1}`,
                  label: `Supporting document ${index + 1}`,
                  url,
                })),
              ].filter(Boolean)}
              locale={{ emptyText: 'No workshop documents were submitted.' }}
              renderItem={(item) => (
                <List.Item actions={[<Button key="open" icon={<EyeOutlined />} onClick={() => openDocument(item.url)}>Open</Button>]}>
                  <List.Item.Meta
                    avatar={<FileTextOutlined />}
                    title={item.label}
                    description={<Text type="secondary" copyable>{item.url}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>

          <Collapse
            bordered={false}
            style={{ background: 'transparent' }}
            items={[
              {
                key: 'coverage',
                label: 'Coverage Details',
                children: (
                  <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Coverage ID">{claim.coverageId || 'Not available'}</Descriptions.Item>
                    <Descriptions.Item label="Insured Person">{claim.coverage?.insuredPersonName || 'Not available'}</Descriptions.Item>
                    <Descriptions.Item label="Vehicle No">{claim.coverage?.vehicleNo || 'Not available'}</Descriptions.Item>
                    <Descriptions.Item label="Coverage Type">{claim.coverage?.coverageType || 'Not available'}</Descriptions.Item>
                    <Descriptions.Item label="Effective Date">{formatDate(claim.coverage?.effectiveDate)}</Descriptions.Item>
                    <Descriptions.Item label="Expiry Date">{formatDate(claim.coverage?.expiryDate)}</Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'claim',
                label: 'Customer Claim Details',
                children: (
                  <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Claim ID">{claim.id}</Descriptions.Item>
                    <Descriptions.Item label="Customer ID">{claim.userId || 'Not available'}</Descriptions.Item>
                    <Descriptions.Item label="Claim Status">{claim.status || 'Not available'}</Descriptions.Item>
                    <Descriptions.Item label="Incident Date">{formatDate(claim.incidentDate)}</Descriptions.Item>
                    <Descriptions.Item label="Incident Description">{claim.incidentDescription || 'No description'}</Descriptions.Item>
                  </Descriptions>
                ),
              },
            ]}
          />

          <Modal
            open={actionModal.open}
            title={getEstimateActionModalTitle(actionModal.type)}
            onCancel={resetActionState}
            onOk={handleEstimateAction}
            okText={getEstimateActionModalOkText(actionModal.type)}
            confirmLoading={submittingAction}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {actionModal.type === 'request_changes' ? (
                <>
                  <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                    value={selectedRequestItems}
                    onChange={setSelectedRequestItems}
                    options={WORKSHOP_ESTIMATE_REQUEST_OPTIONS.map((item) => ({ label: item.label, value: item.key }))}
                    placeholder="Select what the workshop needs to update"
                  />
                  <TextArea
                    rows={3}
                    value={customRequestText}
                    onChange={(event) => setCustomRequestText(event.target.value)}
                    placeholder="Optional extra request for the panel workshop"
                  />
                </>
              ) : null}
              <TextArea
                rows={4}
                value={decisionNote}
                onChange={(event) => setDecisionNote(event.target.value)}
                placeholder="Add an officer review note"
              />
            </Space>
          </Modal>
        </Space>
      )}
    </Drawer>
  );
}

function getEstimateActionModalTitle(type) {
  if (type === 'approve') return 'Approve Workshop Submission';
  if (type === 'reject') return 'Reject Workshop Submission';
  if (type === 'request_changes') return 'Request Workshop Submission Changes';
  return 'Workshop Submission Review';
}

function getEstimateActionModalOkText(type) {
  if (type === 'approve') return 'Approve';
  if (type === 'reject') return 'Reject';
  if (type === 'request_changes') return 'Send Request';
  return 'Save';
}

function formatDate(value) {
  return value ? moment(value).format('DD MMM YYYY') : 'Not available';
}

function formatDateTime(value) {
  return value ? moment(value).format('DD MMM YYYY, hh:mm A') : 'Not available';
}

function openDocument(url) {
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export default WorkshopSubmissionReviewDrawer;
