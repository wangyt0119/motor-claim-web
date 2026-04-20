import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  DatePicker,
  Divider,
  Empty,
  Input,
  Layout,
  Menu,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
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
import {
  exportSystemMonitoringLogs,
  getSystemMonitoringDashboard,
  getSystemMonitoringLogs,
} from '../services/adminService';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function AdminDashboard({ currentAdmin, onSignOut }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dashboard, setDashboard] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [exportingLogs, setExportingLogs] = useState(false);
  const [dateRange, setDateRange] = useState([]);
  const [moduleFilter, setModuleFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');

  useEffect(() => {
    // Initial monitoring load
    refreshDashboard();
    refreshLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const { blob, fileName } = await exportSystemMonitoringLogs(
        buildMonitoringParams({
          dateRange,
          module: moduleFilter || null,
          userRole: userRoleFilter || null,
          userId: userIdFilter || null,
          take: 1000,
        })
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success('Monitoring logs exported.');
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Unable to export monitoring logs.');
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

  const successRate = useMemo(() => {
    const total = Number(dashboard?.totalRequests || 0);
    const success = Number(dashboard?.successfulRequests || 0);
    return total > 0 ? Math.round((success / total) * 100) : 0;
  }, [dashboard]);

  const topModule = useMemo(() => {
    const items = dashboard?.moduleUsage || [];
    if (!items.length) {
      return null;
    }

    return [...items].sort((left, right) => Number(right.requestCount || 0) - Number(left.requestCount || 0))[0];
  }, [dashboard]);

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

    if (!dashboard) {
      return <Empty description="Monitoring data unavailable." />;
    }

    return (
      <div className="portal-dashboard-stack">
        <div className="portal-dashboard-hero">
          <div className="portal-dashboard-hero-content">
            <span className="portal-dashboard-kicker">Admin Control</span>
            <Title level={2} className="portal-dashboard-title">
            Welcome back, {currentAdmin?.fullName || currentAdmin?.FullName || 'Admin'}
            </Title>
            <Text className="portal-dashboard-description">
              Review live usage patterns, request health, and recent system activity across the platform in one monitoring dashboard.
            </Text>

            <div className="portal-dashboard-chip-row">
              <div className="portal-dashboard-chip">
                <span className="portal-dashboard-chip-label">Success Rate</span>
                <span className="portal-dashboard-chip-value">{successRate}%</span>
              </div>
              <div className="portal-dashboard-chip">
                <span className="portal-dashboard-chip-label">Top Module</span>
                <span className="portal-dashboard-chip-value">{topModule?.module || 'N/A'}</span>
              </div>
              <div className="portal-dashboard-chip">
                <span className="portal-dashboard-chip-label">Live Logs</span>
                <span className="portal-dashboard-chip-value">{(dashboard?.recentLogs || []).length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="portal-dashboard-grid">
          <div className="portal-dashboard-span-3">
            <MetricCard
              label="Total Requests"
              value={dashboard.totalRequests}
              subtitle="All traffic in range"
              icon={<AreaChartOutlined />}
              accent="#f97316"
              background="linear-gradient(135deg, #fff3e8 0%, #ffe2ce 100%)"
            />
          </div>
          <div className="portal-dashboard-span-3">
            <MetricCard
              label="Successful Requests"
              value={dashboard.successfulRequests}
              subtitle="Healthy responses"
              icon={<SafetyCertificateOutlined />}
              accent="#16a34a"
              background="linear-gradient(135deg, #edfdf3 0%, #d6f7e1 100%)"
            />
          </div>
          <div className="portal-dashboard-span-3">
            <MetricCard
              label="Failed Requests"
              value={dashboard.failedRequests}
              subtitle="Errors to review"
              icon={<FileSearchOutlined />}
              accent="#ef4444"
              background="linear-gradient(135deg, #fff0f0 0%, #ffdede 100%)"
            />
          </div>
          <div className="portal-dashboard-span-3">
            <MetricCard
              label="Average Duration"
              value={`${Math.round(dashboard.averageDurationMs)} ms`}
              subtitle="Request speed"
              icon={<ClockCircleOutlined />}
              accent="#7c3aed"
              background="linear-gradient(135deg, #f6efff 0%, #ecdeff 100%)"
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
                    {(dashboard.recentLogs || []).length} logs
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

              {(dashboard.moduleUsage || []).length ? (
                <Table
                  dataSource={dashboard.moduleUsage}
                  columns={[
                    { title: 'Module', dataIndex: 'module', key: 'module' },
                    { title: 'Request Count', dataIndex: 'requestCount', key: 'requestCount' },
                  ]}
                  rowKey="module"
                  pagination={false}
                />
              ) : (
                <Empty className="portal-dashboard-empty" description="No module usage data yet." />
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
            dataSource={dashboard.recentLogs || []}
            columns={logColumns}
            rowKey="logId"
            pagination={{ pageSize: 8 }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </div>
    );
  }

  function renderLogsContent() {
    return (
      <div className="portal-dashboard-stack">
        <div>
          <Title level={2} style={{ marginBottom: 6 }}>Activity Logs</Title>
          <Text type="secondary">Filter system logs by date, module, role, or user to investigate usage and failures.</Text>
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
            <Button icon={<DownloadOutlined />} onClick={handleExportLogs} loading={exportingLogs}>Export CSV</Button>
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
          </Menu>
        </div>
        <div className="sign-out-container">
          <Button className="sign-out-button" icon={<LogoutOutlined />} block onClick={onSignOut}>Sign Out</Button>
        </div>
      </Sider>
      <Layout>
        <Header className="portal-dashboard-header" />
        <Content className="portal-dashboard-page">
          {selectedIndex === 0 ? renderDashboardContent() : null}
          {selectedIndex === 1 ? renderLogsContent() : null}
        </Content>
      </Layout>
    </Layout>
  );
}

function MetricCard({ label, value, subtitle, icon, accent, background }) {
  return (
    <Card className="portal-dashboard-stat" style={{ background }}>
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
              background: '#fff',
              color: accent,
              boxShadow: '0 10px 22px rgba(255,255,255,0.46)',
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

export default AdminDashboard;

