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
  CloseCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  UploadOutlined,
  ToolOutlined,
  SearchOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { submitCustomerClaimResponse, withdrawClaim } from '../services/claimService';
import {
  acceptWorkshopClaimLinkRequest,
  assignVehicleAlreadyAtWorkshop,
  createOrUpdateWorkshopAppointment,
  getMyCustomerClaimLinkRequests,
  getMyWorkshopPaymentByEstimate,
  getPanelWorkshopStates,
  getPanelWorkshopsByState,
  rejectWorkshopClaimLinkRequest,
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
  const [alreadyAtWorkshopModalOpen, setAlreadyAtWorkshopModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
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
  const [arrivalDate, setArrivalDate] = useState(null);
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [claimPayments, setClaimPayments] = useState({});
  const [workshopLinkRequests, setWorkshopLinkRequests] = useState([]);
  const [loadingWorkshopLinkRequests, setLoadingWorkshopLinkRequests] = useState(false);
  const [respondingLinkRequestId, setRespondingLinkRequestId] = useState(null);
  const [rejectLinkRequest, setRejectLinkRequest] = useState(null);
  const [linkRequestRejectionReason, setLinkRequestRejectionReason] = useState('');

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

  const bookedTimeSlots = useMemo(
    () => getBookedTimeSlotsForSelection(claimsWithPayments, {
      selectedClaimId: selectedClaim?.id,
      selectedWorkshopId,
      preferredDate,
    }),
    [claimsWithPayments, preferredDate, selectedClaim?.id, selectedWorkshopId]
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

  async function copyClaimId(claimId) {
    try {
      await navigator.clipboard.writeText(String(claimId));
      message.success(`Claim ID ${claimId} copied`);
    } catch (error) {
      message.error('Unable to copy claim ID');
    }
  }

  function renderCopyClaimButton(claimId) {
    return (
      <Button
        size="small"
        icon={<CopyOutlined />}
        onClick={() => copyClaimId(claimId)}
      >
        Copy
      </Button>
    );
  }

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
    loadWorkshopLinkRequests();
  }, []);

  const pendingWorkshopLinkRequests = useMemo(
    () => workshopLinkRequests.filter((request) => String(request.status).toLowerCase() === 'pending'),
    [workshopLinkRequests]
  );

  useEffect(() => {
    if ((!bookingModalOpen && !alreadyAtWorkshopModalOpen) || !selectedState) {
      return;
    }

    loadWorkshops(selectedState);
  }, [alreadyAtWorkshopModalOpen, bookingModalOpen, selectedState]);

  useEffect(() => {
    if (selectedTimeSlot && bookedTimeSlots.has(selectedTimeSlot)) {
      setSelectedTimeSlot(undefined);
      message.warning('That appointment time has already been booked. Please choose another time slot.');
    }
  }, [bookedTimeSlots, selectedTimeSlot]);

  return (
    <div className="portal-dashboard-stack">
      <div className="portal-dashboard-hero portal-dashboard-theme-soft">
        <div className="portal-dashboard-hero-content">
          <span className="portal-dashboard-kicker portal-dashboard-kicker-soft">Track Claims</span>
          <Title level={2} className="portal-dashboard-title">Active Claims Tracker</Title>
          <Text className="portal-dashboard-description">
            Track review progress, respond to officer requests, and choose the right panel workshop path once your claim is approved.
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
        description="Pending customer action means the officer wants a reupload or rewritten explanation. Approved vehicle claims can book a future visit or record that the vehicle is already at a panel workshop."
      />

      {loadingWorkshopLinkRequests || workshopLinkRequests.length ? (
        <Card
          title={`Workshop Link Requests (${pendingWorkshopLinkRequests.length} pending)`}
          loading={loadingWorkshopLinkRequests}
          style={{ borderRadius: 16 }}
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Text type="secondary">
              A panel workshop can only submit a quotation after you confirm the request.
            </Text>
            {workshopLinkRequests.map((request) => (
              <Card key={request.requestId} size="small" style={{ borderRadius: 12, background: '#fffaf5' }}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Space wrap>
                    <Text strong>{request.workshopName || 'Panel workshop'}</Text>
                    <Tag color={getLinkRequestStatusColor(request.status)}>
                      {String(request.status).toLowerCase() === 'pending' ? 'Waiting for your confirmation' : request.status}
                    </Tag>
                  </Space>
                  <Space wrap>
                    <Text>Claim: {request.claimId}</Text>
                    {renderCopyClaimButton(request.claimId)}
                  </Space>
                  <Text>Vehicle arrived: {request.arrivalDate ? moment(request.arrivalDate).format('DD MMM YYYY') : 'Not available'}</Text>
                  {request.notes ? <Text type="secondary">Workshop note: {request.notes}</Text> : null}
                  {request.customerResponseNote ? <Text type="secondary">Your response note: {request.customerResponseNote}</Text> : null}
                  {String(request.status).toLowerCase() === 'pending' ? (
                    <Space wrap>
                      <Button
                        type="primary"
                        loading={respondingLinkRequestId === request.requestId}
                        onClick={() => handleAcceptWorkshopLinkRequest(request)}
                      >
                        Accept Workshop Link
                      </Button>
                      <Button danger onClick={() => openRejectLinkRequestModal(request)}>
                        Reject
                      </Button>
                    </Space>
                  ) : null}
                </Space>
              </Card>
            ))}
          </Space>
        </Card>
      ) : null}

      {filteredClaims.length === 0 ? (
        <Empty description="No claims found matching your criteria" />
      ) : (
        filteredClaims.map((claim) => (
          <Card key={claim.id} style={{ marginBottom: 16, borderRadius: 16 }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Space wrap>
                <Text strong>{claim.id}</Text>
                {renderCopyClaimButton(claim.id)}
                <Tag color={getStatusColor(claim.status)}>{claim.status}</Tag>
                {claim.workshopAppointment ? <Tag color="cyan">{getWorkshopAssignmentLabel(claim.workshopAppointment)}</Tag> : null}
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
                  message={`${getWorkshopAssignmentLabel(claim.workshopAppointment)}: ${claim.workshopAppointment.workshopName}`}
                  description={getWorkshopAssignmentDescription(claim.workshopAppointment)}
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
                    {isAlreadyAtWorkshop(claim.workshopAppointment) ? 'Book Future Workshop Visit' : claim.workshopAppointment ? 'Update Workshop Booking' : 'Book Panel Workshop Visit'}
                  </Button>
                ) : null}
                {canBookWorkshop(claim) ? (
                  <Button icon={<ToolOutlined />} onClick={() => openAlreadyAtWorkshopModal(claim)}>
                    {isAlreadyAtWorkshop(claim.workshopAppointment) ? 'Update Workshop Assignment' : 'Vehicle Already at Panel Workshop'}
                  </Button>
                ) : null}
                {canWithdrawClaim(claim) ? (
                  <Button danger icon={<CloseCircleOutlined />} onClick={() => openWithdrawModal(claim)}>
                    {claim.workshopAppointment ? 'Cancel Booking and Withdraw' : 'Withdraw Claim'}
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
        open={Boolean(selectedClaim) && !responseModalOpen && !bookingModalOpen && !alreadyAtWorkshopModalOpen && !withdrawModalOpen}
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
                label: bookedTimeSlots.has(slot.value) ? `${slot.label} - Booked` : slot.label,
                value: slot.value,
                disabled: bookedTimeSlots.has(slot.value),
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

      <Modal
        open={alreadyAtWorkshopModalOpen}
        title={selectedClaim ? `Vehicle Already at Panel Workshop for ${selectedClaim.id}` : 'Vehicle already at panel workshop'}
        onCancel={closeAlreadyAtWorkshopModal}
        onOk={handleSubmitAlreadyAtWorkshop}
        okText={isAlreadyAtWorkshop(selectedClaim?.workshopAppointment) ? 'Update Assignment' : 'Assign Workshop'}
        confirmLoading={submittingBooking}
        width={920}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="For vehicles delivered or towed earlier"
            description="Select the panel workshop and arrival date. No future appointment time is required, and the workshop can submit its quotation after assignment."
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
            value={arrivalDate}
            onChange={setArrivalDate}
            placeholder="Vehicle arrival date"
            disabledDate={(current) =>
              current &&
              (current > moment().endOf('day') ||
                (selectedClaim?.incidentDate && current < moment(selectedClaim.incidentDate).startOf('day')))
            }
            suffixIcon={<CalendarOutlined />}
          />

          <Input.TextArea
            rows={3}
            value={bookingNote}
            onChange={(event) => setBookingNote(event.target.value)}
            maxLength={1000}
            placeholder="Optional note, such as towing details"
          />
        </Space>
      </Modal>

      <Modal
        open={withdrawModalOpen}
        title={selectedClaim ? `Are you sure you want to withdraw claim ${selectedClaim.id}?` : 'Are you sure you want to withdraw this claim?'}
        onCancel={closeWithdrawModal}
        onOk={handleWithdrawClaim}
        okText={selectedClaim?.workshopAppointment ? 'Cancel Booking and Withdraw' : 'Withdraw Claim'}
        okButtonProps={{ danger: true }}
        confirmLoading={submittingWithdrawal}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Alert
            type="warning"
            showIcon
            message={selectedClaim?.workshopAppointment ? 'The workshop booking will also be cancelled' : 'This claim will stop processing'}
            description="This action cannot be undone. The claim will no longer continue through review, workshop quotation, or payment."
          />
          <Text strong>Withdrawal reason is required</Text>
          <Text type="secondary">
            Please describe why you want to withdraw this claim before continuing.
          </Text>
          <Input.TextArea
            rows={4}
            value={withdrawalReason}
            onChange={(event) => setWithdrawalReason(event.target.value)}
            maxLength={500}
            showCount
            placeholder="Required: describe your reason for withdrawing this claim"
          />
        </Space>
      </Modal>

      <Modal
        open={Boolean(rejectLinkRequest)}
        title="Reject workshop link request?"
        onCancel={closeRejectLinkRequestModal}
        onOk={handleRejectWorkshopLinkRequest}
        okText="Reject Request"
        okButtonProps={{ danger: true }}
        confirmLoading={respondingLinkRequestId === rejectLinkRequest?.requestId}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Alert
            type="warning"
            showIcon
            message="The workshop will not be linked to this claim"
            description="You can leave an optional note so the workshop understands your decision."
          />
          <Input.TextArea
            rows={4}
            value={linkRequestRejectionReason}
            onChange={(event) => setLinkRequestRejectionReason(event.target.value)}
            maxLength={500}
            showCount
            placeholder="Optional reason for rejecting this request"
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

    if (bookedTimeSlots.has(selectedTimeSlot)) {
      message.warning('This workshop time slot is already booked. Please choose another date or time.');
      return;
    }

    const claimId = selectedClaim.id;
    const selectedWorkshop = availableWorkshops.find((workshop) => workshop.workshopId === selectedWorkshopId);
    const timeSlotEnd = addMinutesToTime(selectedTimeSlot, WORKSHOP_SLOT_MINUTES);

    Modal.confirm({
      title: selectedClaim.workshopAppointment ? 'Confirm workshop booking update?' : 'Confirm panel workshop booking?',
      okText: selectedClaim.workshopAppointment ? 'Confirm Update' : 'Confirm Booking',
      cancelText: 'Review Details',
      content: (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="Please confirm these workshop booking details"
            description="After confirmation, the selected panel workshop will receive this appointment information."
          />
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Claim ID">{claimId}</Descriptions.Item>
            <Descriptions.Item label="Workshop">{selectedWorkshop?.name || selectedWorkshopId}</Descriptions.Item>
            <Descriptions.Item label="State">{selectedState}</Descriptions.Item>
            <Descriptions.Item label="Date">{preferredDate.format('DD MMM YYYY')}</Descriptions.Item>
            <Descriptions.Item label="Time">
              {formatTimeRange(`${selectedTimeSlot}:00`, `${timeSlotEnd}:00`)}
            </Descriptions.Item>
          </Descriptions>
        </Space>
      ),
      onOk: async () => {
        setSubmittingBooking(true);
        try {
          await createOrUpdateWorkshopAppointment({
            claimId,
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
          throw error;
        } finally {
          setSubmittingBooking(false);
        }
      },
    });
  }

  async function openAlreadyAtWorkshopModal(claim) {
    setSelectedClaim(claim);
    setAlreadyAtWorkshopModalOpen(true);
    setSelectedState(claim.workshopAppointment?.workshopState || undefined);
    setSelectedWorkshopId(claim.workshopAppointment?.workshopId || undefined);
    setArrivalDate(
      isAlreadyAtWorkshop(claim.workshopAppointment) && claim.workshopAppointment?.preferredDate
        ? moment(claim.workshopAppointment.preferredDate)
        : null
    );
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

  async function handleSubmitAlreadyAtWorkshop() {
    if (!selectedClaim) {
      return;
    }

    if (!selectedState || !selectedWorkshopId || !arrivalDate) {
      message.warning('Please select the panel workshop and vehicle arrival date.');
      return;
    }

    const claimId = selectedClaim.id;
    const selectedWorkshop = availableWorkshops.find((workshop) => workshop.workshopId === selectedWorkshopId);

    Modal.confirm({
      title: isAlreadyAtWorkshop(selectedClaim.workshopAppointment) ? 'Confirm workshop assignment update?' : 'Confirm vehicle already at workshop?',
      okText: isAlreadyAtWorkshop(selectedClaim.workshopAppointment) ? 'Confirm Update' : 'Confirm Assignment',
      cancelText: 'Review Details',
      content: (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="Please confirm this workshop assignment"
            description="After confirmation, the selected workshop can submit a repair quotation for this claim."
          />
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Claim ID">{claimId}</Descriptions.Item>
            <Descriptions.Item label="Workshop">{selectedWorkshop?.name || selectedWorkshopId}</Descriptions.Item>
            <Descriptions.Item label="State">{selectedState}</Descriptions.Item>
            <Descriptions.Item label="Vehicle arrival date">{arrivalDate.format('DD MMM YYYY')}</Descriptions.Item>
          </Descriptions>
        </Space>
      ),
      onOk: async () => {
        setSubmittingBooking(true);
        try {
          await assignVehicleAlreadyAtWorkshop({
            claimId,
            workshopId: selectedWorkshopId,
            arrivalDate: arrivalDate.format('YYYY-MM-DDT00:00:00'),
            notes: bookingNote.trim() || null,
          });

          message.success('Workshop assignment saved. The workshop can now submit its quotation.');
          closeAlreadyAtWorkshopModal();
          if (onClaimsChanged) {
            await onClaimsChanged();
          }
        } catch (error) {
          message.error(getApiErrorMessage(error, 'Unable to save the workshop assignment.'));
          throw error;
        } finally {
          setSubmittingBooking(false);
        }
      },
    });
  }

  function openWithdrawModal(claim) {
    setSelectedClaim(claim);
    setWithdrawalReason('');
    setWithdrawModalOpen(true);
  }

  async function handleWithdrawClaim() {
    if (!selectedClaim) {
      return;
    }

    if (!withdrawalReason.trim()) {
      message.warning('Please fill in the withdrawal description before continuing.');
      return;
    }

    setSubmittingWithdrawal(true);
    try {
      await withdrawClaim(selectedClaim.id, withdrawalReason.trim());
      message.success(selectedClaim.workshopAppointment ? 'Claim withdrawn and workshop booking cancelled.' : 'Claim withdrawn.');
      closeWithdrawModal();
      if (onClaimsChanged) {
        await onClaimsChanged();
      }
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Unable to withdraw this claim.'));
    } finally {
      setSubmittingWithdrawal(false);
    }
  }

  async function loadWorkshopLinkRequests() {
    setLoadingWorkshopLinkRequests(true);
    try {
      setWorkshopLinkRequests(await getMyCustomerClaimLinkRequests());
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Unable to load workshop link requests.'));
    } finally {
      setLoadingWorkshopLinkRequests(false);
    }
  }

  async function handleAcceptWorkshopLinkRequest(request) {
    setRespondingLinkRequestId(request.requestId);
    try {
      await acceptWorkshopClaimLinkRequest(request.requestId);
      message.success('Workshop link accepted. The workshop can now submit its quotation.');
      await loadWorkshopLinkRequests();
      if (onClaimsChanged) {
        await onClaimsChanged();
      }
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Unable to accept this workshop link request.'));
    } finally {
      setRespondingLinkRequestId(null);
    }
  }

  function openRejectLinkRequestModal(request) {
    setRejectLinkRequest(request);
    setLinkRequestRejectionReason('');
  }

  async function handleRejectWorkshopLinkRequest() {
    if (!rejectLinkRequest) {
      return;
    }

    setRespondingLinkRequestId(rejectLinkRequest.requestId);
    try {
      await rejectWorkshopClaimLinkRequest(rejectLinkRequest.requestId, linkRequestRejectionReason.trim());
      message.success('Workshop link request rejected.');
      closeRejectLinkRequestModal();
      await loadWorkshopLinkRequests();
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Unable to reject this workshop link request.'));
    } finally {
      setRespondingLinkRequestId(null);
    }
  }

  function closeRejectLinkRequestModal() {
    setRejectLinkRequest(null);
    setLinkRequestRejectionReason('');
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

  function closeAlreadyAtWorkshopModal() {
    setAlreadyAtWorkshopModalOpen(false);
    setBookingStates([]);
    setAvailableWorkshops([]);
    setSelectedState(undefined);
    setSelectedWorkshopId(undefined);
    setArrivalDate(null);
    setBookingNote('');
    setSelectedClaim(null);
  }

  function closeWithdrawModal() {
    setWithdrawModalOpen(false);
    setWithdrawalReason('');
    setSelectedClaim(null);
  }
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

function getLinkRequestStatusColor(status) {
  switch (String(status || '').toLowerCase()) {
    case 'accepted':
      return 'green';
    case 'rejected':
      return 'red';
    case 'pending':
      return 'orange';
    default:
      return 'default';
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

  if (String(claim.status || '').toLowerCase() === 'withdrawn') {
    return {
      label: 'Withdrawn',
      tagColor: 'default',
      color: '#64748b',
      description: 'This claim was withdrawn, so no payment will be processed.',
    };
  }

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
          ? isAlreadyAtWorkshop(claim.workshopAppointment)
            ? 'Your workshop assignment is saved. The selected workshop can submit its quotation.'
            : 'Your workshop booking is saved. You can update it if needed.'
          : 'Your claim is approved. Book a future workshop visit or record that your vehicle is already at a panel workshop.'
        : claim.workshopRepairEstimate
          ? 'Your quotation has been submitted, so workshop booking details cannot be changed here.'
          : 'Your claim has been approved.';
    case 'rejected':
      return 'Your claim has been rejected.';
    case 'withdrawn':
      return 'You withdrew this claim. It will not continue processing.';
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

function getBookedTimeSlotsForSelection(claims, { selectedClaimId, selectedWorkshopId, preferredDate }) {
  if (!selectedWorkshopId || !preferredDate) {
    return new Set();
  }

  const selectedDate = moment(preferredDate);

  return new Set(
    claims
      .filter((claim) => {
        const appointment = claim.workshopAppointment;

        return (
          appointment &&
          claim.id !== selectedClaimId &&
          appointment.workshopId === selectedWorkshopId &&
          !isAlreadyAtWorkshop(appointment) &&
          String(appointment.status || '').toLowerCase() !== 'cancelled' &&
          appointment.preferredDate &&
          selectedDate.isSame(moment(appointment.preferredDate), 'day') &&
          appointment.timeSlotStart
        );
      })
      .map((claim) => normalizeTimeValue(claim.workshopAppointment.timeSlotStart))
  );
}

function canWithdrawClaim(claim) {
  const withdrawableStatuses = new Set([
    'pending',
    'pending manual review',
    'pending customer action',
    'customer responded',
    'approved',
  ]);

  return (
    withdrawableStatuses.has(String(claim?.status || '').toLowerCase()) &&
    !claim?.workshopRepairEstimate &&
    !claim?.workshopPayment
  );
}

function isAlreadyAtWorkshop(appointment) {
  return String(appointment?.assignmentType || '').toLowerCase() === 'alreadyatworkshop';
}

function getWorkshopAssignmentLabel(appointment) {
  return isAlreadyAtWorkshop(appointment) ? 'Vehicle already at workshop' : 'Workshop booked';
}

function getWorkshopAssignmentDescription(appointment) {
  if (isAlreadyAtWorkshop(appointment)) {
    return `Arrived ${moment(appointment.preferredDate).format('DD MMM YYYY')}`;
  }

  return `${moment(appointment.preferredDate).format('DD MMM YYYY')} | ${formatTimeRange(appointment.timeSlotStart, appointment.timeSlotEnd)}`;
}

function getApiErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.title ||
    (typeof error?.response?.data === 'string' ? error.response.data : null) ||
    error?.message ||
    fallbackMessage
  );
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
