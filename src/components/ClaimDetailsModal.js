import React from 'react';
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  List,
  Modal,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import { CopyOutlined, DollarOutlined, FileTextOutlined } from '@ant-design/icons';
import moment from 'moment';
import WorkshopRepairEstimateCard from './WorkshopRepairEstimateCard';

const { Title, Text } = Typography;

function ClaimDetailsModal({ claim, coverages = [], open, onClose }) {
  async function copyClaimId() {
    try {
      await navigator.clipboard.writeText(String(claim.id));
      message.success(`Claim ID ${claim.id} copied`);
    } catch (error) {
      message.error('Unable to copy claim ID');
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={760}
      title={claim ? `Claim ${claim.id}` : 'Claim details'}
    >
      {claim ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card title="Submitted Claim Details">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Claim ID">
                <Space wrap>
                  <Text strong>{claim.id}</Text>
                  <Button size="small" icon={<CopyOutlined />} onClick={copyClaimId}>
                    Copy
                  </Button>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Status">{claim.status}</Descriptions.Item>
              <Descriptions.Item label="Claim type">{claim.type}</Descriptions.Item>
              <Descriptions.Item label="Submitted at">{moment(claim.date).format('DD MMM YYYY, hh:mm A')}</Descriptions.Item>
              <Descriptions.Item label="Incident date">
                {claim.incidentDate ? moment(claim.incidentDate).format('DD MMM YYYY') : 'Not available'}
              </Descriptions.Item>
              <Descriptions.Item label="Description">{claim.incidentDescription || 'No description'}</Descriptions.Item>
              <Descriptions.Item label="Officer note">{claim.officerDecisionNote || 'No officer note'}</Descriptions.Item>
              <Descriptions.Item label="Requested items">
                {claim.requestedItems?.length ? claim.requestedItems.map((item) => item.label).join(', ') : 'None'}
              </Descriptions.Item>
              <Descriptions.Item label="Customer response note">{claim.customerResponseNote || 'No response note'}</Descriptions.Item>
              {claim.withdrawnAt ? (
                <Descriptions.Item label="Withdrawn at">{moment(claim.withdrawnAt).format('DD MMM YYYY, hh:mm A')}</Descriptions.Item>
              ) : null}
              {claim.withdrawalReason ? (
                <Descriptions.Item label="Withdrawal reason">{claim.withdrawalReason}</Descriptions.Item>
              ) : null}
            </Descriptions>
          </Card>

          <Card title="Coverage Details">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Coverage ID">{getRelatedCoverage(claim, coverages)?.coverageId || claim.coverageId || 'Not available'}</Descriptions.Item>
              <Descriptions.Item label="Insured person">
                {getRelatedCoverage(claim, coverages)?.insuredPersonName || 'Not available'}
              </Descriptions.Item>
              <Descriptions.Item label="Vehicle number">
                {getRelatedCoverage(claim, coverages)?.vehicleNo || claim.vehicleRegistration || 'Not available'}
              </Descriptions.Item>
              <Descriptions.Item label="Coverage type">
                {getRelatedCoverage(claim, coverages)?.coverageType || 'Not available'}
              </Descriptions.Item>
              <Descriptions.Item label="Effective date">
                {getRelatedCoverage(claim, coverages)?.effectiveDate
                  ? moment(getRelatedCoverage(claim, coverages)?.effectiveDate).format('DD MMM YYYY')
                  : 'Not available'}
              </Descriptions.Item>
              <Descriptions.Item label="Expiry date">
                {getRelatedCoverage(claim, coverages)?.expiryDate
                  ? moment(getRelatedCoverage(claim, coverages)?.expiryDate).format('DD MMM YYYY')
                  : 'Not available'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {claim.workshopAppointment ? (
            <Card title={isAlreadyAtWorkshop(claim.workshopAppointment) ? 'Workshop assignment' : 'Workshop appointment'}>
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Workshop">{claim.workshopAppointment.workshopName}</Descriptions.Item>
                <Descriptions.Item label="Address">{claim.workshopAppointment.workshopAddress}</Descriptions.Item>
                <Descriptions.Item label={isAlreadyAtWorkshop(claim.workshopAppointment) ? 'Arrival date' : 'Date'}>
                  {moment(claim.workshopAppointment.preferredDate).format('DD MMM YYYY')}
                </Descriptions.Item>
                {!isAlreadyAtWorkshop(claim.workshopAppointment) ? (
                  <Descriptions.Item label="Time">{formatTimeRange(claim.workshopAppointment.timeSlotStart, claim.workshopAppointment.timeSlotEnd)}</Descriptions.Item>
                ) : null}
                <Descriptions.Item label="Status">{claim.workshopAppointment.status || 'Pending'}</Descriptions.Item>
                <Descriptions.Item label="Notes">{claim.workshopAppointment.notes || 'No notes'}</Descriptions.Item>
              </Descriptions>
            </Card>
          ) : null}

          {claim.workshopRepairEstimate ? (
            <WorkshopRepairEstimateCard
              estimate={claim.workshopRepairEstimate}
              customerView
            />
          ) : null}

          <Card title={<Space><DollarOutlined /><span>Payment Progress</span></Space>}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Current stage">
                <Tag color={getPaymentProgress(claim).tagColor}>{getPaymentProgress(claim).label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Progress note">{getPaymentProgress(claim).description}</Descriptions.Item>
              <Descriptions.Item label="Payment status">{claim.workshopPayment?.status || claim.paymentStatus || 'Not available yet'}</Descriptions.Item>
              <Descriptions.Item label="Payment date">
                {claim.workshopPayment?.paidAt || claim.paymentDate
                  ? moment(claim.workshopPayment?.paidAt || claim.paymentDate).format('DD MMM YYYY, hh:mm A')
                  : 'Not available yet'}
              </Descriptions.Item>
              <Descriptions.Item label="Payment method">{claim.workshopPayment?.provider || claim.paymentMethod || 'Not available yet'}</Descriptions.Item>
              <Descriptions.Item label="Payment reference">{claim.workshopPayment?.providerReference || claim.paymentReference || 'Not available yet'}</Descriptions.Item>
              <Descriptions.Item label="Payment amount">
                {claim.workshopPayment
                  ? `${claim.workshopPayment.currency || 'MYR'} ${Number(claim.workshopPayment.amount || 0).toFixed(2)}`
                  : 'Not available yet'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={<Space><FileTextOutlined /><span>Submitted Documents</span></Space>}>
            {claim.documents?.length ? (
              <List
                dataSource={claim.documents}
                renderItem={(document) => (
                  <List.Item actions={[<Button key="view" onClick={() => openDocument(document.url)}>View</Button>]}>
                    <List.Item.Meta
                      title={document.label}
                      description={
                        <Space direction="vertical" size={2}>
                          <Text>{document.fileName || 'Uploaded file'}</Text>
                          <Text type="secondary" copyable>{document.url}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No submitted documents returned by the backend" />
            )}

            {claim.responseDocuments?.length ? (
              <>
                <Divider />
                <Title level={5}>Customer Response Documents</Title>
                <List
                  dataSource={claim.responseDocuments}
                  renderItem={(url, index) => (
                    <List.Item actions={[<Button key="view" onClick={() => openDocument(url)}>View</Button>]}>
                      <List.Item.Meta title={`Response document ${index + 1}`} description={<Text type="secondary" copyable>{url}</Text>} />
                    </List.Item>
                  )}
                />
              </>
            ) : null}
          </Card>
        </Space>
      ) : null}
    </Modal>
  );
}

function formatTimeRange(start, end) {
  if (!start || !end) {
    return 'Not available';
  }

  const normalize = (value) => String(value).slice(0, 5);
  return `${moment(normalize(start), 'HH:mm').format('hh:mm A')} - ${moment(normalize(end), 'HH:mm').format('hh:mm A')}`;
}

function getRelatedCoverage(claim, coverages) {
  return claim.relatedCoverage || coverages.find((coverage) => coverage.coverageId === claim.coverageId) || null;
}

function getPaymentProgress(claim) {
  const payment = claim.workshopPayment || null;
  const paymentStatus = String(payment?.status || claim.paymentStatus || '').toLowerCase();
  const estimateStatus = String(claim.workshopRepairEstimate?.status || '').toLowerCase();

  if (String(claim.status || '').toLowerCase() === 'withdrawn') {
    return {
      label: 'Withdrawn',
      tagColor: 'default',
      description: 'This claim was withdrawn, so no payment will be processed.',
    };
  }

  if (paymentStatus === 'paid') {
    return {
      label: 'Paid',
      tagColor: 'green',
      description: 'Payment has been completed.',
    };
  }

  if (['failed', 'rejected'].includes(paymentStatus)) {
    return {
      label: 'Payment Failed',
      tagColor: 'red',
      description: 'Payment was not successful. Please contact support for assistance.',
    };
  }

  if (['pending', 'processing', 'onhold', 'on hold'].includes(paymentStatus)) {
    return {
      label: 'Processing',
      tagColor: 'blue',
      description: 'Payment is being processed by the finance or workshop payout flow.',
    };
  }

  if ((claim.workshopRepairEstimate?.isStpApproved || estimateStatus === 'approved') && claim.status === 'Approved') {
    return {
      label: 'Awaiting Payout',
      tagColor: 'cyan',
      description: 'The workshop quotation has been approved. Payment will be prepared next.',
    };
  }

  if (claim.workshopRepairEstimate) {
    return {
      label: 'Quotation Review',
      tagColor: 'orange',
      description: 'The workshop quotation has been submitted and is waiting for approval before payment.',
    };
  }

  if (claim.status === 'Approved' && Number(claim.allClaimType) === 1) {
    return {
      label: 'Workshop Required',
      tagColor: 'gold',
      description: 'Choose a panel workshop first. Payment progress starts after workshop quotation approval.',
    };
  }

  if (String(claim.status || '').toLowerCase() === 'rejected') {
    return {
      label: 'Not Payable',
      tagColor: 'red',
      description: 'This claim was rejected, so no payment will be processed.',
    };
  }

  return {
    label: 'Not Started',
    tagColor: 'default',
    description: 'Payment progress will appear after claim approval and workshop processing.',
  };
}

function isAlreadyAtWorkshop(appointment) {
  return String(appointment?.assignmentType || '').toLowerCase() === 'alreadyatworkshop';
}

function openDocument(url) {
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export default ClaimDetailsModal;
