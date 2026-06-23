import React, { useMemo } from 'react';
import { Alert, Button, Card, Empty, Space, Tag, Typography } from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  HistoryOutlined,
  LineChartOutlined,
  PlusCircleOutlined,
  RobotOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import '../styles/MainScreen.css';

const { Title, Text } = Typography;

function CustomerDashboardScreen({ currentUser, claims = [], coverages = [], onOpenSection }) {
  const sortedClaims = useMemo(
    () => [...claims].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()),
    [claims]
  );

  const activeClaims = useMemo(
    () => claims.filter((claim) => !['Approved', 'Rejected', 'Withdrawn'].includes(claim.status)),
    [claims]
  );

  const pendingCustomerActions = useMemo(
    () => claims.filter((claim) => claim.status === 'Pending Customer Action'),
    [claims]
  );

  const approvedClaims = useMemo(
    () => claims.filter((claim) => claim.status === 'Approved'),
    [claims]
  );

  const workshopBookings = useMemo(
    () =>
      claims
        .filter((claim) => claim.workshopAppointment?.preferredDate)
        .sort(
          (left, right) =>
            new Date(left.workshopAppointment.preferredDate).getTime() -
            new Date(right.workshopAppointment.preferredDate).getTime()
        ),
    [claims]
  );

  const latestClaims = sortedClaims.slice(0, 4);
  const nextWorkshopBooking = workshopBookings[0] || null;

  return (
    <div className="portal-dashboard-page">
      <div className="portal-dashboard-stack">
        <div className="portal-dashboard-hero portal-dashboard-theme-soft">
          <div className="portal-dashboard-hero-content">
            <span className="portal-dashboard-kicker portal-dashboard-kicker-soft">Customer Home</span>
            <Title level={2} className="portal-dashboard-title">
              Welcome back, {currentUser?.fullName || currentUser?.FullName || 'Customer'}
            </Title>
            <Text className="portal-dashboard-description">
              Keep track of your claims, officer requests, and workshop bookings in one bright and easy dashboard.
            </Text>

            <div className="portal-dashboard-chip-row">
              <div className="portal-dashboard-chip portal-dashboard-chip-soft">
                <span className="portal-dashboard-chip-label">Total Claims</span>
                <span className="portal-dashboard-chip-value">{claims.length}</span>
              </div>
              <div className="portal-dashboard-chip portal-dashboard-chip-soft">
                <span className="portal-dashboard-chip-label">Need Action</span>
                <span className="portal-dashboard-chip-value">{pendingCustomerActions.length}</span>
              </div>
              <div className="portal-dashboard-chip portal-dashboard-chip-soft">
                <span className="portal-dashboard-chip-label">Approved</span>
                <span className="portal-dashboard-chip-value">{approvedClaims.length}</span>
              </div>
            </div>
          </div>
        </div>

        {pendingCustomerActions.length ? (
          <Alert
            showIcon
            type="warning"
            message="Action needed"
            description={`${pendingCustomerActions.length} claim(s) need your update. Open Track Claims to upload the requested documents or rewrite the requested details.`}
            action={
              <Button size="small" type="primary" onClick={() => onOpenSection('track')}>
                Open Track Claims
              </Button>
            }
            style={{ borderRadius: 18, border: '1px solid rgba(255, 193, 7, 0.28)', background: '#fff9e8' }}
          />
        ) : (
          <Alert
            showIcon
            type="success"
            message="You are up to date"
            description="There are no actions waiting right now."
            style={{ borderRadius: 18, border: '1px solid rgba(34, 197, 94, 0.22)', background: '#f0fdf4' }}
          />
        )}

        <div className="portal-dashboard-grid">
          <ColWrapper spanClass="portal-dashboard-span-3">
            <StatCard
              label="Total Claims"
              value={claims.length}
              subtitle="Everything submitted so far"
              icon={<FileTextOutlined />}
              background="#fff7ed"
              accent="#f97316"
            />
          </ColWrapper>
          <ColWrapper spanClass="portal-dashboard-span-3">
            <StatCard
              label="Active Claims"
              value={activeClaims.length}
              subtitle="Still in progress"
              icon={<ClockCircleOutlined />}
              background="#fff7ed"
              accent="#ea580c"
            />
          </ColWrapper>
          <ColWrapper spanClass="portal-dashboard-span-3">
            <StatCard
              label="Approved Claims"
              value={approvedClaims.length}
              subtitle="Claims already approved"
              icon={<CheckCircleOutlined />}
              background="#fff7ed"
              accent="#ea580c"
            />
          </ColWrapper>
          <ColWrapper spanClass="portal-dashboard-span-3">
            <StatCard
              label="My Coverages"
              value={coverages.length}
              subtitle="Policies linked to your account"
              icon={<ToolOutlined />}
              background="#fff7ed"
              accent="#ea580c"
            />
          </ColWrapper>
        </div>

        <div className="portal-dashboard-grid">
          <ColWrapper spanClass="portal-dashboard-span-7">
            <Card className="portal-dashboard-card">
              <div className="portal-dashboard-card-header">
                <div>
                  <Title level={4} className="portal-dashboard-card-title">Recent Claims</Title>
                  <Text className="portal-dashboard-card-subtitle">Your newest submissions and their latest status</Text>
                </div>
                <Button type="link" onClick={() => onOpenSection('track')}>
                  View All Claim
                </Button>
              </div>

              {latestClaims.length ? (
                <div className="portal-dashboard-list">
                  {latestClaims.map((claim) => (
                    <div key={claim.id} className="portal-dashboard-list-item">
                      <div className="portal-dashboard-list-meta">
                        <Text strong>{claim.id}</Text>
                        <Text type="secondary">{claim.type || 'Vehicle damage claim'}</Text>
                        <Text type="secondary">
                          Submitted {moment(claim.date).format('DD MMM YYYY')} | Vehicle: {claim.vehicleRegistration || 'Not available'}
                        </Text>
                      </div>
                      <Space wrap>
                        <Tag color={getStatusColor(claim.status)}>{claim.status}</Tag>
                        <Tag color={claim.isStpApproved ? 'green' : 'orange'}>
                          {claim.isStpApproved ? 'Approved' : 'Under Review'}
                        </Tag>
                        <Button onClick={() => onOpenSection('track')}>Open</Button>
                      </Space>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty className="portal-dashboard-empty" description="No claims submitted yet" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                  <Button type="primary" icon={<PlusCircleOutlined />} onClick={() => onOpenSection('submit')}>
                    Submit First Claim
                  </Button>
                </Empty>
              )}
            </Card>
          </ColWrapper>

          <ColWrapper spanClass="portal-dashboard-span-5">
            <div className="portal-dashboard-stack">
              <Card className="portal-dashboard-card">
                <div className="portal-dashboard-card-header">
                  <div>
                    <Title level={4} className="portal-dashboard-card-title">Quick Actions</Title>
                    <Text className="portal-dashboard-card-subtitle">Jump straight to the task you need</Text>
                  </div>
                </div>

                <div className="portal-dashboard-action-grid">
                  <Button className="portal-dashboard-action-button" type="primary" icon={<PlusCircleOutlined />} block onClick={() => onOpenSection('submit')}>
                    Submit New Claim
                  </Button>
                  <Button className="portal-dashboard-action-button" icon={<LineChartOutlined />} block onClick={() => onOpenSection('track')}>
                    Track Claims
                  </Button>
                  <Button className="portal-dashboard-action-button" icon={<RobotOutlined />} block onClick={() => onOpenSection('damage-assessment')}>
                    AI Damage Assessment
                  </Button>
                  <Button className="portal-dashboard-action-button" icon={<HistoryOutlined />} block onClick={() => onOpenSection('history')}>
                    Claim History
                  </Button>
                  <Button className="portal-dashboard-action-button" icon={<ToolOutlined />} block onClick={() => onOpenSection('panel-workshop')}>
                    Find Panel Workshop
                  </Button>
                </div>
              </Card>

              <Card className="portal-dashboard-card">
                <div className="portal-dashboard-card-header">
                  <div>
                    <Title level={4} className="portal-dashboard-card-title">Next Workshop Booking</Title>
                    <Text className="portal-dashboard-card-subtitle">Your upcoming service appointment at a glance</Text>
                  </div>
                </div>

                {nextWorkshopBooking ? (
                  <div className="portal-dashboard-highlight">
                    <Text strong>{nextWorkshopBooking.workshopAppointment.workshopName}</Text>
                    <Text type="secondary" style={{ display: 'block', marginTop: 6 }}>
                      {moment(nextWorkshopBooking.workshopAppointment.preferredDate).format('DD MMM YYYY')}
                    </Text>
                    <Text type="secondary" style={{ display: 'block', marginTop: 6 }}>
                      {formatTimeRange(
                        nextWorkshopBooking.workshopAppointment.timeSlotStart,
                        nextWorkshopBooking.workshopAppointment.timeSlotEnd
                      )}
                    </Text>
                    <Text type="secondary" style={{ display: 'block', margin: '6px 0 14px' }}>
                      {nextWorkshopBooking.workshopAppointment.workshopAddress || 'Address not available'}
                    </Text>
                    <Button icon={<CalendarOutlined />} onClick={() => onOpenSection('track')}>
                      Open Booking
                    </Button>
                  </div>
                ) : (
                  <Empty className="portal-dashboard-empty" image={Empty.PRESENTED_IMAGE_SIMPLE} description="No workshop booking yet" />
                )}
              </Card>
            </div>
          </ColWrapper>
        </div>
      </div>
    </div>
  );
}

function ColWrapper({ children, spanClass }) {
  return <div className={spanClass}>{children}</div>;
}

function StatCard({ label, value, subtitle, icon, background, accent }) {
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

function getStatusColor(status) {
  switch ((status || '').toLowerCase()) {
    case 'approved':
      return 'green';
    case 'rejected':
      return 'red';
    case 'withdrawn':
      return 'default';
    case 'pending customer action':
      return 'purple';
    case 'customer responded':
      return 'blue';
    case 'pending manual review':
      return 'orange';
    default:
      return 'gold';
  }
}

function formatTimeRange(start, end) {
  if (!start || !end) {
    return 'Not available';
  }

  const normalize = (value) => String(value).slice(0, 5);
  return `${moment(normalize(start), 'HH:mm').format('hh:mm A')} - ${moment(normalize(end), 'HH:mm').format('hh:mm A')}`;
}

export default CustomerDashboardScreen;
