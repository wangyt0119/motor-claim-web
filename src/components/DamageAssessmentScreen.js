import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  CarOutlined,
  CheckCircleOutlined,
  FileImageOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { getMyCoverages } from '../services/coverageService';
import { assessDamage } from '../services/damageAssessmentService';

const { Title, Text } = Typography;

function DamageAssessmentScreen() {
  const [coverages, setCoverages] = useState([]);
  const [coverageLoading, setCoverageLoading] = useState(true);
  const [selectedCoverageId, setSelectedCoverageId] = useState(null);
  const [imageList, setImageList] = useState([]);
  const [customerMessage, setCustomerMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [assessmentError, setAssessmentError] = useState('');

  useEffect(() => {
    const loadCoverages = async () => {
      setCoverageLoading(true);

      try {
        const coverageList = await getMyCoverages();
        setCoverages(coverageList);
        setSelectedCoverageId(coverageList[0]?.coverageId ?? null);
      } catch (error) {
        message.error(
          error?.response?.data?.message ||
            error?.response?.data?.title ||
            'Unable to load your coverages from the backend.'
        );
      } finally {
        setCoverageLoading(false);
      }
    };

    loadCoverages();
  }, []);

  const selectedCoverage = useMemo(
    () => coverages.find((coverage) => coverage.coverageId === selectedCoverageId) ?? null,
    [coverages, selectedCoverageId]
  );

  const imageFile = imageList[0]?.originFileObj ?? imageList[0] ?? null;

  const handleAssessDamage = async () => {
    if (!selectedCoverage) {
      message.warning('Please select one coverage before submitting.');
      return;
    }

    if (!imageFile) {
      message.warning('Please upload a damage image.');
      return;
    }

    setSubmitting(true);
    setAssessmentError('');
    setAssessmentResult(null);

    try {
      const result = await assessDamage({
        coverage: selectedCoverage,
        imageFile,
        customerMessage: customerMessage.trim(),
      });

      setAssessmentResult(result);
      message.success('Damage assessment generated.');
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        (typeof error?.response?.data === 'string' ? error.response.data : null) ||
        error?.message ||
        'Unable to generate the damage assessment.';

      setAssessmentError(errorMessage);
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const uploadProps = {
    fileList: imageList,
    beforeUpload: () => false,
    maxCount: 1,
    accept: '.jpg,.jpeg,.png,.webp,.heic',
    onChange: ({ fileList }) => {
      setImageList(fileList.slice(-1));
      setAssessmentResult(null);
      setAssessmentError('');
    },
  };

  return (
    <div className="portal-dashboard-stack">
      <div className="portal-dashboard-hero portal-dashboard-theme-soft">
        <div className="portal-dashboard-hero-content">
          <span className="portal-dashboard-kicker portal-dashboard-kicker-soft">AI Assessment</span>
          <Title level={2} className="portal-dashboard-title">AI-Assisted Damage Assessment</Title>
          <Text className="portal-dashboard-description">
            Select your vehicle coverage, upload a clear damage image, and get an AI-generated repair estimate with coverage eligibility.
          </Text>
          <div className="portal-dashboard-chip-row">
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Coverages</span>
              <span className="portal-dashboard-chip-value">{coverages.length}</span>
            </div>
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Image</span>
              <span className="portal-dashboard-chip-value">{imageFile ? 'Ready' : 'Needed'}</span>
            </div>
          </div>
        </div>
      </div>

      {assessmentError ? (
        <Alert
          type="error"
          showIcon
          message="Assessment failed"
          description={assessmentError}
        />
      ) : null}

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={10}>
          <Card className="portal-dashboard-card">
            <div className="portal-dashboard-card-header">
              <div>
                <Title level={4} className="portal-dashboard-card-title">Select Coverage</Title>
                <Text className="portal-dashboard-card-subtitle">The selected policy details are sent with the damage image.</Text>
              </div>
              <SafetyCertificateOutlined style={{ color: '#FF6600', fontSize: 22 }} />
            </div>

            {coverageLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin />
              </div>
            ) : coverages.length === 0 ? (
              <Empty description="No coverages found for this account" />
            ) : (
              <div className="damage-assessment-coverage-list">
                {coverages.map((coverage) => {
                  const isSelected = coverage.coverageId === selectedCoverageId;

                  return (
                    <button
                      key={coverage.coverageId}
                      type="button"
                      className={`damage-assessment-coverage-card${isSelected ? ' selected' : ''}`}
                      onClick={() => {
                        setSelectedCoverageId(coverage.coverageId);
                        setAssessmentResult(null);
                      }}
                    >
                      <span className="damage-assessment-coverage-main">
                        <span className="damage-assessment-vehicle-no">{coverage.vehicleNo || 'Vehicle no unavailable'}</span>
                        <span className="damage-assessment-vehicle-model">
                          {[coverage.vehicleMake, coverage.vehicleModel, coverage.year].filter(Boolean).join(' ') || 'Vehicle details unavailable'}
                        </span>
                      </span>
                      <Tag color={isSelected ? 'orange' : 'default'}>{coverage.coverageType || 'Coverage'}</Tag>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={14}>
          <Card className="portal-dashboard-card">
            <div className="portal-dashboard-card-header">
              <div>
                <Title level={4} className="portal-dashboard-card-title">Vehicle Coverage Details</Title>
                <Text className="portal-dashboard-card-subtitle">AI-Assisted uses these details to check eligibility and estimate repair cost.</Text>
              </div>
              <CarOutlined style={{ color: '#FF6600', fontSize: 22 }} />
            </div>

            {selectedCoverage ? (
              <div className="damage-assessment-detail-grid">
                <CoverageDetail label="Vehicle No" value={selectedCoverage.vehicleNo} />
                <CoverageDetail label="Vehicle Make" value={selectedCoverage.vehicleMake} />
                <CoverageDetail label="Vehicle Model" value={selectedCoverage.vehicleModel} />
                <CoverageDetail label="Year" value={selectedCoverage.year} />
                <CoverageDetail label="Model Type" value={selectedCoverage.modelType} />
                <CoverageDetail label="Coverage Type" value={selectedCoverage.coverageType} />
                <CoverageDetail
                  label="Remaining Coverage Amount"
                  value={formatCurrency(selectedCoverage.remainingCoverageAmount)}
                  featured
                />
                <CoverageDetail label="Expiry Date" value={formatDate(selectedCoverage.expiryDate)} />
              </div>
            ) : (
              <Empty description="Select a coverage to continue" />
            )}

            <div className="damage-assessment-upload-panel">
              <Space direction="vertical" size={14} style={{ width: '100%' }}>
                <Upload.Dragger {...uploadProps}>
                  <p className="ant-upload-drag-icon">
                    <FileImageOutlined style={{ color: '#FF6600' }} />
                  </p>
                  <p className="ant-upload-text">Upload a clear vehicle damage image</p>
                  <p className="ant-upload-hint">JPG, PNG, WEBP or HEIC. Use one close, well-lit image for the first estimate.</p>
                </Upload.Dragger>

                <Input.TextArea
                  rows={4}
                  maxLength={800}
                  showCount
                  value={customerMessage}
                  onChange={(event) => setCustomerMessage(event.target.value)}
                  placeholder="Optional: tell us what happened or which damaged area to focus on."
                />

                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  size="large"
                  loading={submitting}
                  disabled={!selectedCoverage || !imageFile}
                  onClick={handleAssessDamage}
                  style={{ backgroundColor: '#FF6600', borderColor: '#FF6600' }}
                >
                  Submit Assessment
                </Button>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {submitting ? (
        <Card className="portal-dashboard-card">
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <Spin size="large" />
            <Title level={4} style={{ marginTop: 18 }}>AI-Assisted is reviewing the damage image</Title>
            <Text type="secondary">Checking coverage eligibility and preparing an estimated repair quotation.</Text>
          </div>
        </Card>
      ) : null}

      {assessmentResult ? <AssessmentResultCard result={assessmentResult} /> : null}
    </div>
  );
}

function CoverageDetail({ label, value, featured = false }) {
  return (
    <div className={`damage-assessment-detail-item${featured ? ' featured' : ''}`}>
      <Text className="damage-assessment-detail-label">{label}</Text>
      <Text className="damage-assessment-detail-value">{value || '-'}</Text>
    </div>
  );
}

function AssessmentResultCard({ result }) {
  const lineItems = normalizeArray(result.lineItems ?? result.LineItems);
  const safetyNotes = normalizeArray(result.safetyNotes ?? result.SafetyNotes);
  const eligibility = result.coverageEligibility ?? result.CoverageEligibility ?? {};
  const severity = result.severity ?? result.Severity ?? '-';

  const columns = [
    {
      title: 'Item',
      dataIndex: 'item',
      key: 'item',
      render: (_, item) => item.item ?? item.Item ?? item.description ?? item.Description ?? '-',
    },
    {
      title: 'Estimated Cost',
      dataIndex: 'estimatedCost',
      key: 'estimatedCost',
      width: 180,
      render: (_, item) => formatCurrency(item.estimatedCost ?? item.EstimatedCost ?? item.amount ?? item.Amount),
    },
  ];

  return (
    <Card className="portal-dashboard-card">
      <div className="portal-dashboard-card-header">
        <div>
          <Title level={4} className="portal-dashboard-card-title">Assessment Result</Title>
          <Text className="portal-dashboard-card-subtitle">Review the AI estimate before submitting a formal claim.</Text>
        </div>
        <RobotOutlined style={{ color: '#FF6600', fontSize: 24 }} />
      </div>

      <Alert
        showIcon
        type={resolveEligibilityType(eligibility)}
        icon={<CheckCircleOutlined />}
        message={eligibility.message ?? eligibility.Message ?? 'Coverage eligibility checked'}
        style={{ marginBottom: 18 }}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Statistic title="Severity" value={severity} />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Estimated Repair Cost" value={formatCurrency(result.estimatedRepairCost ?? result.EstimatedRepairCost)} />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Insurance Payable" value={formatCurrency(result.insurancePayableAmount ?? result.InsurancePayableAmount)} />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Customer Payable" value={formatCurrency(result.customerPayableAmount ?? result.CustomerPayableAmount)} />
        </Col>
      </Row>

      <div style={{ marginTop: 20 }}>
        <Title level={5}>Damage Summary</Title>
        <Text>{result.damageSummary ?? result.DamageSummary ?? '-'}</Text>
      </div>

      <div style={{ marginTop: 20 }}>
        <Title level={5}>Estimated Repair Quotation</Title>
        <Table
          rowKey={(item, index) => item.id ?? item.Id ?? `${item.item ?? item.Item ?? 'line'}-${index}`}
          columns={columns}
          dataSource={lineItems}
          pagination={false}
          size="small"
          locale={{ emptyText: 'No line items returned' }}
        />
      </div>

      <Row gutter={[18, 18]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={12}>
          <Title level={5}>Safety Notes</Title>
          {safetyNotes.length ? (
            <ul className="damage-assessment-note-list">
              {safetyNotes.map((note, index) => (
                <li key={`${note}-${index}`}>{note}</li>
              ))}
            </ul>
          ) : (
            <Text type="secondary">No safety notes returned.</Text>
          )}
        </Col>
        <Col xs={24} lg={12}>
          <Title level={5}>Disclaimer</Title>
          <Text type="secondary">{result.disclaimer ?? result.Disclaimer ?? '-'}</Text>
        </Col>
      </Row>
    </Card>
  );
}

function resolveEligibilityType(eligibility) {
  const eligible = eligibility.isEligible ?? eligibility.IsEligible;

  if (eligible === true) {
    return 'success';
  }

  if (eligible === false) {
    return 'warning';
  }

  return 'info';
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  return [value];
}

function formatCurrency(value) {
  const number = Number(value ?? 0);

  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = moment(value);
  return date.isValid() ? date.format('DD MMM YYYY') : '-';
}

export default DamageAssessmentScreen;
