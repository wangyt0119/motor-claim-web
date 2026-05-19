import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Empty,
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
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FileUnknownOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { approveClaim, rejectClaim, requestClaimInfo } from '../services/claimService';
import {
  approveWorkshopRepairEstimate,
  rejectWorkshopRepairEstimate,
  requestWorkshopRepairEstimateChanges,
} from '../services/workshopService';
import WorkshopRepairEstimateCard from './WorkshopRepairEstimateCard';

const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;

const REVIEW_REQUEST_OPTIONS = [
  { key: 'police_report', label: 'Re-upload police report' },
  { key: 'vehicle_ownership', label: 'Re-upload vehicle ownership certificate' },
  { key: 'identity_front', label: 'Re-upload identity document front' },
  { key: 'identity_back', label: 'Re-upload identity document back' },
  { key: 'driving_license_front', label: 'Re-upload driving license front' },
  { key: 'driving_license_back', label: 'Re-upload driving license back' },
  { key: 'damage_photos', label: 'Re-upload vehicle damage photos' },
  { key: 'incident_description', label: 'Rewrite incident description' },
  { key: 'additional_supporting_document', label: 'Upload another supporting document' },
];

const WORKSHOP_ESTIMATE_REQUEST_OPTIONS = [
  { key: 'total_amount', label: 'Revise total amount' },
  { key: 'receipt_document', label: 'Upload clearer receipt or quotation document' },
  { key: 'supporting_documents', label: 'Upload clearer supporting documents' },
  { key: 'remarks', label: 'Revise remarks' },
];

const diagnosticHeaderStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: 12,
  alignItems: 'center',
  marginBottom: 12,
};

const diagnosticTitleStyle = {
  display: 'block',
  minWidth: 0,
};

const diagnosticLabelStyle = {
  width: 160,
  fontWeight: 600,
  background: '#f8fafc',
};

const diagnosticContentStyle = {
  wordBreak: 'break-word',
};

function ClaimWorkflowDrawer({ claim, open, onClose, onWorkflowUpdated }) {
  const [actionModal, setActionModal] = useState({ open: false, type: null });
  const [estimateActionModal, setEstimateActionModal] = useState({ open: false, type: null });
  const [decisionNote, setDecisionNote] = useState('');
  const [selectedRequestItems, setSelectedRequestItems] = useState([]);
  const [customRequestText, setCustomRequestText] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const diagnostics = useMemo(
    () => claim?.validationResult?.documentDiagnostics || [],
    [claim]
  );
  const diagnosticItems = useMemo(
    () => buildCombinedDocumentDiagnostics(claim, diagnostics),
    [claim, diagnostics]
  );
  const requestItems = claim?.requestedItems || [];
  const customerResponseDocuments = claim?.responseDocuments || [];
  const coverage = claim?.coverage || null;
  const repairEstimate = claim?.workshopRepairEstimate || null;

  const validationChecks = useMemo(() => {
    const result = claim?.validationResult;
    if (!result) return [];
    return [
      createCheck('Document set complete', result.isDocumentComplete),
      createCheck('Identity matched', result.isIdentityMatched),
      createCheck('Vehicle matched', result.isVehicleMatched),
      createCheck('Police report matched', result.isPoliceReportMatched),
      createCheck('Driving license matched', result.isDrivingLicenseMatched),
      createCheck('Evidence images present', result.areEvidenceImagesPresent),
      createCheck('Overall STP approval', result.isApproved),
    ];
  }, [claim]);

  async function handleOfficerAction() {
    if (!claim) {
      return;
    }

    const trimmedCustomText = customRequestText.trim();

    if (actionModal.type === 'request_info' && selectedRequestItems.length === 0 && !trimmedCustomText) {
      message.warning('Select at least one requested item or describe what the customer needs to update.');
      return;
    }

    setSubmittingAction(true);
    try {
      if (actionModal.type === 'approved') {
        await approveClaim(claim.id, decisionNote);
      } else if (actionModal.type === 'rejected') {
        await rejectClaim(claim.id, decisionNote);
      } else if (actionModal.type === 'request_info') {
        const selectedLabels = REVIEW_REQUEST_OPTIONS
          .filter((item) => selectedRequestItems.includes(item.key))
          .map((item) => item.label);
        const requestedItemsText = [...selectedLabels, trimmedCustomText].filter(Boolean).join('\n');

        await requestClaimInfo(claim.id, {
          requestedItems: requestedItemsText,
          note: decisionNote,
        });
      }

      message.success('Officer action saved to the backend.');
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
          'Unable to save this officer action.'
      );
    } finally {
      setSubmittingAction(false);
    }
  }

  async function handleEstimateAction() {
    if (!repairEstimate) {
      return;
    }

    const trimmedCustomText = customRequestText.trim();

    if (estimateActionModal.type === 'request_changes' && selectedRequestItems.length === 0 && !trimmedCustomText) {
      message.warning('Select at least one requested change or describe what the workshop needs to update.');
      return;
    }

    setSubmittingAction(true);
    try {
      if (estimateActionModal.type === 'approve') {
        await approveWorkshopRepairEstimate(repairEstimate.estimateId, decisionNote);
      } else if (estimateActionModal.type === 'reject') {
        await rejectWorkshopRepairEstimate(repairEstimate.estimateId, decisionNote);
      } else if (estimateActionModal.type === 'request_changes') {
        const selectedLabels = WORKSHOP_ESTIMATE_REQUEST_OPTIONS
          .filter((item) => selectedRequestItems.includes(item.key))
          .map((item) => item.label);
        const requestedItemsText = [...selectedLabels, trimmedCustomText].filter(Boolean).join('\n');

        await requestWorkshopRepairEstimateChanges(repairEstimate.estimateId, {
          requestedItems: requestedItemsText,
          reviewNote: decisionNote,
        });
      }

      message.success('Workshop estimate review saved to the backend.');
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
          'Unable to save the workshop estimate review.'
      );
    } finally {
      setSubmittingAction(false);
    }
  }

  function resetActionState() {
    setActionModal({ open: false, type: null });
    setEstimateActionModal({ open: false, type: null });
    setDecisionNote('');
    setSelectedRequestItems([]);
    setCustomRequestText('');
  }

  return (
    <Drawer
      title={claim ? `Claim ${claim.id}` : 'Claim details'}
      placement="right"
      width={860}
      open={open}
      onClose={() => {
        resetActionState();
        onClose();
      }}
    >
      {!claim ? (
        <Empty description="Select a claim to review" />
      ) : (
        <>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card style={{ borderRadius: 16 }}>
              <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
                <Tag color="blue">{claim.type}</Tag>
                <Tag color={getStatusColor(claim.status)}>{claim.status || 'Unknown'}</Tag>
                <Tag color={getReviewStatusColor(claim.reviewStatus)}>{formatReviewStatus(claim.reviewStatus)}</Tag>
                <Tag color={claim.isStpApproved ? 'success' : 'warning'}>
                  {claim.isStpApproved ? 'STP Passed' : 'Manual Review'}
                </Tag>
                <Tag color={claim.isStpApproved ? 'green' : 'orange'}>{formatStpStatus(claim.stpStatus)}</Tag>
              </Space>

              <Descriptions title="Claim overview" bordered column={1} size="middle">
                <Descriptions.Item label="Claim ID">{claim.id}</Descriptions.Item>
                <Descriptions.Item label="Customer ID">{claim.userId || 'Not available'}</Descriptions.Item>
                <Descriptions.Item label="Coverage ID">{claim.coverageId || 'Not available'}</Descriptions.Item>
                <Descriptions.Item label="Submitted on">
                  {claim.date ? moment(claim.date).format('DD MMM YYYY, hh:mm A') : 'Not available'}
                </Descriptions.Item>
                <Descriptions.Item label="Incident date">
                  {claim.incidentDate ? moment(claim.incidentDate).format('DD MMM YYYY') : 'Not available'}
                </Descriptions.Item>
                <Descriptions.Item label="Description">{claim.incidentDescription || 'No description'}</Descriptions.Item>
                <Descriptions.Item label="Officer note">{claim.officerDecisionNote || 'No officer note yet'}</Descriptions.Item>
                <Descriptions.Item label="Requested at">
                  {claim.requestedAt ? moment(claim.requestedAt).format('DD MMM YYYY, hh:mm A') : 'Not requested'}
                </Descriptions.Item>
                <Descriptions.Item label="Customer responded at">
                  {claim.respondedAt ? moment(claim.respondedAt).format('DD MMM YYYY, hh:mm A') : 'No response yet'}
                </Descriptions.Item>
                <Descriptions.Item label="Decision time">
                  {claim.decidedAt ? moment(claim.decidedAt).format('DD MMM YYYY, hh:mm A') : 'No final decision yet'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              title={
                <Space>
                  <SafetyCertificateOutlined />
                  <span>Coverage Context</span>
                </Space>
              }
              style={{ borderRadius: 16 }}
            >
              {coverage ? (
                <Descriptions bordered column={1} size="middle">
                  <Descriptions.Item label="Insured person">{coverage.insuredPersonName || 'Not available'}</Descriptions.Item>
                  <Descriptions.Item label="Vehicle no">{coverage.vehicleNo || 'Not available'}</Descriptions.Item>
                  <Descriptions.Item label="Coverage type">{coverage.coverageType || 'Not available'}</Descriptions.Item>
                  <Descriptions.Item label="Authorized driver">{coverage.authorizedDriver || 'Not available'}</Descriptions.Item>
                  <Descriptions.Item label="Effective date">{formatDate(coverage.effectiveDate)}</Descriptions.Item>
                  <Descriptions.Item label="Expiry date">{formatDate(coverage.expiryDate)}</Descriptions.Item>
                  <Descriptions.Item label="Coverage ID">{coverage.coverageId || claim.coverageId || 'Not available'}</Descriptions.Item>
                </Descriptions>
              ) : (
                <Alert
                  type="warning"
                  showIcon
                  message="Coverage detail not loaded"
                  description="The claim can still be reviewed, but only the coverage ID is available for this record."
                />
              )}
            </Card>

            <Card
              title={
                <Space>
                  <SafetyCertificateOutlined />
                  <span>Officer Actions</span>
                </Space>
              }
              style={{ borderRadius: 16 }}
            >
              <Space wrap>
                <Button
                  type="primary"
                  style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                  onClick={() => setActionModal({ open: true, type: 'approved' })}
                >
                  Approve
                </Button>
                <Button danger onClick={() => setActionModal({ open: true, type: 'rejected' })}>
                  Reject
                </Button>
                <Button icon={<SendOutlined />} onClick={() => setActionModal({ open: true, type: 'request_info' })}>
                  Request Reupload / Rewrite
                </Button>
              </Space>
              <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
                These buttons call your backend review endpoints directly. Use request info when you need a new document
                upload, a rewritten explanation, or another follow-up before final approval.
              </Paragraph>
            </Card>

            <Card title={<Space><SafetyCertificateOutlined /><span>STP Validation</span></Space>} style={{ borderRadius: 16 }}>
              <Alert
                type={claim.isStpApproved ? 'success' : 'warning'}
                showIcon
                message={claim.isStpApproved ? 'Claim passed STP validation' : 'Claim needs manual review'}
                description={`Backend STP status: ${formatStpStatus(claim.stpStatus)}`}
                style={{ marginBottom: 16 }}
              />

              <List
                dataSource={validationChecks}
                renderItem={(item) => (
                  <List.Item>
                    <Space>
                      {item.passed ? <CheckCircleOutlined style={{ color: '#16a34a' }} /> : <CloseCircleOutlined style={{ color: '#dc2626' }} />}
                      <Text>{item.label}</Text>
                    </Space>
                  </List.Item>
                )}
              />

              {claim.validationResult?.reasons?.length ? (
                <>
                  <Divider />
                  <Title level={5}>Validation reasons</Title>
                  <List dataSource={claim.validationResult.reasons} renderItem={(reason) => <List.Item><Text>{reason}</Text></List.Item>} />
                </>
              ) : null}

              <Divider />
              <Title level={5}>Document diagnostics</Title>
              <Paragraph type="secondary">
                OCR verification is applied to identity, vehicle ownership, police report, and driving license documents.
                Other uploaded files are shown as file validation checks so the document set is reviewed completely.
              </Paragraph>

              {diagnosticItems.length ? (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {diagnosticItems.map((item) => {
                    if (item.type === 'file') {
                      return (
                        <Card key={item.key} size="small" style={{ borderRadius: 12, background: '#fafafa' }}>
                          <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
                            <Text strong>{item.label}</Text>
                            <Tag color="blue">File validation</Tag>
                            <Tag color={item.supportedFormat ? 'green' : 'orange'}>
                              {item.supportedFormat ? 'Ready for review' : 'Check format'}
                            </Tag>
                          </Space>

                          <Descriptions column={1} size="small" bordered>
                            <Descriptions.Item label="Upload status">{renderBooleanTag(Boolean(item.url))}</Descriptions.Item>
                            <Descriptions.Item label="File type">{item.extension ? item.extension.toUpperCase() : 'Unknown'}</Descriptions.Item>
                            <Descriptions.Item label="Validation note">{item.message}</Descriptions.Item>
                          </Descriptions>
                        </Card>
                      );
                    }

                    const diagnostic = item.diagnostic;
                    const resolvedMatchSource = resolveMatchSource(diagnostic);
                    const details = buildDiagnosticDetails(diagnostic, resolvedMatchSource);
                    const matchTarget = details.find((detail) => detail.label === 'Match target');
                    return (
                      <Card key={diagnostic.key} size="small" style={{ borderRadius: 12, background: '#fafafa' }}>
                        <div style={diagnosticHeaderStyle}>
                          <Text strong style={diagnosticTitleStyle}>{diagnostic.documentName}</Text>
                          <Space size={6} wrap={false}>
                            <Tag color="purple" style={{ marginInlineEnd: 0 }}>OCR verification</Tag>
                            <Tag color={diagnostic.provided ? 'blue' : 'default'} style={{ marginInlineEnd: 0 }}>
                              {diagnostic.provided ? 'Provided' : 'Not Provided'}
                            </Tag>
                          </Space>
                        </div>

                        <Descriptions column={1} size="small" bordered labelStyle={diagnosticLabelStyle} contentStyle={diagnosticContentStyle}>
                          <Descriptions.Item label="Confidence passed">{renderBooleanTag(diagnostic.confidencePassed)}</Descriptions.Item>
                          <Descriptions.Item label="Match target">{matchTarget?.value || 'No target'}</Descriptions.Item>
                        </Descriptions>
                      </Card>
                    );
                  })}
                </Space>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No document diagnostic details were returned by the backend." />
              )}
            </Card>

            {requestItems.length ? (
              <Card title="Requested Customer Actions" style={{ borderRadius: 16 }}>
                <List dataSource={requestItems} renderItem={(item) => <List.Item><Text>{item.label}</Text></List.Item>} />
                {claim.officerDecisionNote ? <Alert style={{ marginTop: 12 }} type="info" showIcon message={claim.officerDecisionNote} /> : null}
              </Card>
            ) : null}

            {(claim.customerResponseNote || customerResponseDocuments.length) ? (
              <Card title="Customer Response" style={{ borderRadius: 16 }}>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Submitted at">{claim.respondedAt ? moment(claim.respondedAt).format('DD MMM YYYY, hh:mm A') : 'Not available'}</Descriptions.Item>
                  <Descriptions.Item label="Customer note">{claim.customerResponseNote || 'No note provided'}</Descriptions.Item>
                </Descriptions>
                {customerResponseDocuments.length ? (
                  <>
                    <Divider />
                    <List
                      dataSource={customerResponseDocuments}
                      renderItem={(documentUrl, index) => (
                        <List.Item actions={[<Button key="view" onClick={() => openDocument(documentUrl)}>View</Button>]}> 
                          <List.Item.Meta
                            title={`Response document ${index + 1}`}
                            description={<Text type="secondary" copyable>{documentUrl}</Text>}
                          />
                        </List.Item>
                      )}
                    />
                  </>
                ) : null}
              </Card>
            ) : null}

            {claim.workshopAppointment ? (
              <Card title="Panel Workshop Appointment" style={{ borderRadius: 16 }}>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Workshop">{claim.workshopAppointment.workshopName || 'Not available'}</Descriptions.Item>
                  <Descriptions.Item label="State">{claim.workshopAppointment.workshopState || 'Not available'}</Descriptions.Item>
                  <Descriptions.Item label="Address">{claim.workshopAppointment.workshopAddress || 'Not available'}</Descriptions.Item>
                  <Descriptions.Item label="Preferred date">
                    {claim.workshopAppointment.preferredDate ? moment(claim.workshopAppointment.preferredDate).format('DD MMM YYYY') : 'Not available'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Time slot">{formatTimeSlot(claim.workshopAppointment.timeSlotStart, claim.workshopAppointment.timeSlotEnd)}</Descriptions.Item>
                  <Descriptions.Item label="Appointment status"><Tag color="processing">{claim.workshopAppointment.status || 'Pending'}</Tag></Descriptions.Item>
                  <Descriptions.Item label="Notes">{claim.workshopAppointment.notes || 'No notes'}</Descriptions.Item>
                </Descriptions>
              </Card>
            ) : null}

            {repairEstimate ? (
              <>
                <WorkshopRepairEstimateCard estimate={repairEstimate} />
                <Card
                  title={
                    <Space>
                      <SafetyCertificateOutlined />
                      <span>Workshop Estimate Review</span>
                    </Space>
                  }
                  style={{ borderRadius: 16 }}
                >
                  <Space wrap>
                    <Button
                      type="primary"
                      style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                      onClick={() => setEstimateActionModal({ open: true, type: 'approve' })}
                    >
                      Approve Submission
                    </Button>
                    <Button danger onClick={() => setEstimateActionModal({ open: true, type: 'reject' })}>
                      Reject Submission
                    </Button>
                    <Button icon={<SendOutlined />} onClick={() => setEstimateActionModal({ open: true, type: 'request_changes' })}>
                      Request Changes
                    </Button>
                  </Space>
                </Card>
              </>
            ) : null}

            <Card title={<Space><FileTextOutlined /><span>Uploaded Documents</span></Space>} style={{ borderRadius: 16 }}>
              {claim.documents?.length ? (
                <List
                  dataSource={claim.documents}
                  renderItem={(document) => (
                    <List.Item actions={[
                      <Button key="view" icon={<EyeOutlined />} onClick={() => openDocument(document.url)}>View</Button>,
                      <Button key="download" icon={<DownloadOutlined />} onClick={() => openDocument(document.url)}>Open</Button>,
                    ]}>
                      <List.Item.Meta
                        avatar={getDocumentIcon(document.extension)}
                        title={document.label}
                        description={<Space direction="vertical" size={2}><Text>{document.fileName || 'Uploaded file'}</Text><Text type="secondary" copyable>{document.url}</Text></Space>}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No uploaded document URLs were returned by the backend." />
              )}
            </Card>
          </Space>

          <Modal open={actionModal.open} title={getActionModalTitle(actionModal.type)} onCancel={resetActionState} onOk={handleOfficerAction} okText={getActionModalOkText(actionModal.type)} confirmLoading={submittingAction}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {actionModal.type === 'request_info' ? (
                <>
                  <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                    value={selectedRequestItems}
                    onChange={setSelectedRequestItems}
                    options={REVIEW_REQUEST_OPTIONS.map((item) => ({ label: item.label, value: item.key }))}
                    placeholder="Select what the customer needs to update"
                  />
                  <TextArea
                    rows={3}
                    value={customRequestText}
                    onChange={(event) => setCustomRequestText(event.target.value)}
                    placeholder="Optional extra request, for example: Rewrite the incident explanation with clearer accident sequence."
                  />
                </>
              ) : null}
              <TextArea rows={4} value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder="Add an officer note" />
            </Space>
          </Modal>

          <Modal
            open={estimateActionModal.open}
            title={getEstimateActionModalTitle(estimateActionModal.type)}
            onCancel={resetActionState}
            onOk={handleEstimateAction}
            okText={getEstimateActionModalOkText(estimateActionModal.type)}
            confirmLoading={submittingAction}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {estimateActionModal.type === 'request_changes' ? (
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
                    placeholder="Optional extra request, for example: Upload clearer damage photos or revise the parts subtotal."
                  />
                </>
              ) : null}
              <TextArea rows={4} value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder="Add an officer review note" />
            </Space>
          </Modal>
        </>
      )}
    </Drawer>
  );
}

function renderBooleanTag(value) {
  if (value === true) return <Tag color="green">Yes</Tag>;
  if (value === false) return <Tag color="red">No</Tag>;
  return <Tag>Unknown</Tag>;
}

function buildCombinedDocumentDiagnostics(claim, diagnostics) {
  const ocrItems = diagnostics.map((diagnostic) => ({
    type: 'ocr',
    key: `ocr-${diagnostic.key || diagnostic.documentName}`,
    diagnostic,
  }));

  const fileItems = (claim?.documents || [])
    .filter((document) => !findMatchingDiagnostic(document.label, diagnostics))
    .map((document) => {
      const extension = String(document.extension || extractExtension(document.fileName || document.url)).toLowerCase();
      const supportedFormat = ['pdf', 'jpg', 'jpeg', 'png'].includes(extension);

      return {
        type: 'file',
        key: `file-${document.key || document.label || document.url}`,
        label: document.label || document.fileName || 'Uploaded document',
        url: document.url,
        extension,
        supportedFormat,
        message: supportedFormat
          ? 'File is uploaded, readable by the portal, and available for officer review. OCR is not required for this document type.'
          : 'File is uploaded, but the format should be checked manually because it is not PDF, JPG, JPEG, or PNG.',
      };
    });

  return [...ocrItems, ...fileItems];
}

function findMatchingDiagnostic(label, diagnostics) {
  const normalizedLabel = normalizeDocumentName(label);

  return diagnostics.find((diagnostic) => {
    const normalizedDiagnosticName = normalizeDocumentName(diagnostic.documentName);
    return (
      normalizedLabel === normalizedDiagnosticName ||
      normalizedLabel.includes(normalizedDiagnosticName) ||
      normalizedDiagnosticName.includes(normalizedLabel) ||
      isGroupedOcrDocumentMatch(normalizedLabel, normalizedDiagnosticName)
    );
  });
}

function isGroupedOcrDocumentMatch(label, diagnosticName) {
  return (
    (label.includes('identity') && diagnosticName.includes('identity')) ||
    (label.includes('driving license') && diagnosticName.includes('driving license')) ||
    (label.includes('vehicle ownership') && diagnosticName.includes('vehicle ownership')) ||
    (label.includes('police report') && diagnosticName.includes('police report'))
  );
}

function normalizeDocumentName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/document|file/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function extractExtension(value) {
  const fileName = String(value || '').split('?')[0].split('/').pop() || '';
  const segments = fileName.split('.');
  return segments.length > 1 ? segments[segments.length - 1] : '';
}

function resolveMatchSource(diagnostic) {
  if (diagnostic.matchSource) return diagnostic.matchSource;
  const message = String(diagnostic.matchMessage || '').toLowerCase();
  if (message.includes('ocr text fallback')) return 'OCR text fallback';
  if (message.includes('extracted ic number')) return 'Extracted IC number';
  if (message.includes('extracted name')) return 'Extracted name';
  if (message.includes('extracted value')) return 'Extracted value';
  if (message.includes('from extracted value or ocr text')) return 'Extracted value / OCR text';
  return null;
}

function buildDiagnosticDetails(diagnostic, resolvedMatchSource) {
  const documentType = getDocumentType(diagnostic.documentName);
  const details = [];
  if (shouldShowExtractedName(documentType, diagnostic.extractedName)) {
    details.push({ label: 'Extracted name', value: diagnostic.extractedName || 'Not extracted' });
  }
  if (shouldShowSecondaryField(documentType, diagnostic.extractedVehicleNumber)) {
    details.push({
      label: getExtractedSecondaryLabel(diagnostic.documentName),
      value: diagnostic.extractedVehicleNumber || 'Not extracted',
    });
  }
  details.push({ label: 'Match target', value: formatMatchTarget(diagnostic.matchTarget, documentType, resolvedMatchSource) });
  return details;
}

function shouldShowExtractedName(documentType, extractedName) {
  return Boolean(extractedName) && !['vehicleOwnership', 'policeReport'].includes(documentType);
}

function shouldShowSecondaryField(documentType, extractedSecondaryValue) {
  return Boolean(extractedSecondaryValue) && !['identity', 'drivingLicense'].includes(documentType);
}

function getExtractedSecondaryLabel(documentName) {
  const normalized = String(documentName || '').toLowerCase();
  if (normalized.includes('vehicle ownership')) return 'Extracted vehicle no';
  if (normalized.includes('police')) return 'Extracted vehicle / reference';
  return 'Extracted secondary field';
}

function formatMatchTarget(value, documentType, resolvedMatchSource) {
  if (!value) return 'No target';
  if (documentType === 'policeReport' || documentType === 'drivingLicense') {
    const parts = String(value)
      .split('|')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        if (part.toLowerCase().startsWith('name:')) return `Expected name ${part.slice(5).trim()}`;
        if (part.toLowerCase().startsWith('ic:')) return `Expected IC ${part.slice(3).trim()}`;
        return part;
      });
    if (String(resolvedMatchSource || '').toLowerCase() === 'ocr text fallback') {
      return `${parts.join(' / ')} (checked from OCR text)`;
    }
    return parts.join(' / ');
  }
  return String(value);
}

function getDocumentType(documentName) {
  const normalized = String(documentName || '').toLowerCase();
  if (normalized.includes('identity')) return 'identity';
  if (normalized.includes('vehicle ownership')) return 'vehicleOwnership';
  if (normalized.includes('police')) return 'policeReport';
  if (normalized.includes('driving license')) return 'drivingLicense';
  return 'generic';
}

function getActionModalTitle(type) {
  if (type === 'approved') return 'Approve Claim';
  if (type === 'rejected') return 'Reject Claim';
  if (type === 'request_info') return 'Request Customer Update';
  return 'Officer Action';
}

function getActionModalOkText(type) {
  if (type === 'approved') return 'Approve';
  if (type === 'rejected') return 'Reject';
  if (type === 'request_info') return 'Send Request';
  return 'Save';
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

function createCheck(label, passed) {
  return { label, passed: Boolean(passed) };
}

function getDocumentIcon(extension) {
  const normalized = (extension || '').toLowerCase();
  if (normalized === 'pdf') return <FilePdfOutlined style={{ fontSize: 20, color: '#dc2626' }} />;
  if (['png', 'jpg', 'jpeg', 'heic'].includes(normalized)) return <FileImageOutlined style={{ fontSize: 20, color: '#2563eb' }} />;
  return <FileUnknownOutlined style={{ fontSize: 20, color: '#6b7280' }} />;
}

function formatStpStatus(status) {
  return status === null || status === undefined || status === '' ? 'Unknown' : String(status);
}

function formatReviewStatus(status) {
  if (!status) {
    return 'No review status';
  }

  return String(status)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function getReviewStatusColor(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'approved') return 'green';
  if (normalized === 'rejected') return 'red';
  if (normalized === 'pendingcustomeraction') return 'purple';
  if (normalized === 'customerresponded') return 'blue';
  if (normalized === 'pendingmanualreview' || normalized === 'pending') return 'orange';
  return 'default';
}

function getStatusColor(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'approved') return 'green';
  if (normalized === 'pending') return 'gold';
  if (['pending manual review', 'pending customer action', 'customer responded'].includes(normalized)) return 'orange';
  if (normalized === 'rejected') return 'red';
  return 'default';
}

function formatTimeSlot(start, end) {
  if (!start || !end) {
    return 'Not available';
  }

  return `${formatTimeValue(start)} - ${formatTimeValue(end)}`;
}

function formatTimeValue(value) {
  const rawValue = String(value);
  const normalized = rawValue.length >= 5 ? rawValue.slice(0, 5) : rawValue;
  return moment(normalized, 'HH:mm').isValid() ? moment(normalized, 'HH:mm').format('hh:mm A') : rawValue;
}

function formatDate(value) {
  return value ? moment(value).format('DD MMM YYYY') : 'Not available';
}

function openDocument(url) {
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
}

export default ClaimWorkflowDrawer;
