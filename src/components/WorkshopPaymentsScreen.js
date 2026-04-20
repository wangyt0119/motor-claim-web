import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Descriptions,
  Empty,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  BankOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  DownloadOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { getAllWorkshopPayments, getMyWorkshopPayments } from '../services/workshopService';

const { Title, Text } = Typography;

function WorkshopPaymentsScreen({ scope = 'officer', claims = [] }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState(null);

  const claimLookup = useMemo(
    () => new Map(claims.filter((claim) => claim?.id).map((claim) => [String(claim.id), claim])),
    [claims]
  );

  const refreshPayments = useCallback(async () => {
    setLoading(true);
    try {
      const result =
        scope === 'workshop' ? await getMyWorkshopPayments() : await getAllWorkshopPayments();
      setPayments(Array.isArray(result) ? result.filter(Boolean) : []);
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.title ||
          (typeof error?.response?.data === 'string' ? error.response.data : null) ||
          error?.message ||
          'Unable to load payment records.'
      );
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    refreshPayments();
  }, [refreshPayments]);

  const enrichedPayments = useMemo(
    () =>
      payments.map((payment) => {
        const relatedClaim = claimLookup.get(String(payment.claimId)) || null;
        return {
          ...payment,
          insuredPersonName:
            relatedClaim?.coverage?.insuredPersonName ||
            relatedClaim?.coverage?.authorizedDriver ||
            null,
          vehicleNo: relatedClaim?.coverage?.vehicleNo || null,
          coverageType: relatedClaim?.coverage?.coverageType || null,
        };
      }),
    [claimLookup, payments]
  );

  const filteredPayments = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return [...enrichedPayments]
      .filter((payment) => {
        const matchesStatus = statusFilter === 'All' || payment.status === statusFilter;
        if (!matchesStatus) {
          return false;
        }

        if (!query) {
          return true;
        }

        const haystack = [
          payment.claimId,
          payment.estimateId,
          payment.workshopName,
          payment.providerReference,
          payment.status,
          payment.approvalSource,
          payment.insuredPersonName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(query);
      })
      .sort((left, right) => new Date(right.paidAt || right.createdAt || 0) - new Date(left.paidAt || left.createdAt || 0));
  }, [enrichedPayments, searchText, statusFilter]);

  const statusOptions = useMemo(
    () => ['All', ...new Set(enrichedPayments.map((payment) => payment.status).filter(Boolean))],
    [enrichedPayments]
  );

  const paidCount = enrichedPayments.filter((payment) => String(payment.status).toLowerCase() === 'paid').length;
  const pendingCount = enrichedPayments.filter((payment) => String(payment.status).toLowerCase() === 'pending').length;
  const failedCount = enrichedPayments.filter((payment) => String(payment.status).toLowerCase() === 'failed').length;
  const totalAmount = enrichedPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <div className="portal-dashboard-stack">
      <div
        className="portal-dashboard-hero"
        style={{
          background:
            scope === 'workshop'
              ? 'linear-gradient(135deg, #ff8a00 0%, #ff5fa2 48%, #5b8def 100%)'
              : 'linear-gradient(135deg, #0f172a 0%, #0ea5e9 48%, #2563eb 100%)',
        }}
      >
        <div className="portal-dashboard-hero-content">
          <span className="portal-dashboard-kicker">
            {scope === 'workshop' ? 'Workshop Payouts' : 'Officer Monitoring'}
          </span>
          <Title level={2} className="portal-dashboard-title">
            {scope === 'workshop' ? 'Payment Overview' : 'Payment Monitoring'}
          </Title>
          <Text className="portal-dashboard-description">
            {scope === 'workshop'
              ? 'See the real payout records created for your approved repair quotations.'
              : 'Review actual workshop payment records created by approved repair estimates.'}
          </Text>
          <div className="portal-dashboard-chip-row">
            <div className="portal-dashboard-chip">
              <span className="portal-dashboard-chip-label">Payments</span>
              <span className="portal-dashboard-chip-value">{enrichedPayments.length}</span>
            </div>
            <div className="portal-dashboard-chip">
              <span className="portal-dashboard-chip-label">Paid</span>
              <span className="portal-dashboard-chip-value">{paidCount}</span>
            </div>
            <div className="portal-dashboard-chip">
              <span className="portal-dashboard-chip-label">Amount</span>
              <span className="portal-dashboard-chip-value">RM {totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="portal-dashboard-grid">
        <div className="portal-dashboard-span-3">
          <Card className="portal-dashboard-stat">
            <Statistic title="Total Payments" value={enrichedPayments.length} prefix={<DollarOutlined />} />
          </Card>
        </div>
        <div className="portal-dashboard-span-3">
          <Card className="portal-dashboard-stat">
            <Statistic title="Paid" value={paidCount} prefix={<CheckCircleOutlined />} />
          </Card>
        </div>
        <div className="portal-dashboard-span-3">
          <Card className="portal-dashboard-stat">
            <Statistic title="Pending" value={pendingCount} prefix={<ClockCircleOutlined />} />
          </Card>
        </div>
        <div className="portal-dashboard-span-3">
          <Card className="portal-dashboard-stat">
            <Statistic title="Failed" value={failedCount} prefix={<WarningOutlined />} />
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
              placeholder={
                scope === 'workshop'
                  ? 'Search claim, quotation, workshop, provider reference or customer'
                  : 'Search claim, estimate, workshop, provider reference or customer'
              }
              style={{ width: 380 }}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 180 }}
              options={statusOptions.map((status) => ({ label: status, value: status }))}
            />
          </div>
          <div className="portal-dashboard-toolbar-main">
            <Badge color="#16a34a" text={`Paid ${paidCount}`} />
            <Badge color="#2563eb" text={`Pending ${pendingCount}`} />
            <Badge color="#dc2626" text={`Failed ${failedCount}`} />
            <Button icon={<ReloadOutlined />} onClick={refreshPayments} loading={loading}>
              Refresh
            </Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={() => exportPaymentsPdf(filteredPayments, scope)}>
              Export PDF
            </Button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '56px 0' }}>
            <Spin size="large" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <Empty description="No payment records matched your filters." />
        ) : (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {filteredPayments.map((payment) => (
              <Card
                key={payment.paymentId || `${payment.claimId}-${payment.estimateId}`}
                bodyStyle={{ padding: 20 }}
                style={{ borderRadius: 18, borderColor: `${getStatusColor(payment.status)}33` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <Space direction="vertical" size={8} style={{ flex: 1, minWidth: 280 }}>
                    <Space wrap>
                      <Text strong style={{ fontSize: 17 }}>
                        Claim {shortId(payment.claimId)}
                      </Text>
                      <Tag color={getStatusColor(payment.status)}>{payment.status || 'Unknown'}</Tag>
                      <Tag>{payment.approvalSource || 'Approval source unavailable'}</Tag>
                      <Tag>{payment.provider || 'Provider unavailable'}</Tag>
                    </Space>
                    <Text type="secondary">
                      {scope === 'workshop'
                        ? `Quotation ${shortId(payment.estimateId)}`
                        : `${payment.workshopName || 'Workshop not available'}${payment.insuredPersonName ? ` • ${payment.insuredPersonName}` : ''}`}
                    </Text>
                    <Space wrap size={[24, 12]}>
                      <DetailItem icon={<BankOutlined />} label="Bank" value={payment.bankNameSnapshot || 'Not available'} />
                      <DetailItem label="Account" value={maskAccount(payment.bankAccountNumberSnapshot)} />
                      <DetailItem label="Paid At" value={formatDate(payment.paidAt || payment.createdAt)} />
                    </Space>
                    {payment.failureReason ? (
                      <Text style={{ color: '#b91c1c' }}>{payment.failureReason}</Text>
                    ) : null}
                  </Space>
                  <Space direction="vertical" size={12} style={{ alignItems: 'flex-end' }}>
                    <Text strong style={{ fontSize: 24, color: '#166534' }}>
                      RM {Number(payment.amount || 0).toFixed(2)}
                    </Text>
                    <Button icon={<EyeOutlined />} onClick={() => setSelectedPayment(payment)}>
                      View Details
                    </Button>
                  </Space>
                </div>
              </Card>
            ))}
          </Space>
        )}
      </Card>

      <Modal
        open={Boolean(selectedPayment)}
        onCancel={() => setSelectedPayment(null)}
        footer={null}
        title="Payment Details"
        width={760}
      >
        {selectedPayment ? (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Payment ID">{selectedPayment.paymentId || 'Not available'}</Descriptions.Item>
            <Descriptions.Item label="Claim ID">{selectedPayment.claimId || 'Not available'}</Descriptions.Item>
            <Descriptions.Item label={scope === 'workshop' ? 'Quotation ID' : 'Estimate ID'}>
              {selectedPayment.estimateId || 'Not available'}
            </Descriptions.Item>
            <Descriptions.Item label="Workshop">{selectedPayment.workshopName || 'Not available'}</Descriptions.Item>
            {scope !== 'workshop' ? (
              <Descriptions.Item label="Customer">{selectedPayment.insuredPersonName || 'Not returned by backend'}</Descriptions.Item>
            ) : null}
            <Descriptions.Item label="Amount">RM {Number(selectedPayment.amount || 0).toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="Status">{selectedPayment.status || 'Not available'}</Descriptions.Item>
            <Descriptions.Item label="Provider">{selectedPayment.provider || 'Not available'}</Descriptions.Item>
            <Descriptions.Item label="Provider Reference">{selectedPayment.providerReference || 'Not available'}</Descriptions.Item>
            <Descriptions.Item label="Approval Source">{selectedPayment.approvalSource || 'Not available'}</Descriptions.Item>
            <Descriptions.Item label="Bank Name">{selectedPayment.bankNameSnapshot || 'Not available'}</Descriptions.Item>
            <Descriptions.Item label="Account Holder">{selectedPayment.bankAccountHolderNameSnapshot || 'Not available'}</Descriptions.Item>
            <Descriptions.Item label="Account Number">{maskAccount(selectedPayment.bankAccountNumberSnapshot)}</Descriptions.Item>
            <Descriptions.Item label="Created At">{formatDate(selectedPayment.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Paid At">{formatDate(selectedPayment.paidAt)}</Descriptions.Item>
            {scope !== 'workshop' && selectedPayment.vehicleNo ? (
              <Descriptions.Item label="Vehicle No">{selectedPayment.vehicleNo}</Descriptions.Item>
            ) : null}
            {scope !== 'workshop' && selectedPayment.coverageType ? (
              <Descriptions.Item label="Coverage Type">{selectedPayment.coverageType}</Descriptions.Item>
            ) : null}
            <Descriptions.Item label="Failure Reason">{selectedPayment.failureReason || 'No failure reason recorded'}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <Space size={8}>
      {icon || null}
      <div>
        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
          {label}
        </Text>
        <Text strong>{value}</Text>
      </div>
    </Space>
  );
}

function getStatusColor(status) {
  switch (String(status || '').toLowerCase()) {
    case 'paid':
      return '#16a34a';
    case 'pending':
      return '#2563eb';
    case 'failed':
      return '#dc2626';
    default:
      return '#f59e0b';
  }
}

function shortId(value) {
  const text = String(value || '');
  return text.length > 12 ? `${text.slice(0, 8)}...${text.slice(-4)}` : text || 'N/A';
}

function maskAccount(value) {
  const text = String(value || '');
  return text ? `${'*'.repeat(Math.max(0, text.length - 4))}${text.slice(-4)}` : 'Not available';
}

function formatDate(value) {
  return value ? moment(value).format('DD MMM YYYY, hh:mm A') : 'Not available';
}

function exportPaymentsPdf(payments, scope) {
  if (!payments.length) {
    message.info('There are no payment records to export right now.');
    return;
  }

  const reportTitle =
    scope === 'workshop' ? 'Workshop Payment Report' : 'Officer Payment Monitoring Report';
  const idHeader = scope === 'workshop' ? 'Quotation ID' : 'Estimate ID';
  const generatedAt = moment().format('DD MMM YYYY, hh:mm A');
  const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const paidCount = payments.filter((payment) => String(payment.status).toLowerCase() === 'paid').length;
  const pendingCount = payments.filter((payment) => String(payment.status).toLowerCase() === 'pending').length;

  const tableRows = payments
    .map(
      (payment, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(shortId(payment.claimId))}</td>
          <td>${escapeHtml(shortId(payment.estimateId))}</td>
          <td>${escapeHtml(payment.workshopName || 'Not available')}</td>
          <td>${escapeHtml(payment.status || 'Unknown')}</td>
          <td>${escapeHtml(payment.provider || 'Not available')}</td>
          <td>${escapeHtml(payment.approvalSource || 'Not available')}</td>
          <td>RM ${Number(payment.amount || 0).toFixed(2)}</td>
          <td>${escapeHtml(formatDate(payment.paidAt || payment.createdAt))}</td>
        </tr>
      `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(reportTitle)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 32px; }
          h1 { margin: 0 0 8px; font-size: 24px; }
          .meta { margin-bottom: 20px; color: #475569; font-size: 13px; }
          .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
          .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; background: #f8fafc; }
          .label { display: block; font-size: 12px; color: #64748b; margin-bottom: 6px; }
          .value { font-size: 18px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; vertical-align: top; }
          th { background: #e2e8f0; }
          @media print { body { margin: 16px; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(reportTitle)}</h1>
        <div class="meta">Generated on ${escapeHtml(generatedAt)}</div>
        <div class="summary">
          <div class="card"><span class="label">Total Payments</span><span class="value">${payments.length}</span></div>
          <div class="card"><span class="label">Paid</span><span class="value">${paidCount}</span></div>
          <div class="card"><span class="label">Pending</span><span class="value">${pendingCount}</span></div>
          <div class="card"><span class="label">Total Amount</span><span class="value">RM ${totalAmount.toFixed(2)}</span></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Claim ID</th>
              <th>${escapeHtml(idHeader)}</th>
              <th>Workshop</th>
              <th>Status</th>
              <th>Provider</th>
              <th>Approval Source</th>
              <th>Amount</th>
              <th>Paid At</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=1200,height=900');
  if (!printWindow) {
    message.error('Unable to open the PDF preview window. Please allow pop-ups and try again.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 300);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default WorkshopPaymentsScreen;
