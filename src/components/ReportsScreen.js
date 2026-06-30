import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, Typography, Row, Col, Select, DatePicker, Button, 
  Divider, Space, Tag, Spin, Input, 
  Slider, Alert, notification, Empty, Progress
} from 'antd';
import { 
  DownloadOutlined, 
  FilterOutlined, 
  BarChartOutlined, 
  ClearOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  FileTextOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import moment from 'moment';
import { getAllClaims } from '../services/claimService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

function ReportsScreen({ claims: providedClaims = null, loading = false, onRefresh = null }) {
  // Report criteria state
  const [startDate, setStartDate] = useState(moment().subtract(30, 'days'));
  const [endDate, setEndDate] = useState(moment());
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isGenerating, setIsGenerating] = useState(false);
  const [amountRange, setAmountRange] = useState([0, 50000]);
  const [allClaims, setAllClaims] = useState([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);
  const [hasGeneratedReport, setHasGeneratedReport] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [generatedReportData, setGeneratedReportData] = useState(null);
  const [loadingError, setLoadingError] = useState(null);
  const [amountSliderMax, setAmountSliderMax] = useState(50000);

  const usingProvidedClaims = Array.isArray(providedClaims);

  const reportClaims = useMemo(
    () => allClaims.filter(Boolean),
    [allClaims]
  );

  const statusOptions = useMemo(
    () => ['All', ...new Set(reportClaims.map((claim) => claim.status).filter(Boolean))],
    [reportClaims]
  );

  const pickerValue = useMemo(
    () => [dayjs(startDate.format('YYYY-MM-DD')), dayjs(endDate.format('YYYY-MM-DD'))],
    [endDate, startDate]
  );

  const updateAmountBounds = (claims) => {
    const maxAmount = claims.reduce(
      (max, claim) => Math.max(max, getReportAmount(claim)),
      0
    );
    const normalizedMax = Math.max(50000, Math.ceil(maxAmount / 1000) * 1000 || 50000);
    setAmountSliderMax(normalizedMax);
    setAmountRange((currentRange) => [
      0,
      currentRange[1] > normalizedMax ? normalizedMax : normalizedMax,
    ]);
  };

  useEffect(() => {
    if (!usingProvidedClaims) {
      return;
    }

    const nextClaims = providedClaims || [];
    setAllClaims(nextClaims);
    updateAmountBounds(nextClaims.filter(Boolean));
    setLoadingError(null);
    setIsLoadingClaims(Boolean(loading));
  }, [providedClaims, loading, usingProvidedClaims]);

  useEffect(() => {
    if (usingProvidedClaims) {
      return undefined;
    }

    async function loadClaims() {
      setIsLoadingClaims(true);
      setLoadingError(null);
      try {
        const claims = await getAllClaims();
        setAllClaims(claims);
        updateAmountBounds(claims.filter(Boolean));
      } catch (error) {
        setLoadingError('Unable to load claims for reporting.');
        notification.error({
          message: 'Claims loading failed',
          description: error?.response?.data?.message || error?.message || 'Unable to retrieve claims data.',
          placement: 'bottomRight',
        });
      } finally {
        setIsLoadingClaims(false);
      }
    }

    loadClaims();
    return undefined;
  }, [usingProvidedClaims]);

  const currentReportData = useMemo(() => {
    const filteredClaims = reportClaims.filter((claim) => {
      const claimDateSource = claim.incidentDate || claim.createdAt || claim.date;
      const claimDate = normalizeClaimMoment(claimDateSource);
      const dateInRange = claimDate.isValid()
        ? claimDate.isBetween(startDate.clone().startOf('day'), endDate.clone().endOf('day'), undefined, '[]')
        : false;
      const statusMatch = selectedStatus === 'All' || claim.status === selectedStatus;
      const claimAmount = getReportAmount(claim);
      const amountMatch = claimAmount >= amountRange[0] && claimAmount <= amountRange[1];

      return dateInRange && statusMatch && amountMatch;
    });

    const totalClaims = filteredClaims.length;
    const totalAmount = filteredClaims.reduce((sum, claim) => sum + getReportAmount(claim), 0);
    const avgAmount = totalClaims > 0 ? totalAmount / totalClaims : 0;

    const statusCounts = {};
    const statusAmounts = {};
    const timeSeries = buildTimeSeriesData(filteredClaims, startDate, endDate);
    filteredClaims.forEach((claim) => {
      const status = claim.status || 'Unknown';
      const amount = getReportAmount(claim);

      statusCounts[status] = (statusCounts[status] || 0) + 1;
      statusAmounts[status] = (statusAmounts[status] || 0) + amount;
    });

    const approvedCount = filteredClaims.filter((claim) => isApprovedStatus(claim.status)).length;
    const approvalRate = totalClaims > 0 ? (approvedCount / totalClaims) * 100 : 0;

    const averageResolutionDays = calculateAverageResolutionDays(filteredClaims);
    const manualReviewCount = filteredClaims.filter(isManualReviewClaim).length;
    const pendingCustomerActionCount = filteredClaims.filter((claim) =>
      /pending customer action/i.test(claim.status || '')
    ).length;

    return {
      filteredClaims,
      totalClaims,
      totalAmount,
      avgAmount,
      statusCounts,
      statusAmounts,
      timeSeriesLabel: timeSeries.label,
      timeSeriesAmounts: timeSeries.amounts,
      approvalRate,
      averageResolutionDays,
      manualReviewCount,
      pendingCustomerActionCount,
      generatedAt,
      startDate: startDate.clone(),
      endDate: endDate.clone(),
      selectedStatus,
      amountRange: [...amountRange],
    };
  }, [amountRange, endDate, generatedAt, reportClaims, selectedStatus, startDate]);

  useEffect(() => {
    if (!isLoadingClaims && !loadingError && allClaims.length > 0 && !hasGeneratedReport) {
      const nextGeneratedAt = new Date();
      setGeneratedAt(nextGeneratedAt);
      setGeneratedReportData({
        ...currentReportData,
        generatedAt: nextGeneratedAt,
      });
      setHasGeneratedReport(true);
    }
  }, [allClaims.length, currentReportData, hasGeneratedReport, isLoadingClaims, loadingError]);

  // Build amount range field
  const buildAmountRangeField = () => (
    <div style={{ marginTop: 16, marginBottom: 20 }}>
      <Text strong>Amount Range (RM)</Text>
      <div style={{ marginTop: 8 }}>
        <Row gutter={8} align="middle">
          <Col flex="1">
            <Input
              prefix={<DollarOutlined style={{ color: '#6C757D' }} />}
              value={`Min: ${amountRange[0]}`}
              readOnly
              style={{ 
                borderRadius: 8,
                padding: '8px 12px',
                cursor: 'default'
              }}
            />
          </Col>
          <Col>
            <Text type="secondary">to</Text>
          </Col>
          <Col flex="1">
            <Input
              prefix={<DollarOutlined style={{ color: '#6C757D' }} />}
              value={`Max: ${amountRange[1] >= amountSliderMax ? 'Any' : amountRange[1]}`}
              readOnly
              style={{ 
                borderRadius: 8,
                padding: '8px 12px',
                cursor: 'default'
              }}
            />
          </Col>
        </Row>
        <Slider
          range
          min={0}
          max={amountSliderMax}
          value={amountRange}
          onChange={value => setAmountRange(value)}
          tipFormatter={value => `RM ${value}`}
          style={{ marginTop: 16 }}
        />
        <Text type="secondary" italic style={{ fontSize: 12 }}>
          Drag sliders to set custom amount range
        </Text>
      </div>
    </div>
  );

  // Generate report function
  const generateReport = () => {
    const nextGeneratedAt = new Date();
    setIsGenerating(true);
    setGeneratedAt(nextGeneratedAt);
    setGeneratedReportData({
      ...currentReportData,
      generatedAt: nextGeneratedAt,
    });
    setHasGeneratedReport(true);
    window.setTimeout(() => {
      setIsGenerating(false);
    }, 200);
  };
  
  // Export report function
  const exportReport = () => {
    if (!hasGeneratedReport || !generatedReportData || generatedReportData.filteredClaims.length === 0) {
      notification.warning({
        message: 'No data to export',
        description: 'Generate a report with at least one matching claim before exporting.',
        placement: 'bottomRight',
      });
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      notification.error({
        message: 'Unable to open PDF preview',
        description: 'Please allow pop-ups in your browser and try again.',
        placement: 'bottomRight',
      });
      return;
    }

    printWindow.document.write(buildReportPdfHtml({
      reportData: generatedReportData,
      startDate: generatedReportData.startDate,
      endDate: generatedReportData.endDate,
    }));
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
    }, 300);

    notification.success({
      message: 'PDF Export Ready',
      description: 'The print preview is open. Choose "Save as PDF" to export the report.',
      icon: <DownloadOutlined style={{ color: '#4CAF50' }} />,
      placement: 'bottomRight',
      duration: 3,
    });
  };
  
  // Clear filters function
  const clearFilters = () => {
    setStartDate(moment().subtract(30, 'days'));
    setEndDate(moment());
    setSelectedStatus('All');
    setAmountRange([0, amountSliderMax]);
    setGeneratedAt(null);
    setGeneratedReportData(null);
    setHasGeneratedReport(false);
    
    notification.success({
      message: 'Filters Cleared',
      description: 'All report filters have been reset to default values.',
      icon: <ReloadOutlined style={{ color: '#4CAF50' }} />,
      placement: 'bottomRight',
    });
  };
  
  // Handle date range change
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      const nextStart = moment(dates[0]?.format('YYYY-MM-DD'), 'YYYY-MM-DD', true);
      const nextEnd = moment(dates[1]?.format('YYYY-MM-DD'), 'YYYY-MM-DD', true);

      if (nextStart.isValid() && nextEnd.isValid()) {
        setStartDate(nextStart.startOf('day'));
        setEndDate(nextEnd.endOf('day'));
      }
    }
  };

  const refreshClaims = async () => {
    if (typeof onRefresh === 'function') {
      await onRefresh();
      return;
    }

    if (!usingProvidedClaims) {
      setLoadingError(null);
      setIsLoadingClaims(true);

      try {
        const claims = await getAllClaims();
        setAllClaims(claims);
        updateAmountBounds(claims.filter(Boolean));
      } catch (error) {
        setLoadingError('Unable to refresh claims for reporting.');
        notification.error({
          message: 'Refresh failed',
          description: error?.response?.data?.message || error?.message || 'Unable to refresh report data.',
          placement: 'bottomRight',
        });
      } finally {
        setIsLoadingClaims(false);
      }
    }
  };

  // Build report panel
  const buildReportPanel = () => {
    if (isGenerating) {
      return (
        <Card style={{ borderRadius: 12, height: '100%' }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Generating report...</Text>
            </div>
          </div>
        </Card>
      );
    }

    if (isLoadingClaims) {
      return (
        <Card style={{ borderRadius: 12, height: '100%' }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Loading claims data...</Text>
            </div>
          </div>
        </Card>
      );
    }

    if (loadingError) {
      return (
        <Card style={{ borderRadius: 12, minHeight: 400 }}>
          <Alert
            type="error"
            showIcon
            message="Unable to load claims data"
            description={loadingError}
          />
        </Card>
      );
    }

    if (!hasGeneratedReport || !generatedReportData) {
      return (
        <Card style={{ borderRadius: 12, height: '100%' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            height: 400,
            background: '#f5f5f5',
            borderRadius: 8,
            padding: 24
          }}>
            <div style={{ 
              padding: 24,
              background: '#f8f9fa',
              borderRadius: '50%',
              marginBottom: 24
            }}>
              <BarChartOutlined style={{ fontSize: 48, color: '#6C757D' }} />
            </div>
            <Title level={4}>No Report Generated</Title>
            <Text type="secondary" style={{ fontSize: 16, marginBottom: 24, textAlign: 'center' }}>
              Select your criteria and click "Generate Report" to view analytics
            </Text>
            <Button 
              type="primary" 
              icon={<BarChartOutlined />}
              onClick={generateReport}
              size="large"
            >
              Generate Report
            </Button>
          </div>
        </Card>
      );
    }
    
    return (
        <Card 
        style={{ borderRadius: 12 }}
        bodyStyle={{ padding: 24 }}
      >
        {buildReportHeader(generatedReportData)}
        <div style={{ marginTop: 24 }}>
          {buildSummaryCards(generatedReportData)}
          <div style={{ marginTop: 24 }}>
            {buildChartOverview(generatedReportData)}
          </div>
          <div style={{ marginTop: 24 }}>
            {buildInsightCards(generatedReportData)}
          </div>
          <div style={{ marginTop: 24 }}>
            {buildStatusBreakdown(generatedReportData)}
          </div>
          <div style={{ marginTop: 24 }}>
            {buildDetailedTable(generatedReportData)}
          </div>
        </div>
      </Card>
    );
  };
  
  // Build report header
  const buildReportHeader = (reportData) => (
    <Row justify="space-between" align="middle">
      <Col>
        <Title level={3} style={{ margin: 0 }}>Vehicle Damage Claims Overview</Title>
        <Text type="secondary">
          Generated on {moment(reportData.generatedAt).format('DD MMM YYYY, HH:mm')}
        </Text>
        <div>
          <Text type="secondary">
            Period: {reportData.startDate.format('DD MMM YYYY')} - {reportData.endDate.format('DD MMM YYYY')}
          </Text>
        </div>
      </Col>
      <Col>
        <Tag 
          color="#4CAF50"
          style={{ 
            padding: '4px 12px', 
            borderRadius: 16,
            fontSize: 12,
            fontWeight: 600
          }}
        >
          {reportData.filteredClaims.length} Claims
        </Tag>
      </Col>
    </Row>
  );
  
  // Build summary cards
  const buildSummaryCards = (reportData) => (
    <Row gutter={16}>
      <Col span={6}>
        {buildSummaryCard({
          title: 'Total Claims',
          value: reportData.totalClaims.toString(),
          icon: <FileTextOutlined />,
          color: '#2196F3'
        })}
      </Col>
      <Col span={6}>
        {buildSummaryCard({
          title: 'Total Amount',
          value: `RM ${reportData.totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          icon: <DollarOutlined />,
          color: '#4CAF50'
        })}
      </Col>
      <Col span={6}>
        {buildSummaryCard({
          title: 'Average Claim Value',
          value: `RM ${reportData.avgAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          icon: <RiseOutlined />,
          color: '#FF9800'
        })}
      </Col>
      <Col span={6}>
        {buildSummaryCard({
          title: 'Approval Rate',
          value: `${reportData.approvalRate.toFixed(1)}%`,
          icon: <CheckCircleOutlined />,
          color: '#9C27B0'
        })}
      </Col>
    </Row>
  );
  
  // Build summary card
  const buildSummaryCard = ({ title, value, icon, color }) => (
    <Card
      style={{ 
        backgroundColor: `${color}10`,
        borderRadius: 12,
        border: `1px solid ${color}20`
      }}
      bodyStyle={{ padding: 20 }}
    >
      <Row justify="space-between" align="middle">
        <Col>
          {React.cloneElement(icon, { style: { fontSize: 24, color } })}
        </Col>
        <Col>
          <div
            style={{
              padding: 8,
              backgroundColor: `${color}20`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RiseOutlined style={{ fontSize: 16, color }} />
          </div>
        </Col>
      </Row>
      <div style={{ marginTop: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{value}</Title>
        <Text type="secondary">{title}</Text>
      </div>
    </Card>
  );

  const buildChartOverview = (reportData) => (
    <Row gutter={16}>
      <Col span={12}>
        <Card
          title="Claim Status Chart"
          style={{ 
            backgroundColor: '#F8F9FA',
            borderRadius: 12,
            border: '1px solid #E9ECEF'
          }}
          bodyStyle={{ padding: 20 }}
        >
          {buildBarList(reportData.statusCounts, reportData.totalClaims, {
            emptyText: 'No status data available for this filter set',
            colorResolver: (label) => resolveStatusColor(label),
            suffixFormatter: (value, percentage) => `${value} claims (${percentage.toFixed(1)}%)`,
          })}
        </Card>
      </Col>
      <Col span={12}>
        <Card
          title={`Claim Value By ${reportData.timeSeriesLabel}`}
          style={{ 
            backgroundColor: '#F8F9FA',
            borderRadius: 12,
            border: '1px solid #E9ECEF'
          }}
          bodyStyle={{ padding: 20 }}
        >
          {buildColumnChart(getLastEntriesByInsertion(reportData.timeSeriesAmounts, 8), {
            emptyText: 'No amount trend available for the selected date range',
            colorResolver: (_, index) => getChartColor(index),
            valueFormatter: (value) => `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
          })}
        </Card>
      </Col>
    </Row>
  );

  const buildInsightCards = (reportData) => {
    const claims = reportData.filteredClaims;
    const approvedAmount = claims
      .filter((claim) => isApprovedStatus(claim.status))
      .reduce((sum, claim) => sum + getReportAmount(claim), 0);
    const pendingAmount = claims
      .filter((claim) => !isApprovedStatus(claim.status) && !isRejectedStatus(claim.status))
      .reduce((sum, claim) => sum + getReportAmount(claim), 0);

    return (
      <Row gutter={16}>
        <Col span={8}>
          {buildFinancialCard({
            title: 'Approved Amount',
            amount: approvedAmount,
            color: '#4CAF50',
            icon: <CheckCircleOutlined />
          })}
        </Col>
        <Col span={8}>
          {buildFinancialCard({
            title: 'Pending Amount',
            amount: pendingAmount,
            color: '#FF9800',
            icon: <ClockCircleOutlined />
          })}
        </Col>
        <Col span={8}>
          {buildPerformanceCard({
            title: 'Avg Resolution Time',
            value: reportData.averageResolutionDays.toFixed(1),
            suffix: 'days',
            color: '#1565C0',
            icon: <RiseOutlined />,
          })}
        </Col>
      </Row>
    );
  };

  // Build status breakdown
  const buildStatusBreakdown = (reportData) => {
    const statusBreakdown = reportData.statusCounts;
    const totalClaims = reportData.totalClaims;
    
    return (
      <Card
        title="Status Breakdown"
        style={{ 
          backgroundColor: '#F8F9FA',
          borderRadius: 12,
          border: '1px solid #E9ECEF'
        }}
        bodyStyle={{ padding: 20 }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Uses workshop estimate amount when the base claim amount is not stored yet.
          </Text>
        </div>
        {Object.keys(statusBreakdown).length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No claims match the current filters" />
        ) : (
          Object.entries(statusBreakdown).map(([status, count]) => (
            <div key={status} style={{ marginBottom: 12 }}>
              {buildBreakdownItem(
                status,
                count,
                totalClaims,
                resolveStatusColor(status),
                reportData.statusAmounts[status] || 0
              )}
            </div>
          ))
        )}
      </Card>
    );
  };
  
  // Build breakdown item
  const buildBreakdownItem = (label, count, total, color, amount = 0) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <div style={{ marginBottom: 12 }}>
        <Row align="middle">
          <div 
            style={{ 
              width: 12, 
              height: 12, 
              backgroundColor: color, 
              borderRadius: 2 
            }} 
          />
          <div style={{ width: 12 }} />
          <Col flex="1">
            <Text style={{ fontSize: 14, color: '#1A1A1A' }}>
              {label}
            </Text>
          </Col>
          <Text strong style={{ fontSize: 14, color: '#1A1A1A' }}>
            {count} ({percentage.toFixed(1)}%)
          </Text>
        </Row>
        <div style={{ marginTop: 6, marginLeft: 24 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Amount: RM {amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </div>
      </div>
    );
  };
  
  // Build detailed table
  const buildDetailedTable = (reportData) => (
    <div 
      style={{ 
        padding: 20, 
        backgroundColor: '#F8F9FA', 
        borderRadius: 12, 
        border: '1px solid #E9ECEF' 
      }}
    >
      <Title level={4} style={{ marginTop: 0 }}>Detailed Claims List</Title>
      {reportData.filteredClaims.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No claims matched the selected report criteria"
          style={{ marginTop: 32 }}
        />
      ) : null}
      <div style={{ marginTop: 16 }}>
        <div 
          style={{ 
            backgroundColor: 'white', 
            borderRadius: 8, 
            border: '1px solid #E0E0E0' 
          }}
        >
          {/* Table Header */}
          <div 
            style={{ 
              padding: 16, 
              backgroundColor: '#F8F9FA', 
              borderTopLeftRadius: 8, 
              borderTopRightRadius: 8 
            }}
          >
            <Row>
              <Col flex="2"><Text strong>Claim ID</Text></Col>
              <Col flex="2"><Text strong>Date</Text></Col>
              <Col flex="3"><Text strong>Type</Text></Col>
              <Col flex="3"><Text strong>Status</Text></Col>
              <Col flex="2"><Text strong>Amount</Text></Col>
            </Row>
          </div>
          
          {/* Table Rows */}
          {reportData.filteredClaims.slice(0, 10).map((claim, index) => (
            <div 
              key={claim.id}
              style={{ 
                padding: 16, 
                borderBottom: index < Math.min(reportData.filteredClaims.length, 10) - 1 ? '0.5px solid #E0E0E0' : 'none' 
              }}
            >
              <Row align="middle">
                <Col flex="2"><Text style={{ fontSize: 14 }}>{claim.id}</Text></Col>
                <Col flex="2"><Text style={{ fontSize: 14 }}>{moment(claim.date).format('DD/MM/YYYY')}</Text></Col>
                <Col flex="3"><Text style={{ fontSize: 14 }}>{claim.type}</Text></Col>
                <Col flex="3">
                  <div 
                    style={{ 
                      padding: '4px 8px', 
                      backgroundColor: `${resolveStatusColor(claim.status)}1A`, 
                      borderRadius: 12,
                      display: 'inline-block'
                    }}
                  >
                    <Text 
                      style={{ 
                        fontSize: 12, 
                        color: resolveStatusColor(claim.status),
                        fontWeight: 600
                      }}
                    >
                      {claim.status}
                    </Text>
                  </div>
                </Col>
                <Col flex="2">
                  <Text style={{ fontSize: 14 }}>
                    RM {getReportAmount(claim).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </Col>
              </Row>
            </div>
          ))}
          
          {/* Show limited results message */}
          {reportData.filteredClaims.length > 10 && (
            <div style={{ padding: 16 }}>
              <Text 
                type="secondary" 
                italic 
                style={{ fontSize: 12 }}
              >
                Showing first 10 of {reportData.filteredClaims.length} claims
              </Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  // Add the buildFinancialCard function
  const buildFinancialCard = ({ title, amount, color, icon }) => (
    <div 
      style={{ 
        padding: 16, 
        backgroundColor: 'white', 
        borderRadius: 8, 
        border: `1px solid ${color}33` 
      }}
    >
      <Row align="middle">
        {React.cloneElement(icon, { style: { color, fontSize: 20 } })}
        <div style={{ width: 8 }} />
        <Text style={{ fontSize: 14, color: '#6C757D' }}>
          {title}
        </Text>
      </Row>
      <div style={{ height: 8 }} />
      <Text style={{ fontSize: 18, fontWeight: 'bold', color }}>
        RM {amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>
    </div>
  );

  const buildPerformanceCard = ({ title, value, suffix, color, icon }) => (
    <div 
      style={{ 
        padding: 16, 
        backgroundColor: 'white', 
        borderRadius: 8, 
        border: `1px solid ${color}33` 
      }}
    >
      <Row align="middle">
        {React.cloneElement(icon, { style: { color, fontSize: 20 } })}
        <div style={{ width: 8 }} />
        <Text style={{ fontSize: 14, color: '#6C757D' }}>
          {title}
        </Text>
      </Row>
      <div style={{ height: 8 }} />
      <Text style={{ fontSize: 18, fontWeight: 'bold', color }}>
        {value} {suffix}
      </Text>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div className="portal-dashboard-hero portal-dashboard-theme-soft">
        <div className="portal-dashboard-hero-content">
          <span className="portal-dashboard-kicker portal-dashboard-kicker-soft">Officer Analytics</span>
          <Title level={2} className="portal-dashboard-title">Claims Reports & Analytics</Title>
          <Text className="portal-dashboard-description">
            Generate comprehensive reports and insights from claim performance and review outcomes.
          </Text>
          <div className="portal-dashboard-chip-row">
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Total Claims</span>
              <span className="portal-dashboard-chip-value">{reportClaims.length}</span>
            </div>
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Generated</span>
              <span className="portal-dashboard-chip-value">{hasGeneratedReport ? 'Yes' : 'No'}</span>
            </div>
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Date Range</span>
              <span className="portal-dashboard-chip-value">{startDate.format('DD MMM')} - {endDate.format('DD MMM')}</span>
            </div>
          </div>
        </div>
      </div>
      
        {/* Main Content */}
      <Row gutter={24} style={{ marginTop: 24 }}>
        {/* Left Panel - Report Criteria */}
        <Col span={8}>
          <Card 
            title={
              <Space>
                <FilterOutlined style={{ color: '#FF6600' }} />
                <span>Report Criteria</span>
              </Space>
            }
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 24 }}
          >
            {/* Date Range */}
            <div style={{ marginBottom: 20 }}>
              <Text strong>Date Range</Text>
              <RangePicker
                style={{ width: '100%', marginTop: 8 }}
                value={pickerValue}
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
              />
            </div>
            
            {/* Status Filter */}
            <div style={{ marginBottom: 20 }}>
              <Text strong>Status Filter</Text>
              <Select
                style={{ width: '100%', marginTop: 8 }}
                value={selectedStatus}
                onChange={value => setSelectedStatus(value)}
              >
                {statusOptions.map((status) => (
                  <Option key={status} value={status}>{status}</Option>
                ))}
              </Select>
            </div>
            
            {/* Additional Filters */}
            <Divider />
            <Text strong style={{ fontSize: 16 }}>Additional Filters</Text>
            
            {/* Amount Range */}
            {buildAmountRangeField()}
            
            {/* Action Buttons */}
            <Divider />
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshClaims}
              disabled={isLoadingClaims}
              block
              style={{ marginBottom: 12 }}
            >
              Refresh Claims Data
            </Button>

            <Button
              type="primary"
              icon={<BarChartOutlined />}
              loading={isGenerating}
              onClick={generateReport}
              block
              style={{ marginBottom: 12, height: 48 }}
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
            
            {hasGeneratedReport && (
              <Row gutter={8}>
                <Col span={12}>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={exportReport}
                    block
                  >
                    Export
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    icon={<ClearOutlined />}
                    onClick={clearFilters}
                    block
                  >
                    Clear
                  </Button>
                </Col>
              </Row>
            )}
          </Card>
        </Col>
        
        {/* Right Panel - Report Display */}
        <Col span={16}>
          {buildReportPanel()}
        </Col>
      </Row>
    </div>
  );
}

function isApprovedStatus(status) {
  return String(status || '').trim().toLowerCase() === 'approved';
}

function isRejectedStatus(status) {
  return String(status || '').trim().toLowerCase() === 'rejected';
}

function resolveStatusColor(status) {
  const normalizedStatus = String(status || '').trim().toLowerCase();

  if (normalizedStatus === 'approved') return '#4CAF50';
  if (normalizedStatus === 'rejected') return '#E53E3E';
  if (normalizedStatus.includes('manual review')) return '#FF6600';
  if (normalizedStatus.includes('customer action')) return '#9C27B0';
  if (normalizedStatus.includes('customer responded')) return '#1565C0';
  if (normalizedStatus.includes('pending')) return '#FF9800';

  return '#6C757D';
}

function isManualReviewClaim(claim) {
  const status = String(claim.status || '').toLowerCase();
  const reviewStatus = String(claim.reviewStatus || '').toLowerCase();
  const stpStatus = String(claim.stpStatus || '').toLowerCase();

  return status.includes('manual review') || reviewStatus.includes('manual review') || stpStatus.includes('manualreview');
}

function calculateAverageResolutionDays(claims) {
  const resolvedClaims = claims.filter((claim) => {
    const createdAt = claim.createdAt || claim.incidentDate || claim.date;
    const decidedAt = claim.decidedAt || claim.paymentDate;

    return moment(createdAt).isValid() && moment(decidedAt).isValid();
  });

  if (resolvedClaims.length === 0) {
    return 0;
  }

  const totalDays = resolvedClaims.reduce((sum, claim) => {
    const createdAt = moment(claim.createdAt || claim.incidentDate || claim.date);
    const decidedAt = moment(claim.decidedAt || claim.paymentDate);
    return sum + Math.max(decidedAt.diff(createdAt, 'days', true), 0);
  }, 0);

  return totalDays / resolvedClaims.length;
}

function formatExportDate(value) {
  const formatted = normalizeClaimMoment(value);
  return formatted.isValid() ? formatted.format('YYYY-MM-DD HH:mm:ss') : '';
}

function normalizeClaimMoment(value) {
  if (moment.isMoment(value)) {
    return value.clone();
  }

  const directMoment = moment(value);
  if (directMoment.isValid()) {
    return directMoment;
  }

  if (typeof value === 'string') {
    const fallbackMoment = moment(value, ['YYYY-MM-DD', moment.ISO_8601], true);
    if (fallbackMoment.isValid()) {
      return fallbackMoment;
    }
  }

  return moment.invalid();
}

function buildReportPdfHtml({ reportData, startDate, endDate }) {
  const statusBlocks = Object.entries(reportData.statusCounts || {})
    .map(([status, count]) => {
      const color = resolveStatusColor(status);
      const amount = reportData.statusAmounts?.[status] || 0;
      return `
        <div class="status-card" style="border-color:${color}33;background:${color}12;">
          <div class="status-top">
            <span class="status-dot" style="background:${color};"></span>
            <span class="status-name">${escapeHtml(status)}</span>
          </div>
          <div class="status-count">${escapeHtml(String(count))} claims</div>
          <div class="status-amount">RM ${escapeHtml(amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</div>
        </div>
      `;
    })
    .join('');

  const trendEntries = Object.entries(getLastEntriesByInsertion(reportData.timeSeriesAmounts || {}, 8));
  const trendMax = Math.max(...trendEntries.map(([, value]) => Number(value || 0)), 0);
  const trendBars = trendEntries
    .map(([label, value], index) => {
      const color = getChartColor(index);
      const height = trendMax > 0 ? Math.max((Number(value || 0) / trendMax) * 100, 10) : 10;
      return `
        <div class="trend-item">
          <div class="trend-value">RM ${escapeHtml(Number(value || 0).toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 }))}</div>
          <div class="trend-bar-shell">
            <div class="trend-bar" style="height:${height}%;background:linear-gradient(180deg, ${color} 0%, ${color}BB 100%);"></div>
          </div>
          <div class="trend-label">${escapeHtml(label)}</div>
        </div>
      `;
    })
    .join('');

  const rows = reportData.filteredClaims
    .slice(0, 50)
    .map((claim) => {
      const claimId = escapeHtml(claim.id);
      const submittedDate = escapeHtml(formatExportDate(claim.incidentDate || claim.createdAt || claim.date));
      const status = escapeHtml(claim.status || '');
      const amount = getReportAmount(claim).toLocaleString('en-MY', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const policyNumber = escapeHtml(claim.policyNumber || '');
      const vehicleRegistration = escapeHtml(claim.vehicleRegistration || '');

      return `
        <tr>
          <td>${claimId}</td>
          <td>${submittedDate}</td>
          <td>${status}</td>
          <td>RM ${amount}</td>
          <td>${policyNumber}</td>
          <td>${vehicleRegistration}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Vehicle Damage Claims Report</title>
        <style>
          @page { size: A4 portrait; margin: 16mm; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: Arial, sans-serif;
            color: #1f2937;
            margin: 0;
            padding: 0;
            background: #fff;
          }
          html, body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .header {
            background: linear-gradient(135deg, #0f766e 0%, #2563eb 55%, #7c3aed 100%);
            color: white;
            border-radius: 18px;
            padding: 20px 24px;
            margin-bottom: 18px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .title {
            font-size: 26px;
            font-weight: 700;
            margin: 0 0 6px;
          }
          .subtitle {
            font-size: 12px;
            color: rgba(255,255,255,0.88);
            margin: 2px 0;
          }
          .summary-grid {
            display: table;
            width: 100%;
            table-layout: fixed;
            border-spacing: 10px 0;
            margin: 0 -10px 20px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .summary-card {
            display: table-cell;
            color: white;
            border-radius: 12px;
            padding: 14px;
            vertical-align: top;
            background: linear-gradient(135deg, #111827 0%, #334155 100%);
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .summary-card.green { background: linear-gradient(135deg, #166534 0%, #16a34a 100%); }
          .summary-card.blue { background: linear-gradient(135deg, #1d4ed8 0%, #38bdf8 100%); }
          .summary-card.orange { background: linear-gradient(135deg, #c2410c 0%, #f59e0b 100%); }
          .summary-card.purple { background: linear-gradient(135deg, #6d28d9 0%, #a855f7 100%); }
          .summary-label {
            font-size: 11px;
            text-transform: uppercase;
            color: rgba(255,255,255,0.78);
            margin-bottom: 8px;
          }
          .summary-value {
            font-size: 20px;
            font-weight: 700;
          }
          .section-title {
            font-size: 16px;
            font-weight: 700;
            margin: 22px 0 10px;
          }
          .status-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 18px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .status-card {
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 12px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .status-top {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
          }
          .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 999px;
          }
          .status-name {
            font-size: 13px;
            font-weight: 700;
          }
          .status-count {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .status-amount {
            font-size: 12px;
            color: #475569;
          }
          .trend-wrap {
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 16px;
            background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .trend-row {
            display: flex;
            align-items: flex-end;
            gap: 10px;
            height: 210px;
          }
          .trend-item {
            flex: 1;
            min-width: 0;
            text-align: center;
          }
          .trend-value {
            font-size: 10px;
            margin-bottom: 6px;
            color: #334155;
          }
          .trend-bar-shell {
            height: 150px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
          }
          .trend-bar {
            width: 100%;
            border-radius: 12px 12px 4px 4px;
            box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .trend-label {
            font-size: 10px;
            color: #64748b;
            margin-top: 8px;
          }
          .page-break {
            page-break-before: always;
            break-before: page;
            height: 0;
          }
          .details-section {
            page-break-before: always;
            break-before: page;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: left;
          }
          th {
            background: #f3f4f6;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          tr, td, th {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .note {
            margin-top: 10px;
            font-size: 11px;
            color: #6b7280;
          }
          @media print {
            body {
              background: #ffffff !important;
            }
            .header,
            .summary-card,
            .status-card,
            .trend-wrap,
            .trend-bar,
            th {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Vehicle Damage Claims Overview</h1>
          <div class="subtitle">Generated on ${escapeHtml(moment(reportData.generatedAt).format('DD MMM YYYY, HH:mm'))}</div>
          <div class="subtitle">Period: ${escapeHtml(startDate.format('DD MMM YYYY'))} - ${escapeHtml(endDate.format('DD MMM YYYY'))}</div>
        </div>

        <div class="summary-grid">
          <div class="summary-card blue">
            <div class="summary-label">Total Claims</div>
            <div class="summary-value">${escapeHtml(String(reportData.totalClaims))}</div>
          </div>
          <div class="summary-card green">
            <div class="summary-label">Total Amount</div>
            <div class="summary-value">RM ${escapeHtml(reportData.totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</div>
          </div>
          <div class="summary-card orange">
            <div class="summary-label">Average Claim Value</div>
            <div class="summary-value">RM ${escapeHtml(reportData.avgAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</div>
          </div>
          <div class="summary-card purple">
            <div class="summary-label">Approval Rate</div>
            <div class="summary-value">${escapeHtml(reportData.approvalRate.toFixed(1))}%</div>
          </div>
        </div>

        <div class="section-title">Status Summary</div>
        <div class="status-grid">
          ${statusBlocks || '<div class="status-card">No status data available.</div>'}
        </div>

        <div class="section-title">Claim Value By ${escapeHtml(reportData.timeSeriesLabel || 'Period')}</div>
        <div class="trend-wrap">
          <div class="trend-row">
            ${trendBars || '<div>No trend data available.</div>'}
          </div>
        </div>

        <div class="details-section">
          <div class="section-title">Claim Details</div>
          <table>
            <thead>
              <tr>
                <th>Claim ID</th>
                <th>Submitted Date</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Policy Number</th>
                <th>Vehicle Registration</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div class="note">
            ${reportData.filteredClaims.length > 50 ? `Showing first 50 of ${escapeHtml(String(reportData.filteredClaims.length))} claims in the PDF export.` : ''}
          </div>
        </div>
      </body>
    </html>
  `;
}

function getReportAmount(claim) {
  const claimAmount = Number(claim?.claimAmount || 0);
  if (claimAmount > 0) {
    return claimAmount;
  }

  const workshopAmount = Number(claim?.workshopRepairEstimate?.totalAmount || 0);
  if (workshopAmount > 0) {
    return workshopAmount;
  }

  return 0;
}

function buildTimeSeriesData(claims, startDate, endDate) {
  const daySpan = Math.max(endDate.diff(startDate, 'days') + 1, 1);

  let label = 'Day';
  let getBucketKey = (value) => moment(value).format('DD MMM');

  if (daySpan > 31 && daySpan <= 120) {
    label = 'Week';
    getBucketKey = (value) => {
      const bucketStart = moment(value).startOf('isoWeek');
      const bucketEnd = moment(value).endOf('isoWeek');
      return `${bucketStart.format('DD MMM')} - ${bucketEnd.format('DD MMM')}`;
    };
  } else if (daySpan > 120) {
    label = 'Month';
    getBucketKey = (value) => moment(value).format('MMM YYYY');
  }

  const amounts = {};
  claims.forEach((claim) => {
    const sourceDate = claim.incidentDate || claim.createdAt || claim.date;
    const claimMoment = moment(sourceDate);
    if (!claimMoment.isValid()) {
      return;
    }

    const bucketKey = getBucketKey(claimMoment);
    amounts[bucketKey] = (amounts[bucketKey] || 0) + getReportAmount(claim);
  });

  return { label, amounts };
}

function buildSortedEntries(record) {
  return Object.entries(record || {}).sort((left, right) => right[1] - left[1]);
}

function getMaxValue(record) {
  const values = Object.values(record || {});
  return values.length > 0 ? Math.max(...values) : 0;
}

function getLastEntriesByInsertion(record, count) {
  const entries = Object.entries(record || {});
  return Object.fromEntries(entries.slice(Math.max(entries.length - count, 0)));
}

function getChartColor(index) {
  const palette = ['#2563EB', '#0F766E', '#F59E0B', '#7C3AED', '#DC2626', '#0891B2', '#16A34A', '#EA580C'];
  return palette[index % palette.length];
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildBarList(record, totalBase, { emptyText, colorResolver, suffixFormatter }) {
  const entries = buildSortedEntries(record);

  if (entries.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />;
  }

  const normalizedBase = totalBase > 0 ? totalBase : getMaxValue(record);

  return entries.map(([label, value]) => {
    const percent = normalizedBase > 0 ? (value / normalizedBase) * 100 : 0;
    return (
      <div key={label} style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 6 }}>
          <Text strong>{label}</Text>
          <Text type="secondary">{suffixFormatter(value, percent)}</Text>
        </Row>
        <Progress
          percent={Number(percent.toFixed(1))}
          showInfo={false}
          strokeColor={colorResolver(label)}
          trailColor="#E9ECEF"
        />
      </div>
    );
  });
}

function buildColumnChart(record, { emptyText, colorResolver, valueFormatter }) {
  const entries = Object.entries(record || {});

  if (entries.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />;
  }

  const maxValue = Math.max(...entries.map(([, value]) => Number(value || 0)), 0);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 12,
        minHeight: 220,
        paddingTop: 12,
      }}
    >
      {entries.map(([label, value], index) => {
        const normalizedValue = Number(value || 0);
        const heightPercent = maxValue > 0 ? Math.max((normalizedValue / maxValue) * 100, 8) : 8;
        const color = colorResolver(label, index);

        return (
          <div
            key={label}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Text strong style={{ fontSize: 12, textAlign: 'center' }}>
              {valueFormatter(normalizedValue)}
            </Text>
            <div
              style={{
                width: '100%',
                height: 150,
                display: 'flex',
                alignItems: 'flex-end',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: `${heightPercent}%`,
                  borderRadius: '12px 12px 4px 4px',
                  background: `linear-gradient(180deg, ${color} 0%, ${color}BB 100%)`,
                  boxShadow: `0 10px 20px ${color}22`,
                }}
              />
            </div>
            <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
              {label}
            </Text>
          </div>
        );
      })}
    </div>
  );
}

export default ReportsScreen;













