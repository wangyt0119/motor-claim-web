import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Empty,
  Input,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Timeline,
  Typography,
  message,
} from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  NotificationOutlined,
  ReloadOutlined,
  SearchOutlined,
  ToolOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { getAllWorkshopPayments, getMyWorkshopPayments } from '../services/workshopService';

const { Title, Text } = Typography;

function NotificationTimelineScreen({ scope = 'customer', claims = [], currentUser = null }) {
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(scope === 'officer' || scope === 'workshop');
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    let cancelled = false;

    async function loadPayments() {
      if (scope !== 'officer' && scope !== 'workshop') {
        setLoadingPayments(false);
        return;
      }

      setLoadingPayments(true);
      try {
        const result = scope === 'workshop' ? await getMyWorkshopPayments() : await getAllWorkshopPayments();
        if (!cancelled) {
          setPayments(Array.isArray(result) ? result.filter(Boolean) : []);
        }
      } catch (error) {
        if (!cancelled) {
          message.error(
            error?.response?.data?.message ||
              error?.response?.data?.title ||
              (typeof error?.response?.data === 'string' ? error.response.data : null) ||
              error?.message ||
              'Unable to load notification-related payment records.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPayments(false);
        }
      }
    }

    loadPayments();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const entries = useMemo(
    () => buildNotificationEntries({ scope, claims, payments, currentUser }),
    [claims, currentUser, payments, scope]
  );

  const typeOptions = useMemo(
    () => ['All', ...new Set(entries.map((entry) => entry.type).filter(Boolean))],
    [entries]
  );

  const filteredEntries = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesType = typeFilter === 'All' || entry.type === typeFilter;
      if (!matchesType) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        entry.claimId,
        entry.subject,
        entry.preview,
        entry.audience,
        entry.type,
        entry.channel,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [entries, searchText, typeFilter]);

  const summary = useMemo(() => {
    const paymentRelated = entries.filter((entry) => entry.type === 'Payment').length;
    const workshopRelated = entries.filter((entry) =>
      ['Workshop Booking', 'Quotation', 'Workshop Review'].includes(entry.type)
    ).length;
    const customerRelated = entries.filter((entry) =>
      ['Claim Submitted', 'Claim Decision', 'Customer Action', 'Customer Response'].includes(entry.type)
    ).length;

    return {
      total: entries.length,
      paymentRelated,
      workshopRelated,
      customerRelated,
    };
  }, [entries]);

  const config = getScopeConfig(scope);

  return (
    <div className="portal-dashboard-stack">
      <Card
        className="portal-dashboard-card"
        style={{ borderRadius: 20, border: '1px solid #e5e7eb', background: '#ffffff' }}
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Text type="secondary" style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 }}>
            {config.kicker}
          </Text>
          <Title level={2} style={{ margin: 0 }}>
            {config.title}
          </Title>
          <Text type="secondary">{config.description}</Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Built from real backend claim, workshop, and payment records.
          </Text>
        </Space>
      </Card>

      <div className="portal-dashboard-grid">
        <div className="portal-dashboard-span-3">
          <Card className="portal-dashboard-stat">
            <Statistic title="All Events" value={summary.total} prefix={<NotificationOutlined />} />
          </Card>
        </div>
        <div className="portal-dashboard-span-3">
          <Card className="portal-dashboard-stat">
            <Statistic title="Claims" value={summary.customerRelated} prefix={<BellOutlined />} />
          </Card>
        </div>
        <div className="portal-dashboard-span-3">
          <Card className="portal-dashboard-stat">
            <Statistic title="Workshop" value={summary.workshopRelated} prefix={<ToolOutlined />} />
          </Card>
        </div>
        <div className="portal-dashboard-span-3">
          <Card className="portal-dashboard-stat">
            <Statistic title="Payments" value={summary.paymentRelated} prefix={<DollarOutlined />} />
          </Card>
        </div>
      </div>

      <Card className="portal-dashboard-card">
        <div className="portal-dashboard-toolbar" style={{ marginBottom: 16 }}>
          <div className="portal-dashboard-toolbar-main">
            <Input
              allowClear
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              prefix={<SearchOutlined />}
              placeholder="Search claim id, event, audience or type"
              style={{ width: 380 }}
            />
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 210 }}
              options={typeOptions.map((type) => ({ label: type, value: type }))}
            />
          </div>
          <div className="portal-dashboard-toolbar-main">
            <Badge color="#2563eb" text={`${filteredEntries.length} shown`} />
            <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        </div>

        {loadingPayments ? (
          <div style={{ textAlign: 'center', padding: '56px 0' }}>
            <Spin size="large" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <Empty description="No real notification events were found for the current filters." />
        ) : scope === 'officer' ? (
          <Table
            rowKey="id"
            dataSource={filteredEntries}
            pagination={{ pageSize: 8 }}
            columns={[
              {
                title: 'Time',
                dataIndex: 'occurredAt',
                key: 'occurredAt',
                width: 170,
                render: (value) => formatDateTime(value),
              },
              {
                title: 'Event',
                key: 'event',
                width: 300,
                render: (_, entry) => (
                  <Space direction="vertical" size={2}>
                    <Text strong>{entry.subject}</Text>
                    <Text type="secondary">{entry.preview}</Text>
                  </Space>
                ),
              },
              {
                title: 'Claim',
                dataIndex: 'claimId',
                key: 'claimId',
                width: 180,
                render: (value) => value || 'Not linked',
              },
              {
                title: 'Audience',
                dataIndex: 'audience',
                key: 'audience',
                width: 180,
              },
              {
                title: 'Type',
                dataIndex: 'type',
                key: 'type',
                width: 150,
                render: (value) => <Tag color={getTypeColor(value)}>{value}</Tag>,
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                width: 120,
                render: (value) => <Tag>{value}</Tag>,
              },
            ]}
          />
        ) : (
          <Timeline
            items={filteredEntries.map((entry) => ({
              color: getTimelineColor(entry.type),
              dot: getTimelineDot(entry.type),
              children: (
                <Card
                  size="small"
                  style={{ borderRadius: 16, borderColor: '#e5e7eb', marginBottom: 8, background: '#ffffff' }}
                >
                  <Space direction="vertical" size={6} style={{ width: '100%' }}>
                    <Space wrap>
                      <Tag color={getTypeColor(entry.type)}>{entry.type}</Tag>
                      <Tag>{entry.status}</Tag>
                    </Space>
                    <Text strong style={{ fontSize: 16 }}>{entry.subject}</Text>
                    <Text>{entry.preview}</Text>
                    <Space wrap size={[16, 8]}>
                      <Text type="secondary">Claim: {entry.claimId || 'Not linked'}</Text>
                      <Text type="secondary">Audience: {entry.audience}</Text>
                      <Text type="secondary">{formatDateTime(entry.occurredAt)}</Text>
                    </Space>
                  </Space>
                </Card>
              ),
            }))}
          />
        )}
      </Card>
    </div>
  );
}

function buildNotificationEntries({ scope, claims, payments, currentUser }) {
  const entries = [];

  if (scope === 'customer' || scope === 'officer') {
    claims.forEach((claim) => {
      addEntry(entries, {
        id: `claim-submitted-${claim.id}`,
        occurredAt: claim.createdAt || claim.date,
        type: 'Claim Submitted',
        claimId: claim.id,
        audience: scope === 'customer' ? currentUser?.email || 'Your account' : 'Customer',
        subject: `Claim ${claim.id} submitted`,
        preview: `${claim.type || 'Motor claim'} was submitted and is now under review.`,
        details: claim.incidentDescription || 'No incident description provided.',
      });

      addEntry(entries, {
        id: `claim-request-info-${claim.id}`,
        occurredAt: claim.requestedAt,
        type: 'Customer Action',
        claimId: claim.id,
        audience: scope === 'customer' ? currentUser?.email || 'Your account' : 'Customer',
        subject: `More information requested for ${claim.id}`,
        preview: claim.requestedItems?.length
          ? `Requested items: ${claim.requestedItems.join(', ')}.`
          : 'The claim was moved to pending customer action.',
        details: claim.officerDecisionNote || 'No additional note provided.',
      });

      addEntry(entries, {
        id: `claim-response-${claim.id}`,
        occurredAt: claim.respondedAt,
        type: 'Customer Response',
        claimId: claim.id,
        audience: scope === 'customer' ? 'Claims team' : 'Officer review queue',
        subject: `Customer response submitted for ${claim.id}`,
        preview: claim.customerResponseNote || 'Customer uploaded or submitted a response.',
        details: claim.customerResponseNote || 'No response note provided.',
      });

      if (claim.decidedAt && ['Approved', 'Rejected'].includes(claim.status)) {
        addEntry(entries, {
          id: `claim-decision-${claim.id}`,
          occurredAt: claim.decidedAt,
          type: 'Claim Decision',
          claimId: claim.id,
          audience: scope === 'customer' ? currentUser?.email || 'Your account' : 'Customer',
          subject: `Claim ${claim.id} ${claim.status.toLowerCase()}`,
          preview: claim.officerDecisionNote || `Claim was ${formatDecisionStatus(claim.status, scope)}.`,
          details: claim.officerDecisionNote || `The claim decision recorded was ${claim.status}.`,
        });
      }

      const appointment = claim.workshopAppointment;
      if (appointment?.createdAt && (scope === 'customer' || scope === 'officer' || scope === 'workshop')) {
        addEntry(entries, {
          id: `workshop-booking-${claim.id}-${appointment.appointmentId || 'booking'}`,
          occurredAt: appointment.createdAt,
          type: 'Workshop Booking',
          claimId: claim.id,
          audience:
            scope === 'workshop'
              ? appointment.workshopName || 'Workshop account'
              : scope === 'customer'
                ? currentUser?.email || 'Your account'
                : appointment.workshopName || 'Workshop / Customer',
          subject: `Workshop booking recorded for ${claim.id}`,
          preview: `${appointment.workshopName || 'Panel workshop'} on ${appointment.preferredDate ? moment(appointment.preferredDate).format('DD MMM YYYY') : 'scheduled date not available'}.`,
          details: `${appointment.workshopAddress || 'Address not available'} | ${appointment.status || 'Pending'}`,
        });
      }

      const estimate = claim.workshopRepairEstimate;
      if (estimate?.submittedAt && (scope === 'customer' || scope === 'officer' || scope === 'workshop')) {
        addEntry(entries, {
          id: `quotation-submitted-${claim.id}-${estimate.estimateId || 'quotation'}`,
          occurredAt: estimate.submittedAt,
          type: 'Quotation',
          claimId: claim.id,
          audience:
            scope === 'workshop'
              ? estimate.workshopName || 'Workshop account'
              : scope === 'customer'
                ? currentUser?.email || 'Your account'
                : estimate.workshopName || 'Customer / Officer',
          subject: `Quotation submitted for ${claim.id}`,
          preview: `Quotation total RM ${Number(estimate.totalAmount || 0).toFixed(2)}.`,
          details: estimate.remarks || estimate.reviewNote || 'Quotation submitted by workshop.',
        });
      }

      if (estimate?.reviewedAt) {
        addEntry(entries, {
          id: `quotation-reviewed-${claim.id}-${estimate.estimateId || 'quotation'}`,
          occurredAt: estimate.reviewedAt,
          type: 'Workshop Review',
          claimId: claim.id,
          audience:
            scope === 'workshop'
              ? estimate.workshopName || 'Workshop account'
              : scope === 'customer'
                ? currentUser?.email || 'Your account'
                : estimate.workshopName || 'Workshop',
          subject: `Quotation review updated for ${claim.id}`,
          preview: formatQuotationPreview(estimate, scope),
          details: estimate.reviewNote || 'Quotation review completed.',
        });
      }

      if (scope === 'customer' && claim.paymentDate) {
        addEntry(entries, {
          id: `customer-payment-${claim.id}`,
          occurredAt: claim.paymentDate,
          type: 'Payment',
          claimId: claim.id,
          audience: currentUser?.email || 'Your account',
          subject: `Claim payment update for ${claim.id}`,
          preview: `${claim.paymentStatus || 'Payment updated'}${claim.paymentReference ? ` | Ref ${claim.paymentReference}` : ''}.`,
          details: claim.paymentMethod || 'Payment details were updated on the claim.',
        });
      }
    });
  }

  if (scope === 'officer' || scope === 'workshop') {
    payments.forEach((payment) => {
      addEntry(entries, {
        id: `workshop-payment-${payment.paymentId || payment.claimId}`,
        occurredAt: payment.paidAt || payment.createdAt,
        type: 'Payment',
        claimId: payment.claimId,
        audience: scope === 'workshop' ? payment.workshopName || 'Workshop account' : payment.workshopName || 'Workshop',
        subject: `Workshop payment recorded for ${payment.claimId || 'claim'}`,
        preview: `RM ${Number(payment.amount || 0).toFixed(2)} | ${payment.status || 'Status unavailable'} | ${payment.provider || 'Provider unavailable'}.`,
        details: payment.providerReference || payment.failureReason || payment.bankNameSnapshot || 'Workshop payment record created in backend.',
      });
    });
  }

  return entries.sort((left, right) => new Date(right.occurredAt || 0) - new Date(left.occurredAt || 0));
}

function addEntry(entries, entry) {
  if (!entry?.occurredAt) {
    return;
  }

  entries.push({
    status: 'Recorded',
    ...entry,
  });
}

function getScopeConfig(scope) {
  switch (scope) {
    case 'officer':
      return {
        kicker: 'Officer Audit',
        title: 'Notification Audit',
        description: 'Review clean workflow events across claims, workshop actions, and payment records.',
      };
    case 'workshop':
      return {
        kicker: 'Workshop Inbox',
        title: 'Workshop Notifications',
        description: 'Track booking, quotation, review, and payment updates tied to your workshop account.',
      };
    case 'customer':
    default:
      return {
        kicker: 'Customer History',
        title: 'Notification History',
        description: 'See a clear claim timeline built from your real backend claim records.',
      };
  }
}

function formatDecisionStatus(status, scope) {
  if (scope !== 'officer' && String(status || '').toLowerCase().includes('stp')) {
    return 'approved';
  }

  return String(status || '').toLowerCase();
}

function formatQuotationPreview(estimate, scope) {
  const status = String(estimate?.status || '').trim();
  const normalized = status.toLowerCase();

  if (scope !== 'officer' && (normalized === 'stpapproved' || normalized === 'stp approved')) {
    return 'Quotation approved.';
  }

  if (!status) {
    return 'Quotation status updated.';
  }

  return `${status} quotation update.`;
}

function getTypeColor(type) {
  switch (type) {
    case 'Claim Submitted':
      return 'blue';
    case 'Claim Decision':
      return 'green';
    case 'Customer Action':
      return 'orange';
    case 'Customer Response':
      return 'cyan';
    case 'Workshop Booking':
      return 'purple';
    case 'Quotation':
      return 'magenta';
    case 'Workshop Review':
      return 'gold';
    case 'Payment':
      return 'success';
    default:
      return 'default';
  }
}

function getTimelineColor(type) {
  switch (type) {
    case 'Claim Decision':
      return 'green';
    case 'Customer Action':
      return 'orange';
    case 'Payment':
      return 'green';
    default:
      return 'blue';
  }
}

function getTimelineDot(type) {
  switch (type) {
    case 'Claim Decision':
      return <CheckCircleOutlined style={{ color: '#16a34a' }} />;
    case 'Customer Action':
      return <WarningOutlined style={{ color: '#f59e0b' }} />;
    case 'Workshop Booking':
    case 'Quotation':
    case 'Workshop Review':
      return <ToolOutlined style={{ color: '#7c3aed' }} />;
    case 'Payment':
      return <DollarOutlined style={{ color: '#16a34a' }} />;
    default:
      return <ClockCircleOutlined style={{ color: '#2563eb' }} />;
  }
}

function formatDateTime(value) {
  return value ? moment(value).format('DD MMM YYYY, hh:mm A') : 'Not available';
}

export default NotificationTimelineScreen;
