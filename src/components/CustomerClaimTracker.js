import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
  message,
  Row,
  Col,
} from 'antd';
import {
  CalendarOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  UploadOutlined,
  ToolOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { submitCustomerClaimResponse } from '../services/claimService';
import {
  createOrUpdateWorkshopAppointment,
  getMyWorkshopPaymentByEstimate,
  getPanelWorkshopStates,
  getPanelWorkshopsByState,
} from '../services/workshopService';
import { uploadFileToCloudinary } from '../services/cloudinaryService';
import ClaimDetailsModal from './ClaimDetailsModal';

const { Title, Text } = Typography;
const WORKSHOP_PERIODS = ['AM', 'PM'];
const WORKSHOP_SLOT_MINUTES = 30;
const WORKSHOP_TIME_SLOTS = buildWorkshopTimeSlots();

function CustomerClaimTracker({ claims = [], coverages = [], onClaimsChanged }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [responseFiles, setResponseFiles] = useState([]);
  const [customerNote, setCustomerNote] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [bookingStates, setBookingStates] = useState([]);
  const [stateLoading, setStateLoading] = useState(false);
  const [workshopLoading, setWorkshopLoading] = useState(false);
  const [selectedState, setSelectedState] = useState(undefined);
  const [availableWorkshops, setAvailableWorkshops] = useState([]);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState(undefined);
  const [preferredDate, setPreferredDate] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(undefined);
  const [bookingNote, setBookingNote] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [claimPayments, setClaimPayments] = useState({});

  const periodTimeSlots = useMemo(
    () => WORKSHOP_TIME_SLOTS.filter((slot) => slot.period === selectedPeriod),
    [selectedPeriod]
  );

  const statusOptions = useMemo(
    () => ['All', ...new Set(claims.map((claim) => claim.status).filter(Boolean))],
    [claims]
  );

  const claimsWithPayments = useMemo(
    () =>
      claims.map((claim) => ({
        ...claim,
        workshopPayment: claimPayments[claim.id] || claim.workshopPayment || null,
      })),
    [claimPayments, claims]
  );

  const filteredClaims = useMemo(() => {
    let nextClaims = [...claimsWithPayments];

    if (statusFilter !== 'All') {
      nextClaims = nextClaims.filter((claim) => claim.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      nextClaims = nextClaims.filter((claim) =>
        [
          claim.id,
          claim.type,
          claim.vehicleRegistration,
          claim.status,
          claim.reviewStatus,
          claim.officerDecisionNote,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)
      );
    }

    return nextClaims.sort((left, right) => getClaimSortTime(right) - getClaimSortTime(left));
  }, [claimsWithPayments, searchQuery, statusFilter]);

  useEffect(() => {
    let isMounted = true;

    async function loadCustomerPayments() {
      const claimsWithEstimates = claims.filter((claim) => claim.workshopRepairEstimate?.estimateId);

      if (!claimsWithEstimates.length) {
        if (isMounted) {
          setClaimPayments({});
        }
        return;
      }

      const entries = await Promise.all(
        claimsWithEstimates.map(async (claim) => {
          try {
            const payment = await getMyWorkshopPaymentByEstimate(claim.workshopRepairEstimate.estimateId);
            return [claim.id, payment];
          } catch (error) {
            return [claim.id, null];
          }
        })
      );

      if (isMounted) {
        setClaimPayments(Object.fromEntries(entries.filter(([, payment]) => payment)));
      }
    }

    loadCustomerPayments();

    return () => {
      isMounted = false;
    };
  }, [claims]);

  useEffect(() => {
    if (!bookingModalOpen || !selectedState) {
      return;
    }

    loadWorkshops(selectedState);
  }, [bookingModalOpen, selectedState]);

  return (
    <div className="portal-dashboard-stack">
      <div className="portal-dashboard-hero portal-dashboard-theme-soft">
        <div className="portal-dashboard-hero-content">
          <span className="portal-dashboard-kicker portal-dashboard-kicker-soft">Track Claims</span>
          <Title level={2} className="portal-dashboard-title">Active Claims Tracker</Title>
          <Text className="portal-dashboard-description">
            Track review progress, respond to officer requests, and book a panel workshop once your claim is approved.
          </Text>
          <div className="portal-dashboard-chip-row">
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">All Claims</span>
              <span className="portal-dashboard-chip-value">{claimsWithPayments.length}</span>
            </div>
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Shown</span>
              <span className="portal-dashboard-chip-value">{filteredClaims.length}</span>
            </div>
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Need Response</span>
              <span className="portal-dashboard-chip-value">{claimsWithPayments.filter((claim) => claim.status === 'Pending Customer Action').length}</span>
            </div>
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Workshop Ready</span>
              <span className="portal-dashboard-chip-value">{claimsWithPayments.filter((claim) => canBookWorkshop(claim)).length}</span>
            </div>
          </div>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Input
            allowClear
            placeholder="Search by claim ID, type, vehicle, status, or officer note"
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </Col>
        <Col xs={24} md={8}>
          <Select style={{ width: '100%' }} value={statusFilter} onChange={setStatusFilter}>
            {statusOptions.map((status) => (
              <Select.Option key={status} value={status}>{status}</Select.Option>
            ))}
          </Select>
        </Col>
      </Row>

      <Alert
        showIcon
        type="info"
        style={{ marginBottom: 24 }}
        message="Customer workflow"
        description="Pending customer action means the officer wants a reupload or rewritten explanation. Approved vehicle claims can proceed to panel workshop booking directly from this page."
      />

      {filteredClaims.length === 0 ? (
        <Empty description="No claims found matching your criteria" />
      ) : (
        filteredClaims.map((claim) => (
          <Card key={claim.id} style={{ marginBottom: 16, borderRadius: 16 }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Space wrap>
                <Text strong>{claim.id}</Text>
                <Tag color={getStatusColor(claim.status)}>{claim.status}</Tag>
                {claim.workshopAppointment ? <Tag color="cyan">Workshop booked</Tag> : null}
              </Space>

              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Type">{claim.type}</Descriptions.Item>
                <Descriptions.Item label="Submitted">{moment(claim.date).format('DD MMM YYYY')}</Descriptions.Item>
                <Descriptions.Item label="Vehicle">{claim.vehicleRegistration || 'Not available'}</Descriptions.Item>
                <Descriptions.Item label="Next action">{getNextAction(claim)}</Descriptions.Item>
              </Descriptions>

              {claim.requestedItems?.length ? (
                <Alert
                  type="warning"
                  showIcon
                  message="Officer requested an update"
                  description={`${claim.requestedItems.length} item(s) require your response.`}
                />
              ) : null}

              {claim.workshopAppointment ? (
                <Alert
                  type="success"
                  showIcon
                  message={`Workshop booked: ${claim.workshopAppointment.workshopName}`}
                  description={`${moment(claim.workshopAppointment.preferredDate).format('DD MMM YYYY')} | ${formatTimeRange(claim.workshopAppointment.timeSlotStart, claim.workshopAppointment.timeSlotEnd)}`}
                />
              ) : null}

              <Card size="small" style={{ borderRadius: 12, background: '#f8fafc' }}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Space wrap>
                    <DollarOutlined style={{ color: getPaymentProgress(claim).color }} />
                    <Text strong>Payment Progress</Text>
                    <Tag color={getPaymentProgress(claim).tagColor}>{getPaymentProgress(claim).label}</Tag>
                  </Space>
                  <Text type="secondary">{getPaymentProgress(claim).description}</Text>
                  {claim.workshopPayment?.paidAt || claim.paymentDate || claim.workshopPayment?.providerReference || claim.paymentReference ? (
                    <Space wrap size={[16, 6]}>
                      {claim.workshopPayment?.paidAt || claim.paymentDate ? (
                        <Text type="secondary">Paid at: {moment(claim.workshopPayment?.paidAt || claim.paymentDate).format('DD MMM YYYY')}</Text>
                      ) : null}
                      {claim.workshopPayment?.providerReference || claim.paymentReference ? (
                        <Text type="secondary">Reference: {claim.workshopPayment?.providerReference || claim.paymentReference}</Text>
                      ) : null}
                    </Space>
                  ) : null}
                </Space>
              </Card>

              <Space wrap>
                <Button icon={<EyeOutlined />} onClick={() => setSelectedClaim(claim)}>
                  View Details
                </Button>
                {claim.status === 'Pending Customer Action' ? (
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    style={{ backgroundColor: '#c2410c', borderColor: '#c2410c' }}
                    onClick={() => openResponseModal(claim)}
                  >
                    Submit Requested Update
                  </Button>
                ) : null}
                {canBookWorkshop(claim) ? (
                  <Button icon={<ToolOutlined />} onClick={() => openBookingModal(claim)}>
                    {claim.workshopAppointment ? 'Update Workshop Booking' : 'Choose Panel Workshop'}
                  </Button>
                ) : null}
              </Space>
            </Space>
          </Card>
        ))
      )}

      <ClaimDetailsModal
        claim={selectedClaim}
        coverages={coverages}
        open={Boolean(selectedClaim) && !responseModalOpen && !bookingModalOpen}
        onClose={() => setSelectedClaim(null)}
      />

      <Modal
        open={responseModalOpen}
        title={selectedClaim ? `Respond to claim ${selectedClaim.id}` : 'Submit response'}
        onCancel={closeResponseModal}
        onOk={handleSubmitResponse}
        okText="Submit Response"
        confirmLoading={submittingResponse}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {selectedClaim?.requestedItems?.length ? (
            <Alert
              type="warning"
              showIcon
              message="Requested update"
              description={selectedClaim.requestedItems.map((item) => item.label).join(', ')}
            />
          ) : null}
          <Text>Upload the requested documents and explain your update in the note below.</Text>
          <Upload
            multiple
            beforeUpload={() => false}
            fileList={responseFiles}
            onChange={({ fileList }) => setResponseFiles(fileList)}
          >
            <Button icon={<UploadOutlined />}>Choose File(s)</Button>
          </Upload>
          <Input.TextArea
            rows={4}
            value={customerNote}
            onChange={(event) => setCustomerNote(event.target.value)}
            placeholder="Explain what you updated for the officer"
          />
        </Space>
      </Modal>

      <Modal
        open={bookingModalOpen}
        title={selectedClaim ? `Book Panel Workshop for ${selectedClaim.id}` : 'Panel workshop booking'}
        onCancel={closeBookingModal}
        onOk={handleSubmitBooking}
        okText={selectedClaim?.workshopAppointment ? 'Update Booking' : 'Book Workshop'}
        confirmLoading={submittingBooking}
        width={920}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="Approved claim required"
            description="Panel workshop booking is available only after claim approval."
          />

          <Select
            value={selectedState}
            onChange={setSelectedState}
            placeholder="Select state"
            loading={stateLoading}
            size="large"
            style={{ width: '100%' }}
            options={bookingStates.map((state) => ({ label: state, value: state }))}
          />

          <Select
            value={selectedWorkshopId}
            onChange={setSelectedWorkshopId}
            placeholder="Select panel workshop"
            loading={workshopLoading}
            disabled={!selectedState}
            optionLabelProp="label"
            showSearch
            size="large"
            style={{ width: '100%' }}
            filterOption={(input, option) => {
              const workshop = option?.workshop || {};
              return [workshop.name, workshop.address, workshop.phone, workshop.email]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(input.toLowerCase());
            }}
            optionRender={(option) => renderWorkshopOption(option.data.workshop)}
            options={availableWorkshops.map((workshop) => ({
              label: workshop.name,
              value: workshop.workshopId,
              workshop,
            }))}
          />

          {selectedWorkshopId ? (
            <Card size="small">
              {renderSelectedWorkshop(availableWorkshops.find((item) => item.workshopId === selectedWorkshopId))}
            </Card>
          ) : null}

          <DatePicker
            style={{ width: '100%' }}
            value={preferredDate}
            onChange={setPreferredDate}
            placeholder="Preferred date"
            disabledDate={(current) =>
              current && (current < moment().startOf('day') || current.day() === 0)
            }
            suffixIcon={<CalendarOutlined />}
          />

          <Space style={{ width: '100%' }} size={12}>
            <Select
              value={selectedPeriod}
              onChange={(value) => {
                setSelectedPeriod(value);
                setSelectedTimeSlot(undefined);
              }}
              size="large"
              style={{ width: 160 }}
              options={WORKSHOP_PERIODS.map((period) => ({ label: period, value: period }))}
            />
            <Select
              style={{ flex: 1 }}
              value={selectedTimeSlot}
              onChange={setSelectedTimeSlot}
              size="large"
              placeholder="Select appointment time"
              options={periodTimeSlots.map((slot) => ({
                label: slot.label,
                value: slot.value,
              }))}
            />
          </Space>

          <Text type="secondary">
            Workshop appointment slots use normal working hours, Monday to Saturday, 9:00 AM to 6:00 PM.
          </Text>

          <Input.TextArea
            rows={3}
            value={bookingNote}
            onChange={(event) => setBookingNote(event.target.value)}
            placeholder="Optional note for the workshop"
          />
        </Space>
      </Modal>
    </div>
  );

  async function handleSubmitResponse() {
    if (!selectedClaim) {
      return;
    }

    if (!customerNote.trim() && responseFiles.length === 0) {
      message.warning('Add a note or upload at least one file before submitting your response.');
      return;
    }

    setSubmittingResponse(true);
    try {
      const uploadedDocuments = [];

      for (const file of responseFiles) {
        const rawFile = file.originFileObj ?? file;
        const url = await uploadFileToCloudinary(rawFile);
        uploadedDocuments.push(url);
      }

      await submitCustomerClaimResponse(selectedClaim.id, {
        responseNote: customerNote,
        responseDocuments: uploadedDocuments,
      });

      message.success('Your response has been submitted to the backend.');
      closeResponseModal();
      if (onClaimsChanged) {
        await onClaimsChanged();
      }
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.title ||
          (typeof error?.response?.data === 'string' ? error.response.data : null) ||
          error?.message ||
          'Unable to submit your response.'
      );
    } finally {
      setSubmittingResponse(false);
    }
  }

  async function openBookingModal(claim) {
    setSelectedClaim(claim);
    setBookingModalOpen(true);
    setSelectedState(claim.workshopAppointment?.workshopState || undefined);
    setSelectedWorkshopId(claim.workshopAppointment?.workshopId || undefined);
    setPreferredDate(claim.workshopAppointment?.preferredDate ? moment(claim.workshopAppointment.preferredDate) : null);
    const existingStartTime = claim.workshopAppointment?.timeSlotStart
      ? normalizeTimeValue(claim.workshopAppointment.timeSlotStart)
      : undefined;
    setSelectedPeriod(existingStartTime && Number(existingStartTime.slice(0, 2)) >= 12 ? 'PM' : 'AM');
    setSelectedTimeSlot(existingStartTime);
    setBookingNote(claim.workshopAppointment?.notes || '');

    setStateLoading(true);
    try {
      const states = await getPanelWorkshopStates();
      setBookingStates(states);
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Unable to load panel workshop states.');
    } finally {
      setStateLoading(false);
    }
  }

  async function loadWorkshops(state) {
    setWorkshopLoading(true);
    try {
      const workshops = await getPanelWorkshopsByState(state);
      setAvailableWorkshops(workshops);
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Unable to load workshops for the selected state.');
      setAvailableWorkshops([]);
    } finally {
      setWorkshopLoading(false);
    }
  }

  async function handleSubmitBooking() {
    if (!selectedClaim) {
      return;
    }

    if (!selectedState || !selectedWorkshopId || !preferredDate || !selectedTimeSlot) {
      message.warning('Please complete the workshop, date, and appointment time selection.');
      return;
    }

    const timeSlotEnd = addMinutesToTime(selectedTimeSlot, WORKSHOP_SLOT_MINUTES);

    setSubmittingBooking(true);
    try {
      await createOrUpdateWorkshopAppointment({
        claimId: selectedClaim.id,
        workshopId: selectedWorkshopId,
        preferredDate: preferredDate.format('YYYY-MM-DDT00:00:00'),
        timeSlotStart: `${selectedTimeSlot}:00`,
        timeSlotEnd: `${timeSlotEnd}:00`,
        notes: bookingNote || null,
      });

      message.success('Panel workshop appointment saved.');
      closeBookingModal();
      if (onClaimsChanged) {
        await onClaimsChanged();
      }
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.title ||
          (typeof error?.response?.data === 'string' ? error.response.data : null) ||
          error?.message ||
          'Unable to save the workshop booking.'
      );
    } finally {
      setSubmittingBooking(false);
    }
  }

  function openResponseModal(claim) {
    setSelectedClaim(claim);
    setResponseModalOpen(true);
    setResponseFiles([]);
    setCustomerNote(claim.customerResponseNote || '');
  }

  function closeResponseModal() {
    setResponseModalOpen(false);
    setResponseFiles([]);
    setCustomerNote('');
    setSelectedClaim(null);
  }

  function closeBookingModal() {
    setBookingModalOpen(false);
    setBookingStates([]);
    setAvailableWorkshops([]);
    setSelectedState(undefined);
    setSelectedWorkshopId(undefined);
    setPreferredDate(null);
    setSelectedPeriod('AM');
    setSelectedTimeSlot(undefined);
    setBookingNote('');
    setSelectedClaim(null);
  }
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

function getClaimSortTime(claim) {
  const value = claim.createdAt || claim.date || claim.incidentDate || 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getPaymentProgress(claim) {
  const payment = claim.workshopPayment || null;
  const paymentStatus = String(payment?.status || claim.paymentStatus || '').toLowerCase();
  const estimateStatus = String(claim.workshopRepairEstimate?.status || '').toLowerCase();

  if (paymentStatus === 'paid') {
    return {
      label: 'Paid',
      tagColor: 'green',
      color: '#16a34a',
      description: 'Payment has been completed.',
    };
  }

  if (['failed', 'rejected'].includes(paymentStatus)) {
    return {
      label: 'Payment Failed',
      tagColor: 'red',
      color: '#dc2626',
      description: 'Payment was not successful. Please contact support for assistance.',
    };
  }

  if (['pending', 'processing', 'onhold', 'on hold'].includes(paymentStatus)) {
    return {
      label: 'Processing',
      tagColor: 'blue',
      color: '#2563eb',
      description: 'Payment is being processed by the finance or workshop payout flow.',
    };
  }

  if ((claim.workshopRepairEstimate?.isStpApproved || estimateStatus === 'approved') && claim.status === 'Approved') {
    return {
      label: 'Awaiting Payout',
      tagColor: 'cyan',
      color: '#0891b2',
      description: 'The workshop quotation has been approved. Payment will be prepared next.',
    };
  }

  if (claim.workshopRepairEstimate) {
    return {
      label: 'Quotation Review',
      tagColor: 'orange',
      color: '#ea580c',
      description: 'The workshop quotation has been submitted and is waiting for approval before payment.',
    };
  }

  if (canBookWorkshop(claim)) {
    return {
      label: 'Workshop Required',
      tagColor: 'gold',
      color: '#ca8a04',
      description: 'Choose a panel workshop first. Payment progress starts after workshop quotation approval.',
    };
  }

  if (String(claim.status || '').toLowerCase() === 'rejected') {
    return {
      label: 'Not Payable',
      tagColor: 'red',
      color: '#dc2626',
      description: 'This claim was rejected, so no payment will be processed.',
    };
  }

  return {
    label: 'Not Started',
    tagColor: 'default',
    color: '#64748b',
    description: 'Payment progress will appear after claim approval and workshop processing.',
  };
}

function getNextAction(claim) {
  switch ((claim.status || '').toLowerCase()) {
    case 'pending customer action':
      return 'Please upload the requested documents or rewrite the requested details for officer review.';
    case 'customer responded':
      return 'Your response has been sent. The officer will continue reviewing your claim.';
    case 'approved':
      return canBookWorkshop(claim)
        ? claim.workshopAppointment
          ? 'Your workshop booking is saved. You can update it if needed.'
          : 'Your claim is approved. Choose a panel workshop date and time.'
        : claim.workshopRepairEstimate
          ? 'Your quotation has been submitted, so workshop booking details cannot be changed here.'
          : 'Your claim has been approved.';
    case 'rejected':
      return 'Your claim has been rejected.';
    default:
      return 'Your claim is still under review.';
  }
}

function canBookWorkshop(claim) {
  const isApprovedClaim = claim.status === 'Approved' && Number(claim.allClaimType) === 1;
  const hasSubmittedEstimate = Boolean(claim.workshopRepairEstimate);

  // Allow booking only for approved claim types, and only when no workshop quotation has been sent.
  // If a quotation exists, the customer should no longer update the workshop booking here.
  return isApprovedClaim && !hasSubmittedEstimate;
}

function formatTimeRange(start, end) {
  if (!start || !end) {
    return 'Not available';
  }

  return `${moment(normalizeTimeValue(start), 'HH:mm').format('hh:mm A')} - ${moment(normalizeTimeValue(end), 'HH:mm').format('hh:mm A')}`;
}

function normalizeTimeValue(value) {
  return String(value).slice(0, 5);
}

function buildWorkshopTimeSlots() {
  const slots = [];
  for (let hour = 9; hour <= 17; hour += 1) {
    for (const minute of [0, 30]) {
      const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      slots.push({
        value,
        label: moment(value, 'HH:mm').format('hh:mm A'),
        period: hour < 12 ? 'AM' : 'PM',
      });
    }
  }
  return slots;
}

function addMinutesToTime(value, minutes) {
  return moment(value, 'HH:mm').add(minutes, 'minutes').format('HH:mm');
}

function renderSelectedWorkshop(workshop) {
  if (!workshop) {
    return null;
  }

  return (
    <Space direction="vertical" size={6}>
      <Text strong>{workshop.name}</Text>
      <Text type="secondary"><EnvironmentOutlined /> {workshop.address}</Text>
      {Array.isArray(workshop.phone) && workshop.phone.length ? <Text type="secondary">Phone: {workshop.phone.join(', ')}</Text> : null}
      {Array.isArray(workshop.email) && workshop.email.length ? <Text type="secondary">Email: {workshop.email.join(', ')}</Text> : null}
    </Space>
  );
}

function renderWorkshopOption(workshop) {
  if (!workshop) {
    return null;
  }

  return (
    <Space direction="vertical" size={2}>
      <Text strong>{workshop.name}</Text>
      <Text type="secondary">{workshop.address || 'Address not available'}</Text>
      {Array.isArray(workshop.phone) && workshop.phone.length ? <Text type="secondary">Phone: {workshop.phone.join(', ')}</Text> : null}
    </Space>
  );
}

export default CustomerClaimTracker;
