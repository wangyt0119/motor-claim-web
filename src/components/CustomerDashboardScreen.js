import React, { useMemo } from 'react';
import { Alert, Button, Card, Col, Empty, List, Row, Space, Statistic, Tag, Typography } from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  HistoryOutlined,
  LineChartOutlined,
  PlusCircleOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;

function CustomerDashboardScreen({ currentUser, claims = [], coverages = [], onOpenSection }) {
  const sortedClaims = useMemo(
    () => [...claims].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()),
    [claims]
  );

  const activeClaims = useMemo(
    () => claims.filter((claim) => !['Approved', 'Rejected'].includes(claim.status)),
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

  const latestClaims = sortedClaims.slice(0, 3);
  const nextWorkshopBooking = workshopBookings[0] || null;

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ marginBottom: 6 }}>
            Welcome back, {currentUser?.fullName || currentUser?.FullName || 'Customer'}
          </Title>
          <Text type="secondary">
            Keep track of your claims, officer requests, payments, and workshop bookings in one place.
          </Text>
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
          />
        ) : (
          <Alert
            showIcon
            type="success"
            message="You are up to date"
            description="There are no customer actions waiting right now."
          />
        )}

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic title="Total Claims" value={claims.length} prefix={<FileTextOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic title="Active Claims" value={activeClaims.length} prefix={<ClockCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic title="Approved Claims" value={approvedClaims.length} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic title="My Coverages" value={coverages.length} prefix={<ToolOutlined />} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card
              title="Recent Claims"
              extra={
                <Button type="link" onClick={() => onOpenSection('history')}>
                  View all history
                </Button>
              }
              style={{ borderRadius: 12 }}
            >
              {latestClaims.length ? (
                <List
                  dataSource={latestClaims}
                  renderItem={(claim) => (
                    <List.Item
                      actions={[
                        <Button key="track" onClick={() => onOpenSection('track')}>
                          Open
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space wrap>
                            <Text strong>{claim.id}</Text>
                            <Tag color={getStatusColor(claim.status)}>{claim.status}</Tag>
                            <Tag color={claim.isStpApproved ? 'green' : 'orange'}>
                              {claim.isStpApproved ? 'STP Passed' : 'Manual Review'}
                            </Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={2}>
                            <Text type="secondary">{claim.type}</Text>
                            <Text type="secondary">
                              Submitted {moment(claim.date).format('DD MMM YYYY')}
                            </Text>
                            <Text type="secondary">
                              Vehicle: {claim.vehicleRegistration || 'Not available'}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty
                  description="No claims submitted yet"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button type="primary" icon={<PlusCircleOutlined />} onClick={() => onOpenSection('submit')}>
                    Submit First Claim
                  </Button>
                </Empty>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Card style={{ borderRadius: 12 }}>
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  <Text strong>Quick Actions</Text>
                  <Button icon={<PlusCircleOutlined />} block onClick={() => onOpenSection('submit')}>
                    Submit New Claim
                  </Button>
                  <Button icon={<LineChartOutlined />} block onClick={() => onOpenSection('track')}>
                    Track Claims
                  </Button>
                  <Button icon={<HistoryOutlined />} block onClick={() => onOpenSection('history')}>
                    Claim History
                  </Button>
                  <Button icon={<ToolOutlined />} block onClick={() => onOpenSection('panel-workshop')}>
                    Find Panel Workshop
                  </Button>
                </Space>
              </Card>

              <Card title="Next Workshop Booking" style={{ borderRadius: 12 }}>
                {nextWorkshopBooking ? (
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Text strong>{nextWorkshopBooking.workshopAppointment.workshopName}</Text>
                    <Text type="secondary">
                      {moment(nextWorkshopBooking.workshopAppointment.preferredDate).format('DD MMM YYYY')}
                    </Text>
                    <Text type="secondary">
                      {formatTimeRange(
                        nextWorkshopBooking.workshopAppointment.timeSlotStart,
                        nextWorkshopBooking.workshopAppointment.timeSlotEnd
                      )}
                    </Text>
                    <Text type="secondary">
                      {nextWorkshopBooking.workshopAppointment.workshopAddress || 'Address not available'}
                    </Text>
                    <Button icon={<CalendarOutlined />} onClick={() => onOpenSection('track')}>
                      Open Booking
                    </Button>
                  </Space>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No workshop booking yet" />
                )}
              </Card>
            </Space>
          </Col>
        </Row>
      </Space>
    </div>
  );
}

function getStatusColor(status) {
  switch ((status || '').toLowerCase()) {
    case 'approved':
      return 'green';
    case 'rejected':
      return 'red';
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
