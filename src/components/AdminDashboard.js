import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  DatePicker,
  Empty,
  Input,
  Layout,
  Select,
  Space,
  Statistic,
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
import {
  exportSystemMonitoringLogs,
  getSystemMonitoringDashboard,
  getSystemMonitoringLogs,
} from '../services/adminService';
import ProfileScreen from './ProfileScreen';

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

  function buildNavItem({ index, title, subtitle }) {
    return (
      <div
        style={{
          padding: '12px 16px',
          margin: '6px 12px',
          borderRadius: 8,
          cursor: 'pointer',
          background: selectedIndex === index ? '#FF6600' : 'transparent',
          color: selectedIndex === index ? '#fff' : 'inherit',
        }}
        onClick={() => setSelectedIndex(index)}
      >
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12, opacity: selectedIndex === index ? 0.9 : 0.65 }}>{subtitle}</div>
      </div>
    );
  }

  function renderDashboardContent() {
    if (loadingDashboard && !dashboard) {
      return <Card loading style={{ borderRadius: 12 }} />;
    }

    if (!dashboard) {
      return <Empty description="Monitoring data unavailable." />;
    }

    return (
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ marginBottom: 6 }}>System Monitoring</Title>
          <Text type="secondary">Review live usage patterns, request health, and recent system activity across the platform.</Text>
        </div>

        <Space wrap size={16}>
          <Card style={{ borderRadius: 12, minWidth: 220 }}>
            <Statistic title="Total Requests" value={dashboard.totalRequests} prefix={<AreaChartOutlined />} />
          </Card>
          <Card style={{ borderRadius: 12, minWidth: 220 }}>
            <Statistic title="Successful Requests" value={dashboard.successfulRequests} valueStyle={{ color: '#16a34a' }} prefix={<SafetyCertificateOutlined />} />
          </Card>
          <Card style={{ borderRadius: 12, minWidth: 220 }}>
            <Statistic title="Failed Requests" value={dashboard.failedRequests} valueStyle={{ color: '#dc2626' }} prefix={<FileSearchOutlined />} />
          </Card>
          <Card style={{ borderRadius: 12, minWidth: 220 }}>
            <Statistic title="Average Duration" value={Math.round(dashboard.averageDurationMs)} suffix="ms" prefix={<ClockCircleOutlined />} />
          </Card>
        </Space>

        <Card
          title="Module Usage"
          extra={<Button icon={<ReloadOutlined />} onClick={refreshDashboard} loading={loadingDashboard}>Refresh</Button>}
          style={{ borderRadius: 12 }}
        >
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
            <Empty description="No module usage data yet." />
          )}
        </Card>

        <Card title="Recent Activity" style={{ borderRadius: 12 }}>
          <Table
            dataSource={dashboard.recentLogs || []}
            columns={logColumns}
            rowKey="logId"
            pagination={{ pageSize: 8 }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </Space>
    );
  }

  function renderLogsContent() {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ marginBottom: 6 }}>Activity Logs</Title>
          <Text type="secondary">Filter system logs by date, module, role, or user to investigate usage and failures.</Text>
        </div>

        <Card style={{ borderRadius: 12 }}>
          <Space wrap size={12}>
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
            <Button type="primary" onClick={refreshLogs} loading={loadingLogs}>Apply Filters</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportLogs} loading={exportingLogs}>Export CSV</Button>
          </Space>
        </Card>

        <Card style={{ borderRadius: 12 }}>
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
      </Space>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={280} theme="light" style={{ boxShadow: '0 0 10px rgba(0,0,0,0.08)' }}>
        <div style={{ padding: '24px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <img src="/assets/etiqalogo.png" alt="Etiqa Logo" style={{ height: 40 }} />
        </div>
        <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
          <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: '#FF6600' }} />
          <div style={{ marginLeft: 12 }}>
            <Text strong style={{ display: 'block' }}>{currentAdmin?.fullName || currentAdmin?.FullName || 'Admin'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{currentAdmin?.email || currentAdmin?.Email || 'System administrator'}</Text>
          </div>
        </div>
        <div style={{ paddingTop: 12 }}>
          {buildNavItem({ index: 0, title: 'Monitoring', subtitle: 'System health and usage' })}
          {buildNavItem({ index: 1, title: 'Logs', subtitle: 'Activity logs and export' })}
          {buildNavItem({ index: 2, title: 'Profile', subtitle: 'Your admin account details' })}
        </div>
        <div style={{ padding: 16, marginTop: 'auto' }}>
          <Button icon={<LogoutOutlined />} block onClick={onSignOut}>Sign Out</Button>
        </div>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>Admin Portal</Title>
        </Header>
        <Content style={{ padding: 24 }}>
          {selectedIndex === 0 ? renderDashboardContent() : null}
          {selectedIndex === 1 ? renderLogsContent() : null}
          {selectedIndex === 2 ? <ProfileScreen heading="Admin Profile" description="Review and update your administrator account details." /> : null}
        </Content>
      </Layout>
    </Layout>
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
