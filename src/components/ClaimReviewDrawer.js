import React, { useMemo } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  List,
  Progress,
  Row,
  Space,
  Tag,
  Typography,
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
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import moment from 'moment';

const { Paragraph, Text, Title } = Typography;

function ClaimReviewDrawer({ claim, open, onClose }) {
  const diagnostics = claim?.validationResult?.documentDiagnostics || [];
  const validationChecks = useMemo(() => {
    const result = claim?.validationResult;

    if (!result) {
      return [];
    }

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

  const stpColor = claim?.isStpApproved ? 'success' : 'warning';

  return (
    <Drawer
      title={claim ? `Claim ${claim.id}` : 'Claim details'}
      placement="right"
      width={820}
      open={open}
      onClose={onClose}
    >
      {!claim ? (
        <Empty description="Select a claim to review" />
      ) : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card style={{ borderRadius: 16 }}>
            <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
              <Tag color="blue">{claim.type}</Tag>
              <Tag color={getStatusColor(claim.status)}>{claim.status || 'Unknown'}</Tag>
              <Tag color={stpColor}>
                {claim.isStpApproved ? 'STP Passed' : 'STP Not Passed'}
              </Tag>
              <Tag color={claim.isStpApproved ? 'green' : 'orange'}>
                {formatStpStatus(claim.stpStatus)}
              </Tag>
            </Space>

            <Descriptions title="Claim overview" bordered column={1} size="middle">
              <Descriptions.Item label="Claim ID">{claim.id}</Descriptions.Item>
              <Descriptions.Item label="Customer ID">{claim.userId || 'Not exposed by backend'}</Descriptions.Item>
              <Descriptions.Item label="Coverage ID">{claim.coverageId || 'Not exposed by backend'}</Descriptions.Item>
              <Descriptions.Item label="Submitted on">
                {claim.date ? moment(claim.date).format('DD MMM YYYY, hh:mm A') : 'Not available'}
              </Descriptions.Item>
              <Descriptions.Item label="Incident date">
                {claim.incidentDate ? moment(claim.incidentDate).format('DD MMM YYYY') : 'Not available'}
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                {claim.incidentDescription || 'No description'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            title={
              <Space>
                <SafetyCertificateOutlined />
                <span>STP Validation</span>
              </Space>
            }
            style={{ borderRadius: 16 }}
          >
            <Alert
              type={claim.isStpApproved ? 'success' : 'warning'}
              showIcon
              message={claim.isStpApproved ? 'Claim passed STP validation' : 'Claim needs manual review'}
              description={`Backend STP status: ${formatStpStatus(claim.stpStatus)}`}
              style={{ marginBottom: 16 }}
            />

            {validationChecks.length > 0 ? (
              <List
                dataSource={validationChecks}
                renderItem={(item) => (
                  <List.Item>
                    <Space>
                      {item.passed ? (
                        <CheckCircleOutlined style={{ color: '#16a34a' }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: '#dc2626' }} />
                      )}
                      <Text>{item.label}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No parsed validation detail was returned by the backend."
              />
            )}

            {claim.validationResult?.reasons?.length ? (
              <>
                <Divider />
                <Title level={5}>Validation reasons</Title>
                <List
                  dataSource={claim.validationResult.reasons}
                  renderItem={(reason) => (
                    <List.Item>
                      <Text>{reason}</Text>
                    </List.Item>
                  )}
                />
              </>
            ) : null}

            <Divider />
            <Title level={5}>Document diagnostics</Title>
            <Paragraph type="secondary">
              This section shows exactly how each OCR document performed and what match check caused STP to fail.
            </Paragraph>

            {diagnostics.length ? (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {diagnostics.map((diagnostic) => (
                  (() => {
                    const resolvedMatchSource = resolveMatchSource(diagnostic);
                    const details = buildDiagnosticDetails(diagnostic, resolvedMatchSource);

                    return (
                  <Card
                    key={diagnostic.key}
                    size="small"
                    style={{
                      borderRadius: 12,
                      background: '#fafafa',
                      border: '1px solid #f0f0f0',
                    }}
                  >
                    <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
                      <Text strong>{diagnostic.documentName}</Text>
                      <Tag color={diagnostic.provided ? 'blue' : 'default'}>
                        {diagnostic.provided ? 'Provided' : 'Not Provided'}
                      </Tag>
                      <Tag color={diagnostic.ocrSucceeded ? 'green' : 'red'}>
                        {diagnostic.ocrSucceeded ? 'OCR Success' : 'OCR Failed'}
                      </Tag>
                      {diagnostic.isMatched === true ? <Tag color="green">Matched</Tag> : null}
                      {diagnostic.isMatched === false ? <Tag color="red">Not Matched</Tag> : null}
                      {resolvedMatchSource ? (
                        <Tag color={getMatchSourceColor(resolvedMatchSource)}>
                          Matched by {formatMatchSource(resolvedMatchSource)}
                        </Tag>
                      ) : null}
                    </Space>

                    <Row gutter={[12, 12]}>
                      <Col xs={24} md={12}>
                        <Text type="secondary">OCR confidence</Text>
                        <div style={{ marginTop: 6 }}>
                          <Progress
                            percent={Math.round((diagnostic.confidence || 0) * 100)}
                            strokeColor={diagnostic.confidencePassed ? '#16a34a' : '#dc2626'}
                          />
                        </div>
                      </Col>

                      <Col xs={24} md={12}>
                        <Descriptions column={1} size="small" bordered>
                          <Descriptions.Item label="Confidence passed">
                            {renderBooleanTag(diagnostic.confidencePassed)}
                          </Descriptions.Item>
                          {details.map((item) => (
                            <Descriptions.Item key={item.label} label={item.label}>
                              {item.value}
                            </Descriptions.Item>
                          ))}
                          <Descriptions.Item label="Match source">
                            {resolvedMatchSource ? formatMatchSource(resolvedMatchSource) : 'Not provided by backend'}
                          </Descriptions.Item>
                        </Descriptions>
                      </Col>
                    </Row>

                    {diagnostic.matchMessage ? (
                      <Alert
                        showIcon
                        icon={<InfoCircleOutlined />}
                        type={diagnostic.isMatched === false ? 'error' : 'info'}
                        style={{ marginTop: 12 }}
                        message={formatMatchMessage(diagnostic, resolvedMatchSource)}
                      />
                    ) : null}

                    {diagnostic.errorMessage ? (
                      <Alert
                        showIcon
                        type="error"
                        style={{ marginTop: 12 }}
                        message={diagnostic.errorMessage}
                      />
                    ) : null}
                  </Card>
                    );
                  })()
                ))}
              </Space>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No document diagnostic details were returned by the backend."
              />
            )}
          </Card>

          <Card
            title={
              <Space>
                <FileTextOutlined />
                <span>Uploaded Documents</span>
              </Space>
            }
            style={{ borderRadius: 16 }}
          >
            {claim.documents?.length ? (
              <List
                dataSource={claim.documents}
                renderItem={(document) => (
                  <List.Item
                    actions={[
                      <Button
                        key="view"
                        icon={<EyeOutlined />}
                        onClick={() => openDocument(document.url)}
                      >
                        View
                      </Button>,
                      <Button
                        key="download"
                        icon={<DownloadOutlined />}
                        onClick={() => openDocument(document.url)}
                      >
                        Open
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={getDocumentIcon(document.extension)}
                      title={document.label}
                      description={
                        <Space direction="vertical" size={2}>
                          <Text>{document.fileName || 'Uploaded file'}</Text>
                          <Text type="secondary" copyable>
                            {document.url}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No uploaded document URLs were returned by the backend."
              />
            )}
          </Card>

          <Card
            title={
              <Space>
                <UserOutlined />
                <span>Customer And Coverage</span>
              </Space>
            }
            style={{ borderRadius: 16 }}
          >
            <Paragraph style={{ marginBottom: 12 }}>
              The current officer/admin API exposes the claim, STP result, customer ID, coverage ID,
              and document URLs. Full customer profile and full coverage details are not returned yet.
            </Paragraph>

            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Customer ID">{claim.userId || 'Not available'}</Descriptions.Item>
              <Descriptions.Item label="Coverage ID">{claim.coverageId || 'Not available'}</Descriptions.Item>
              <Descriptions.Item label="What we can fetch now">
                Claim metadata, STP status, validation reasons, and uploaded documents
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Space>
      )}
    </Drawer>
  );
}

function renderBooleanTag(value) {
  if (value === true) {
    return <Tag color="green">Yes</Tag>;
  }

  if (value === false) {
    return <Tag color="red">No</Tag>;
  }

  return <Tag>Unknown</Tag>;
}

function formatMatchSource(value) {
  switch (String(value || '').trim().toLowerCase()) {
    case 'extracted value':
      return 'extracted value';
    case 'extracted name':
      return 'extracted name';
    case 'extracted ic number':
      return 'extracted IC number';
    case 'ocr text fallback':
      return 'OCR text fallback';
    default:
      return String(value);
  }
}

function getMatchSourceColor(value) {
  switch (String(value || '').trim().toLowerCase()) {
    case 'ocr text fallback':
      return 'gold';
    case 'extracted ic number':
      return 'geekblue';
    case 'extracted name':
    case 'extracted value':
      return 'green';
    default:
      return 'default';
  }
}

function resolveMatchSource(diagnostic) {
  if (diagnostic.matchSource) {
    return diagnostic.matchSource;
  }

  const message = String(diagnostic.matchMessage || '').toLowerCase();

  if (message.includes('ocr text fallback')) {
    return 'OCR text fallback';
  }

  if (message.includes('extracted ic number')) {
    return 'Extracted IC number';
  }

  if (message.includes('extracted name')) {
    return 'Extracted name';
  }

  if (message.includes('extracted value')) {
    return 'Extracted value';
  }

  if (message.includes('from extracted value or ocr text')) {
    return 'Extracted value / OCR text';
  }

  return null;
}

function formatMatchMessage(diagnostic, resolvedMatchSource) {
  if (!diagnostic.matchMessage) {
    return '';
  }

  if (diagnostic.matchSource) {
    return diagnostic.matchMessage;
  }

  if (resolvedMatchSource === 'Extracted value / OCR text') {
    return `${diagnostic.matchMessage} The backend did not specify which one was used in this response.`;
  }

  return diagnostic.matchMessage;
}

function getExtractedSecondaryLabel(documentName) {
  const normalized = String(documentName || '').toLowerCase();

  if (normalized.includes('vehicle ownership')) {
    return 'Extracted vehicle no';
  }

  if (normalized.includes('police')) {
    return 'Extracted vehicle / reference';
  }

  if (normalized.includes('identity') || normalized.includes('driving license')) {
    return 'Extracted secondary field';
  }

  return 'Extracted secondary field';
}

function buildDiagnosticDetails(diagnostic, resolvedMatchSource) {
  const documentType = getDocumentType(diagnostic.documentName);
  const details = [];

  if (shouldShowExtractedName(documentType, diagnostic.extractedName)) {
    details.push({
      label: 'Extracted name',
      value: diagnostic.extractedName || 'Not extracted',
    });
  }

  if (shouldShowSecondaryField(documentType, diagnostic.extractedVehicleNumber)) {
    details.push({
      label: getExtractedSecondaryLabel(diagnostic.documentName),
      value: diagnostic.extractedVehicleNumber || 'Not extracted',
    });
  }

  details.push({
    label: 'Match target',
    value: formatMatchTarget(diagnostic.matchTarget, documentType, resolvedMatchSource),
  });

  return details;
}

function shouldShowExtractedName(documentType, extractedName) {
  if (!extractedName) {
    return false;
  }

  if (documentType === 'vehicleOwnership' || documentType === 'policeReport') {
    return false;
  }

  return true;
}

function shouldShowSecondaryField(documentType, extractedSecondaryValue) {
  if (!extractedSecondaryValue) {
    return false;
  }

  if (documentType === 'identity' || documentType === 'drivingLicense') {
    return false;
  }

  return true;
}

function formatMatchTarget(value, documentType, resolvedMatchSource) {
  if (!value) {
    return 'No target';
  }

  if (documentType === 'policeReport' || documentType === 'drivingLicense') {
    const parts = String(value)
      .split('|')
      .map((part) => part.trim())
      .filter(Boolean);

    const formattedParts = parts.map((part) => {
      if (part.toLowerCase().startsWith('name:')) {
        return `Expected name ${part.slice(5).trim()}`;
      }

      if (part.toLowerCase().startsWith('ic:')) {
        return `Expected IC ${part.slice(3).trim()}`;
      }

      return part;
    });

    if (resolvedMatchSource && String(resolvedMatchSource).toLowerCase() === 'ocr text fallback') {
      return `${formattedParts.join(' / ')} (checked from OCR text)`;
    }

    return formattedParts.join(' / ');
  }

  return String(value);
}

function getDocumentType(documentName) {
  const normalized = String(documentName || '').toLowerCase();

  if (normalized.includes('identity')) {
    return 'identity';
  }

  if (normalized.includes('vehicle ownership')) {
    return 'vehicleOwnership';
  }

  if (normalized.includes('police')) {
    return 'policeReport';
  }

  if (normalized.includes('driving license')) {
    return 'drivingLicense';
  }

  return 'generic';
}

function createCheck(label, passed) {
  return {
    label,
    passed: Boolean(passed),
  };
}

function getDocumentIcon(extension) {
  switch ((extension || '').toLowerCase()) {
    case 'pdf':
      return <FilePdfOutlined style={{ fontSize: 20, color: '#dc2626' }} />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'heic':
      return <FileImageOutlined style={{ fontSize: 20, color: '#2563eb' }} />;
    default:
      return <FileUnknownOutlined style={{ fontSize: 20, color: '#6b7280' }} />;
  }
}

function formatStpStatus(status) {
  if (status === null || status === undefined || status === '') {
    return 'Unknown';
  }

  return String(status);
}

function getStatusColor(status) {
  switch ((status || '').toLowerCase()) {
    case 'approved':
      return 'green';
    case 'pending':
      return 'gold';
    case 'pending manual review':
      return 'orange';
    case 'rejected':
      return 'red';
    default:
      return 'default';
  }
}

function openDocument(url) {
  if (!url) {
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

export default ClaimReviewDrawer;
