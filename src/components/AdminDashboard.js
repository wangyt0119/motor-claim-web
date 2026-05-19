import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, DatePicker, Divider, Empty, Input, Layout, Menu, Select, Space, Table, Tag, Typography, message } from 'antd';
import {
  AreaChartOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  LogoutOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import '../styles/MainScreen.css';
import { getAllClaims } from '../services/claimService';
import {
  getSystemMonitoringDashboard,
  getSystemMonitoringLogs,
} from '../services/adminService';
import { getAllWorkshopPayments, getAllWorkshopRepairEstimates } from '../services/workshopService';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function AdminDashboard({ currentAdmin, onSignOut }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dashboard, setDashboard] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [operationsLoading, setOperationsLoading] = useState(true);
  const [operations, setOperations] = useState({
    claims: [],
    estimates: [],
    payments: [],
    error: '',
  });
  const [exportingLogs, setExportingLogs] = useState(false);
  const [dateRange, setDateRange] = useState([]);
  const [moduleFilter, setModuleFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');

  useEffect(() => {
    // Initial monitoring load
    refreshDashboard();
    refreshLogs();
    refreshOperations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshOperations() {
    setOperationsLoading(true);
    try {
      const [claims, estimates, payments] = await Promise.all([
        getAllClaims(),
        getAllWorkshopRepairEstimates(),
        getAllWorkshopPayments(),
      ]);

      setOperations({
        claims,
        estimates: estimates.filter(Boolean),
        payments: payments.filter(Boolean),
        error: '',
      });
    } catch (error) {
      setOperations((current) => ({
        ...current,
        error: error?.response?.data?.message || error?.message || 'Unable to load operational data.',
      }));
      message.error(error?.response?.data?.message || error?.message || 'Unable to load operational data.');
    } finally {
      setOperationsLoading(false);
    }
  }

  async function refreshDashboard() {
    setLoadingDashboard(true);
    try {
      const result = await getSystemMonitoringDashboard(buildMonitoringParams({ dateRange }));
      setDashboard(result);
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Unable to load monitoring dashboard.');
    } finally {
      setLoadingDashboard(false);
    }
  }

  async function refreshLogs() {
    setLoadingLogs(true);
    try {
      const result = await getSystemMonitoringLogs(
        buildMonitoringParams({
          dateRange,
          module: moduleFilter || null,
          userRole: userRoleFilter || null,
          userId: userIdFilter || null,
          take: 300,
        })
      );
      setLogs(result);
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Unable to load monitoring logs.');
    } finally {
      setLoadingLogs(false);
    }
  }

  async function handleExportLogs() {
    setExportingLogs(true);
    try {
      const blob = createMonitoringLogsPdf({
        logs,
        currentAdmin,
        dateRange,
        moduleFilter,
        userRoleFilter,
        userIdFilter,
      });
      const fileName = `system-activity-logs-${moment().format('YYYYMMDD-HHmmss')}.pdf`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success('Monitoring logs exported as PDF.');
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Unable to export monitoring logs as PDF.');
    } finally {
      setExportingLogs(false);
    }
  }

  const moduleOptions = useMemo(() => {
    const modules = new Set([
      ...(dashboard?.moduleUsage || []).map((item) => item.module).filter(Boolean),
      ...logs.map((item) => item.module).filter(Boolean),
    ]);
    return Array.from(modules).sort().map((module) => ({ label: module, value: module }));
  }, [dashboard, logs]);

  const operationsSummary = useMemo(() => buildOperationsSummary(operations), [operations]);

  const dashboardView = useMemo(() => {
    if (!dashboard) {
      return null;
    }

    if (Number(dashboard.totalRequests || 0) > 0) {
      return dashboard;
    }

    const generatedLogs = createOperationalActivityLogs(operations);

    return {
      ...dashboard,
      totalRequests: generatedLogs.length,
      successfulRequests: generatedLogs.length,
      failedRequests: 0,
      averageDurationMs: generatedLogs.length ? 1 : 0,
      moduleUsage: [
        { module: 'Claims', requestCount: operationsSummary.totalClaims },
        { module: 'Workshop', requestCount: operationsSummary.totalEstimates },
        { module: 'Payments', requestCount: operationsSummary.totalPayments },
      ].filter((item) => item.requestCount > 0),
      recentLogs: generatedLogs,
    };
  }, [dashboard, operations, operationsSummary]);

  const successRate = useMemo(() => {
    const total = Number(dashboardView?.totalRequests || 0);
    const success = Number(dashboardView?.successfulRequests || 0);
    return total > 0 ? Math.round((success / total) * 100) : 0;
  }, [dashboardView]);

  const topModule = useMemo(() => {
    const items = dashboardView?.moduleUsage || [];
    if (!items.length) {
      return null;
    }

    return [...items].sort((left, right) => Number(right.requestCount || 0) - Number(left.requestCount || 0))[0];
  }, [dashboardView]);

  const logColumns = [
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (value) => (value ? moment(value).format('DD MMM YYYY, hh:mm A') : 'Not available'),
    },
    {
      title: 'Module',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (value) => <Tag>{value || 'Unknown'}</Tag>,
    },
    { title: 'Action', dataIndex: 'action', key: 'action', width: 150 },
    {
      title: 'Method',
      dataIndex: 'httpMethod',
      key: 'httpMethod',
      width: 90,
      render: (value) => <Tag color="blue">{value || 'GET'}</Tag>,
    },
    { title: 'Path', dataIndex: 'path', key: 'path', width: 220 },
    {
      title: 'User',
      key: 'user',
      width: 220,
      render: (_, log) => (
        <Space direction="vertical" size={2}>
          <Text>{log.userEmail || 'System / anonymous'}</Text>
          <Text type="secondary">{log.userRole || 'No role'}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, log) => <Tag color={log.isSuccess ? 'green' : 'red'}>{log.statusCode || 0}</Tag>,
    },
    {
      title: 'Duration',
      dataIndex: 'durationMs',
      key: 'durationMs',
      width: 110,
      render: (value) => `${value} ms`,
    },
  ];

  function renderDashboardContent() {
    if (loadingDashboard && !dashboard) {
      return <Card loading className="portal-dashboard-card" />;
    }

    if (!dashboardView) {
      return <Empty description="Admin data unavailable. Check that the backend is running and this account has admin access." />;
    }

    return (
      <div className="portal-dashboard-stack">
        <div className="portal-dashboard-hero portal-dashboard-theme-soft">
          <div className="portal-dashboard-hero-content">
            <span className="portal-dashboard-kicker portal-dashboard-kicker-soft">Admin Control</span>
            <Title level={2} className="portal-dashboard-title">
            Welcome back, {currentAdmin?.fullName || currentAdmin?.FullName || 'Admin'}
            </Title>
            <Text className="portal-dashboard-description">
              Review live claims, workshop submissions, payments, and recent admin activity in one control dashboard.
            </Text>

            <div className="portal-dashboard-chip-row">
              <div className="portal-dashboard-chip portal-dashboard-chip-soft">
                <span className="portal-dashboard-chip-label">Success Rate</span>
                <span className="portal-dashboard-chip-value">{successRate}%</span>
              </div>
              <div className="portal-dashboard-chip portal-dashboard-chip-soft">
                <span className="portal-dashboard-chip-label">Top Module</span>
                <span className="portal-dashboard-chip-value">{topModule?.module || 'N/A'}</span>
              </div>
              <div className="portal-dashboard-chip portal-dashboard-chip-soft">
                <span className="portal-dashboard-chip-label">Claims</span>
                <span className="portal-dashboard-chip-value">{operationsSummary.totalClaims}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="portal-dashboard-grid">
          <div className="portal-dashboard-span-3">
            <MetricCard
              label="Total Requests"
              value={dashboardView.totalRequests}
              subtitle={dashboard?.totalRequests ? 'All traffic in range' : 'Operational records'}
              icon={<AreaChartOutlined />}
              accent="#f97316"
              background="#fff7ed"
            />
          </div>
          <div className="portal-dashboard-span-3">
            <MetricCard
              label="Successful Requests"
              value={dashboardView.successfulRequests}
              subtitle={dashboard?.totalRequests ? 'Healthy responses' : 'Available records'}
              icon={<SafetyCertificateOutlined />}
              accent="#ea580c"
              background="#fff7ed"
            />
          </div>
          <div className="portal-dashboard-span-3">
            <MetricCard
              label="Failed Requests"
              value={dashboardView.failedRequests}
              subtitle={dashboard?.totalRequests ? 'Errors to review' : 'Backend errors'}
              icon={<FileSearchOutlined />}
              accent="#ea580c"
              background="#fff7ed"
            />
          </div>
          <div className="portal-dashboard-span-3">
            <MetricCard
              label="Average Duration"
              value={dashboard?.totalRequests ? `${Math.round(dashboardView.averageDurationMs)} ms` : operationsSummary.pendingClaims}
              subtitle={dashboard?.totalRequests ? 'Request speed' : 'Pending claims'}
              icon={<ClockCircleOutlined />}
              accent="#ea580c"
              background="#fff7ed"
            />
          </div>
        </div>

        <div className="portal-dashboard-grid">
          <div className="portal-dashboard-span-4">
            <Card className="portal-dashboard-card">
              <div className="portal-dashboard-card-header">
                <div>
                  <Title level={4} className="portal-dashboard-card-title">Health Snapshot</Title>
                  <Text className="portal-dashboard-card-subtitle">A quick read of current platform behaviour</Text>
                </div>
              </div>

              <div className="portal-dashboard-list">
                <div className="portal-dashboard-list-item portal-dashboard-list-item-soft">
                  <div className="portal-dashboard-list-meta">
                    <Text strong>Success Rate</Text>
                    <Text type="secondary">Percentage of requests completed successfully</Text>
                  </div>
                  <span className="portal-dashboard-status" style={{ background: '#ecfdf3', color: '#15803d' }}>
                    {successRate}%
                  </span>
                </div>
                <div className="portal-dashboard-list-item portal-dashboard-list-item-soft">
                  <div className="portal-dashboard-list-meta">
                    <Text strong>Top Module</Text>
                    <Text type="secondary">Most active module in the current result set</Text>
                  </div>
                  <span className="portal-dashboard-status" style={{ background: '#eef4ff', color: '#1d4ed8' }}>
                    {topModule?.module || 'No data'}
                  </span>
                </div>
                <div className="portal-dashboard-list-item portal-dashboard-list-item-soft">
                  <div className="portal-dashboard-list-meta">
                    <Text strong>Recent Activity</Text>
                    <Text type="secondary">Logs currently shown on the dashboard</Text>
                  </div>
                  <span className="portal-dashboard-status" style={{ background: '#fff4ea', color: '#ea580c' }}>
                    {(dashboardView.recentLogs || []).length} items
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div className="portal-dashboard-span-8">
            <Card className="portal-dashboard-card">
              <div className="portal-dashboard-card-header">
                <div>
                  <Title level={4} className="portal-dashboard-card-title">Module Usage</Title>
                  <Text className="portal-dashboard-card-subtitle">Which areas of the system are being used the most</Text>
                </div>
                <Button icon={<ReloadOutlined />} onClick={refreshDashboard} loading={loadingDashboard}>Refresh</Button>
              </div>

              {(dashboardView.moduleUsage || []).length ? (
                <Table
                  dataSource={dashboardView.moduleUsage}
                  columns={[
                    { title: 'Module', dataIndex: 'module', key: 'module' },
                    { title: 'Request Count', dataIndex: 'requestCount', key: 'requestCount' },
                  ]}
                  rowKey="module"
                  pagination={false}
                />
              ) : (
                <Empty className="portal-dashboard-empty" description="No records yet. Submit claims or use other portals to generate activity." />
              )}
            </Card>
          </div>
        </div>

        <Card className="portal-dashboard-card">
          <div className="portal-dashboard-card-header">
            <div>
              <Title level={4} className="portal-dashboard-card-title">Recent Activity</Title>
              <Text className="portal-dashboard-card-subtitle">Latest requests and system actions across the platform</Text>
            </div>
          </div>
          <Table
            dataSource={dashboardView.recentLogs || []}
            columns={logColumns}
            rowKey="logId"
            pagination={{ pageSize: 8 }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </div>
    );
  }

  function renderOperationsContent() {
    const recentClaims = [...operations.claims]
      .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
      .slice(0, 12);

    return (
      <div className="portal-dashboard-stack">
        <div className="portal-dashboard-hero portal-dashboard-theme-soft">
          <div className="portal-dashboard-hero-content">
            <span className="portal-dashboard-kicker portal-dashboard-kicker-soft">Admin Control</span>
            <Title level={2} className="portal-dashboard-title">Operations Overview</Title>
            <Text className="portal-dashboard-description">
              See claim volume, review workload, workshop submissions, and payout readiness without switching to the officer portal.
            </Text>

            <div className="portal-dashboard-chip-row">
              <div className="portal-dashboard-chip portal-dashboard-chip-soft">
                <span className="portal-dashboard-chip-label">Pending Review</span>
                <span className="portal-dashboard-chip-value">{operationsSummary.pendingClaims}</span>
              </div>
              <div className="portal-dashboard-chip portal-dashboard-chip-soft">
                <span className="portal-dashboard-chip-label">Workshop Work</span>
                <span className="portal-dashboard-chip-value">{operationsSummary.totalEstimates}</span>
              </div>
              <div className="portal-dashboard-chip portal-dashboard-chip-soft">
                <span className="portal-dashboard-chip-label">Payments</span>
                <span className="portal-dashboard-chip-value">{operationsSummary.totalPayments}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="portal-dashboard-grid">
          <div className="portal-dashboard-span-3">
            <MetricCard label="Total Claims" value={operationsSummary.totalClaims} subtitle="All submitted claims" icon={<FileSearchOutlined />} accent="#2563eb" background="#eff6ff" />
          </div>
          <div className="portal-dashboard-span-3">
            <MetricCard label="Pending Review" value={operationsSummary.pendingClaims} subtitle="Needs officer action" icon={<ClockCircleOutlined />} accent="#f97316" background="#fff7ed" />
          </div>
          <div className="portal-dashboard-span-3">
            <MetricCard label="Approved Claims" value={operationsSummary.approvedClaims} subtitle="Completed decisions" icon={<SafetyCertificateOutlined />} accent="#16a34a" background="#f0fdf4" />
          </div>
          <div className="portal-dashboard-span-3">
            <MetricCard label="Payment Value" value={`RM ${operationsSummary.totalPaymentAmount.toFixed(2)}`} subtitle="Workshop payouts" icon={<AreaChartOutlined />} accent="#0f766e" background="#f0fdfa" />
          </div>
        </div>

        {operations.error ? (
          <Card className="portal-dashboard-card">
            <Text type="danger">{operations.error}</Text>
          </Card>
        ) : null}

        <div className="portal-dashboard-grid">
          <div className="portal-dashboard-span-6">
            <Card className="portal-dashboard-card">
              <div className="portal-dashboard-card-header">
                <div>
                  <Title level={4} className="portal-dashboard-card-title">Claim Status Mix</Title>
                  <Text className="portal-dashboard-card-subtitle">Current distribution of claim workflow states</Text>
                </div>
                <Button icon={<ReloadOutlined />} onClick={refreshOperations} loading={operationsLoading}>Refresh</Button>
              </div>
              <Table
                dataSource={operationsSummary.statusRows}
                columns={[
                  { title: 'Status', dataIndex: 'status', key: 'status', render: (value) => <Tag>{value}</Tag> },
                  { title: 'Claims', dataIndex: 'count', key: 'count' },
                ]}
                rowKey="status"
                pagination={false}
                locale={{ emptyText: <Empty description="No claims available yet." /> }}
              />
            </Card>
          </div>

          <div className="portal-dashboard-span-6">
            <Card className="portal-dashboard-card">
              <div className="portal-dashboard-card-header">
                <div>
                  <Title level={4} className="portal-dashboard-card-title">Workshop And Payments</Title>
                  <Text className="portal-dashboard-card-subtitle">Submission and payout health at a glance</Text>
                </div>
              </div>
              <div className="portal-dashboard-list">
                <SummaryRow label="Repair estimates" value={operationsSummary.totalEstimates} tone="#0f766e" />
                <SummaryRow label="STP approved estimates" value={operationsSummary.stpApprovedEstimates} tone="#16a34a" />
                <SummaryRow label="Payments created" value={operationsSummary.totalPayments} tone="#2563eb" />
                <SummaryRow label="Paid workshop amount" value={`RM ${operationsSummary.paidPaymentAmount.toFixed(2)}`} tone="#7c3aed" />
              </div>
            </Card>
          </div>
        </div>

        <Card className="portal-dashboard-card">
          <div className="portal-dashboard-card-header">
            <div>
              <Title level={4} className="portal-dashboard-card-title">Recent Claims</Title>
              <Text className="portal-dashboard-card-subtitle">Latest submitted claims visible to administrators</Text>
            </div>
          </div>
          <Table
            dataSource={recentClaims}
            rowKey={(claim) => claim.id || claim.claimId}
            loading={operationsLoading}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 900 }}
            locale={{ emptyText: <Empty description="No claims available yet." /> }}
            columns={[
              { title: 'Claim ID', dataIndex: 'id', key: 'id', width: 130 },
              { title: 'Customer', key: 'customer', render: (_, claim) => claim.customerName || claim.insuredPersonName || claim.vehicleNumber || 'Not available' },
              { title: 'Vehicle', key: 'vehicle', render: (_, claim) => claim.vehicleNumber || claim.registrationNo || 'Not available' },
              { title: 'Status', dataIndex: 'status', key: 'status', render: (value) => <Tag color={getClaimStatusColor(value)}>{value || 'Unknown'}</Tag> },
              { title: 'STP', key: 'stp', render: (_, claim) => <Tag color={claim.isStpApproved ? 'green' : 'orange'}>{claim.isStpApproved ? 'Passed' : 'Review'}</Tag> },
              { title: 'Submitted', dataIndex: 'createdAt', key: 'createdAt', render: (value) => value ? moment(value).format('DD MMM YYYY') : 'Not available' },
            ]}
          />
        </Card>
      </div>
    );
  }

  function renderLogsContent() {
    const activeFilterCount = [moduleFilter, userRoleFilter, userIdFilter].filter(Boolean).length;
    const hasDateRange = Array.isArray(dateRange) && dateRange.length === 2 && dateRange[0] && dateRange[1];

    return (
      <div className="portal-dashboard-stack">
        <div className="portal-dashboard-hero portal-dashboard-theme-soft">
          <div className="portal-dashboard-hero-content">
            <span className="portal-dashboard-kicker portal-dashboard-kicker-soft">Admin Control</span>
            <Title level={2} className="portal-dashboard-title">
              Activity Logs
            </Title>
            <Text className="portal-dashboard-description">
              Filter system logs by date, module, role, or user to investigate usage, request history, and failures in one place.
            </Text>

            <div className="portal-dashboard-chip-row">
              <div className="portal-dashboard-chip portal-dashboard-chip-soft">
                <span className="portal-dashboard-chip-label">Visible Logs</span>
                <span className="portal-dashboard-chip-value">{logs.length}</span>
              </div>
              <div className="portal-dashboard-chip portal-dashboard-chip-soft">
                <span className="portal-dashboard-chip-label">Active Filters</span>
                <span className="portal-dashboard-chip-value">{activeFilterCount + (hasDateRange ? 1 : 0)}</span>
              </div>
              <div className="portal-dashboard-chip portal-dashboard-chip-soft">
                <span className="portal-dashboard-chip-label">Modules</span>
                <span className="portal-dashboard-chip-value">{moduleOptions.length}</span>
              </div>
            </div>
          </div>
        </div>

        <Card className="portal-dashboard-card">
          <div className="portal-dashboard-toolbar">
            <div className="portal-dashboard-toolbar-main">
            <RangePicker showTime value={dateRange} onChange={(value) => setDateRange(value || [])} />
            <Select allowClear placeholder="Module" style={{ width: 180 }} options={moduleOptions} value={moduleFilter || undefined} onChange={(value) => setModuleFilter(value || '')} />
            <Select
              allowClear
              placeholder="User role"
              style={{ width: 160 }}
              options={[
                { label: 'Customer', value: 'Customer' },
                { label: 'Officer', value: 'Officer' },
                { label: 'Admin', value: 'Admin' },
                { label: 'PanelWorkshop', value: 'PanelWorkshop' },
              ]}
              value={userRoleFilter || undefined}
              onChange={(value) => setUserRoleFilter(value || '')}
            />
            <Input placeholder="User ID" style={{ width: 220 }} value={userIdFilter} onChange={(event) => setUserIdFilter(event.target.value)} />
            </div>
            <div className="portal-dashboard-toolbar-main">
            <Button type="primary" onClick={refreshLogs} loading={loadingLogs}>Apply Filters</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportLogs} loading={exportingLogs}>Export PDF</Button>
            </div>
          </div>
        </Card>

        <Card className="portal-dashboard-card">
          <Table
            dataSource={logs}
            columns={logColumns}
            rowKey="logId"
            loading={loadingLogs}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
            locale={{ emptyText: <Empty description="No monitoring logs found for the selected filters." /> }}
          />
        </Card>
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={280} theme="light" style={{ boxShadow: '0 0 10px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' }}>
        <div className="logo-container">
          <img src="/assets/etiqalogo.png" alt="Etiqa Logo" style={{ height: 40 }} />
        </div>
        <div className="user-info">
          <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: '#FF6600' }} />
          <div className="user-details">
            <Text strong className="user-name">{currentAdmin?.fullName || currentAdmin?.FullName || 'Admin'}</Text>
            <Text type="secondary" className="user-email">{currentAdmin?.email || currentAdmin?.Email || 'System administrator'}</Text>
          </div>
        </div>
        <div className="sidebar-content">
          <Divider plain orientation="left">
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8 }}>
              MAIN MENU
            </Text>
          </Divider>
          <Menu mode="inline" selectedKeys={[String(selectedIndex)]} className="main-menu">
            <Menu.Item key="0" icon={<AreaChartOutlined />} onClick={() => setSelectedIndex(0)}>
              <span>Monitoring</span>
            </Menu.Item>
            <Menu.Item key="1" icon={<FileSearchOutlined />} onClick={() => setSelectedIndex(1)}>
              <span>Logs</span>
            </Menu.Item>
            <Menu.Item key="2" icon={<SafetyCertificateOutlined />} onClick={() => setSelectedIndex(2)}>
              <span>Operations</span>
            </Menu.Item>
          </Menu>
        </div>
        <div className="sign-out-container">
          <Button className="sign-out-button" icon={<LogoutOutlined />} block onClick={onSignOut}>Sign Out</Button>
        </div>
      </Sider>
      <Layout>
        <Content className="portal-dashboard-page">
          {selectedIndex === 0 ? renderDashboardContent() : null}
          {selectedIndex === 1 ? renderLogsContent() : null}
          {selectedIndex === 2 ? renderOperationsContent() : null}
        </Content>
      </Layout>
    </Layout>
  );
}

function SummaryRow({ label, value, tone }) {
  return (
    <div className="portal-dashboard-list-item portal-dashboard-list-item-soft">
      <div className="portal-dashboard-list-meta">
        <Text strong>{label}</Text>
      </div>
      <span className="portal-dashboard-status" style={{ background: `${tone}16`, color: tone }}>
        {value}
      </span>
    </div>
  );
}

function buildOperationsSummary({ claims = [], estimates = [], payments = [] }) {
  const pendingStatuses = new Set(['Pending Manual Review', 'Pending Customer Action', 'Customer Responded']);
  const approvedStatuses = new Set(['Approved']);
  const statusMap = new Map();

  claims.forEach((claim) => {
    const status = claim.status || 'Unknown';
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  return {
    totalClaims: claims.length,
    pendingClaims: claims.filter((claim) => pendingStatuses.has(claim.status)).length,
    approvedClaims: claims.filter((claim) => approvedStatuses.has(claim.status)).length,
    totalEstimates: estimates.length,
    stpApprovedEstimates: estimates.filter((estimate) => estimate.isStpApproved).length,
    totalPayments: payments.length,
    totalPaymentAmount: payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    paidPaymentAmount: payments
      .filter((payment) => String(payment.status || '').toLowerCase() === 'paid')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    statusRows: Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })),
  };
}

function createOperationalActivityLogs({ claims = [], estimates = [], payments = [] }) {
  return [
    ...claims.slice(0, 8).map((claim) => ({
      logId: `claim-${claim.id || claim.claimId}`,
      createdAt: claim.createdAt,
      module: 'Claims',
      action: claim.status || 'Claim activity',
      httpMethod: 'VIEW',
      path: `/Claim/${claim.id || claim.claimId || ''}`,
      userEmail: claim.customerEmail || claim.email || '',
      userRole: 'Customer',
      statusCode: 200,
      durationMs: 1,
      isSuccess: true,
    })),
    ...estimates.slice(0, 5).map((estimate) => ({
      logId: `estimate-${estimate.estimateId}`,
      createdAt: estimate.submittedAt,
      module: 'Workshop',
      action: estimate.status || 'Repair estimate',
      httpMethod: 'VIEW',
      path: `/Workshop/repair-estimates/${estimate.estimateId || ''}`,
      userEmail: estimate.workshopName || '',
      userRole: 'PanelWorkshop',
      statusCode: 200,
      durationMs: 1,
      isSuccess: true,
    })),
    ...payments.slice(0, 5).map((payment) => ({
      logId: `payment-${payment.paymentId}`,
      createdAt: payment.createdAt || payment.paidAt,
      module: 'Payments',
      action: payment.status || 'Payment activity',
      httpMethod: 'VIEW',
      path: `/Workshop/payments/${payment.paymentId || ''}`,
      userEmail: payment.workshopName || '',
      userRole: 'PanelWorkshop',
      statusCode: 200,
      durationMs: 1,
      isSuccess: true,
    })),
  ]
    .filter((item) => item.logId)
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
    .slice(0, 15);
}

function getClaimStatusColor(status) {
  if (status === 'Approved') return 'green';
  if (status === 'Rejected') return 'red';
  if (status === 'Pending Manual Review') return 'orange';
  if (status === 'Pending Customer Action') return 'gold';
  return 'blue';
}

function MetricCard({ label, value, subtitle, icon, accent, background }) {
  return (
    <Card className="portal-dashboard-stat portal-dashboard-stat-soft" style={{ background }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Space size={12} align="center">
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fffaf5',
              color: accent,
              border: '1px solid #f3d2b7',
            }}
          >
            {React.cloneElement(icon, { style: { fontSize: 20 } })}
          </span>
          <span className="portal-dashboard-stat-label">{label}</span>
        </Space>
        <Text className="portal-dashboard-stat-value">{value}</Text>
        <Text className="portal-dashboard-stat-subtitle">{subtitle}</Text>
      </Space>
    </Card>
  );
}

function buildMonitoringParams({ dateRange = [], module = null, userRole = null, userId = null, take = null } = {}) {
  const [fromDate, toDate] = Array.isArray(dateRange) ? dateRange : [];

  return {
    fromUtc: fromDate ? moment(fromDate).toISOString() : undefined,
    toUtc: toDate ? moment(toDate).toISOString() : undefined,
    module: module || undefined,
    userRole: userRole || undefined,
    userId: userId || undefined,
    take: take || undefined,
  };
}

function createMonitoringLogsPdf({ logs = [], currentAdmin, dateRange = [], moduleFilter, userRoleFilter, userIdFilter }) {
  const escapePdfText = (value) => String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

  const wrapText = (text, maxLength) => {
    const normalized = String(text ?? '').replace(/\s+/g, ' ').trim();

    if (!normalized) {
      return ['-'];
    }

    const words = normalized.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach((word) => {
      const nextLine = currentLine ? `${currentLine} ${word}` : word;

      if (nextLine.length <= maxLength) {
        currentLine = nextLine;
        return;
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      if (word.length > maxLength) {
        for (let index = 0; index < word.length; index += maxLength) {
          lines.push(word.slice(index, index + maxLength));
        }
        currentLine = '';
        return;
      }

      currentLine = word;
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length ? lines : ['-'];
  };

  const formatRange = () => {
    const [fromDate, toDate] = Array.isArray(dateRange) ? dateRange : [];

    if (fromDate && toDate && moment.isMoment(fromDate) && moment.isMoment(toDate)) {
      return `${fromDate.format('DD MMM YYYY HH:mm')} - ${toDate.format('DD MMM YYYY HH:mm')}`;
    }

    return 'All dates';
  };

  const lines = [
    'System Activity Logs',
    `Generated: ${moment().format('DD MMM YYYY, hh:mm A')}`,
    `Prepared by: ${currentAdmin?.fullName || currentAdmin?.FullName || currentAdmin?.email || currentAdmin?.Email || 'Admin'}`,
    `Date Range: ${formatRange()}`,
    `Module Filter: ${moduleFilter || 'All modules'}`,
    `Role Filter: ${userRoleFilter || 'All roles'}`,
    `User Filter: ${userIdFilter || 'All users'}`,
    `Total Logs: ${logs.length}`,
    '',
  ];

  if (!logs.length) {
    lines.push('No monitoring logs found for the selected filters.');
  } else {
    logs.forEach((log, index) => {
      lines.push(`Log ${index + 1}`);
      lines.push(`Time: ${log.createdAt ? moment(log.createdAt).format('DD MMM YYYY, hh:mm A') : 'Not available'}`);
      lines.push(`Module: ${log.module || 'Unknown'}`);
      lines.push(`Action: ${log.action || '-'}`);
      lines.push(`Method: ${log.httpMethod || 'GET'}`);
      lines.push(`Path: ${log.path || '-'}`);
      lines.push(`User: ${log.userEmail || 'System / anonymous'} (${log.userRole || 'No role'})`);
      lines.push(`Status: ${log.statusCode || 0} ${log.isSuccess ? '[Success]' : '[Failed]'}`);
      lines.push(`Duration: ${log.durationMs || 0} ms`);
      lines.push(`IP Address: ${log.ipAddress || '-'}`);

      if (log.queryString) {
        lines.push(...wrapText(`Query: ${log.queryString}`, 92));
      }

      if (log.errorMessage) {
        lines.push(...wrapText(`Error: ${log.errorMessage}`, 92));
      }

      lines.push('');
    });
  }

  const pageWidth = 595;
  const pageHeight = 842;
  const marginLeft = 40;
  const marginTop = 44;
  const lineHeight = 14;
  const fontSize = 10;
  const usableLinesPerPage = Math.floor((pageHeight - marginTop - 40) / lineHeight);
  const pageChunks = [];

  for (let index = 0; index < lines.length; index += usableLinesPerPage) {
    pageChunks.push(lines.slice(index, index + usableLinesPerPage));
  }

  const objects = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const fontObjectId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageObjectIds = [];

  pageChunks.forEach((pageLines) => {
    const contentLines = ['BT', `/F1 ${fontSize} Tf`];
    let y = pageHeight - marginTop;

    pageLines.forEach((line) => {
      contentLines.push(`1 0 0 1 ${marginLeft} ${y} Tm (${escapePdfText(line)}) Tj`);
      y -= lineHeight;
    });

    contentLines.push('ET');

    const stream = contentLines.join('\n');
    const contentObjectId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const pageObjectId = addObject(
      `<< /Type /Page /Parent PAGES_REF /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`
    );

    pageObjectIds.push(pageObjectId);
  });

  const pagesObjectId = addObject(
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`
  );

  pageObjectIds.forEach((pageObjectId) => {
    objects[pageObjectId - 1] = objects[pageObjectId - 1].replace('PAGES_REF', `${pagesObjectId} 0 R`);
  });

  const catalogObjectId = addObject(`<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((objectContent, index) => {
    offsets[index + 1] = pdf.length;
    pdf += `${index + 1} 0 obj\n${objectContent}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

export default AdminDashboard;

