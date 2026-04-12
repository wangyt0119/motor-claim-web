import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  Input,
  List,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  UploadOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { submitCustomerClaimResponse } from '../services/claimService';
import {
  createOrUpdateWorkshopAppointment,
  getPanelWorkshopStates,
  getPanelWorkshopsByState,
} from '../services/workshopService';
import { uploadFileToCloudinary } from '../services/cloudinaryService';
import WorkshopRepairEstimateCard from './WorkshopRepairEstimateCard';

const { Title, Text } = Typography;
const WORKSHOP_PERIODS = ['AM', 'PM'];
const WORKSHOP_SLOT_MINUTES = 30;
const WORKSHOP_TIME_SLOTS = buildWorkshopTimeSlots();

function CustomerClaimTracker({ claims = [], onClaimsChanged }) {
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

  const periodTimeSlots = useMemo(
    () => WORKSHOP_TIME_SLOTS.filter((slot) => slot.period === selectedPeriod),
    [selectedPeriod]
  );

  const sortedClaims = useMemo(
    () => [...claims].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()),
    [claims]
  );

  useEffect(() => {
    if (!bookingModalOpen || !selectedState) {
      return;
    }

    loadWorkshops(selectedState);
  }, [bookingModalOpen, selectedState]);

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Active Claims Tracker</Title>
      <Text type="secondary">Track review progress, respond to officer requests, and book a panel workshop once your claim is approved.</Text>

      <Alert
        showIcon
        type="info"
        style={{ marginTop: 16, marginBottom: 24 }}
        message="Customer workflow"
        description="Pending customer action means the officer wants a reupload or rewritten explanation. Approved vehicle claims can proceed to panel workshop booking directly from this page."
      />

      {sortedClaims.length === 0 ? (
        <Empty description="No active claims found" />
      ) : (
        sortedClaims.map((claim) => (
          <Card key={claim.id} style={{ marginBottom: 16, borderRadius: 16 }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Space wrap>
                <Text strong>{claim.id}</Text>
                <Tag color={getStatusColor(claim.status)}>{claim.status}</Tag>
                <Tag color={claim.isStpApproved ? 'green' : 'orange'}>
                  {claim.isStpApproved ? 'STP Passed' : 'Manual Review'}
                </Tag>
                {claim.reviewStatus ? <Tag color="blue">{formatReviewStatus(claim.reviewStatus)}</Tag> : null}
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

              {claim.workshopRepairEstimate ? (
                <Alert
                  type={claim.workshopRepairEstimate.isStpApproved || claim.workshopRepairEstimate.status === 'Approved' ? 'success' : 'info'}
                  showIcon
                  message={`Workshop submission: ${formatEstimateStatus(claim.workshopRepairEstimate.status)}`}
                  description={`Total amount: RM ${claim.workshopRepairEstimate.totalAmount.toFixed(2)} | Review mode: ${formatEstimateStatus(claim.workshopRepairEstimate.reviewMode)}`}
                />
              ) : null}

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

      <Modal
        open={Boolean(selectedClaim) && !responseModalOpen && !bookingModalOpen}
        onCancel={() => setSelectedClaim(null)}
        footer={null}
        width={780}
        title={selectedClaim ? `Claim ${selectedClaim.id}` : 'Claim details'}
      >
        {selectedClaim ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Status">{selectedClaim.status}</Descriptions.Item>
              <Descriptions.Item label="Review status">{formatReviewStatus(selectedClaim.reviewStatus)}</Descriptions.Item>
              <Descriptions.Item label="Type">{selectedClaim.type}</Descriptions.Item>
              <Descriptions.Item label="Description">{selectedClaim.incidentDescription || 'No description'}</Descriptions.Item>
              <Descriptions.Item label="Officer note">{selectedClaim.officerDecisionNote || 'No officer note provided'}</Descriptions.Item>
            </Descriptions>

            {selectedClaim.requestedItems?.length ? (
              <Card title="Requested by officer">
                <List dataSource={selectedClaim.requestedItems} renderItem={(item) => <List.Item>{item.label}</List.Item>} />
              </Card>
            ) : null}

            {(selectedClaim.customerResponseNote || selectedClaim.responseDocuments?.length) ? (
              <Card title="Your latest response">
                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label="Submitted at">
                    {selectedClaim.respondedAt ? moment(selectedClaim.respondedAt).format('DD MMM YYYY, hh:mm A') : 'Not available'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Note">
                    {selectedClaim.customerResponseNote || 'No note provided'}
                  </Descriptions.Item>
                </Descriptions>
                {selectedClaim.responseDocuments?.length ? (
                  <List
                    style={{ marginTop: 16 }}
                    dataSource={selectedClaim.responseDocuments}
                    renderItem={(url, index) => (
                      <List.Item actions={[<Button key="view" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>View</Button>]}> 
                        <List.Item.Meta title={`Response document ${index + 1}`} description={url} />
                      </List.Item>
                    )}
                  />
                ) : null}
              </Card>
            ) : null}

            {selectedClaim.workshopAppointment ? (
              <Card title="Panel workshop appointment">
                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label="Workshop">{selectedClaim.workshopAppointment.workshopName}</Descriptions.Item>
                  <Descriptions.Item label="State">{selectedClaim.workshopAppointment.workshopState}</Descriptions.Item>
                  <Descriptions.Item label="Address">{selectedClaim.workshopAppointment.workshopAddress}</Descriptions.Item>
                  <Descriptions.Item label="Preferred date">
                    {moment(selectedClaim.workshopAppointment.preferredDate).format('DD MMM YYYY')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Time slot">
                    {formatTimeRange(selectedClaim.workshopAppointment.timeSlotStart, selectedClaim.workshopAppointment.timeSlotEnd)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">{selectedClaim.workshopAppointment.status || 'Pending'}</Descriptions.Item>
                  <Descriptions.Item label="Notes">{selectedClaim.workshopAppointment.notes || 'No notes'}</Descriptions.Item>
                </Descriptions>
              </Card>
            ) : null}

            {selectedClaim.workshopRepairEstimate ? (
              <WorkshopRepairEstimateCard
                estimate={selectedClaim.workshopRepairEstimate}
                emptyDescription="No workshop submission has been sent yet."
              />
            ) : null}
          </Space>
        ) : null}
      </Modal>

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
            description="Panel workshop booking is available only after STP approval or officer approval."
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
        : 'Your claim has been approved.';
    case 'rejected':
      return 'Your claim has been rejected.';
    default:
      return 'Your claim is still under review.';
  }
}

function canBookWorkshop(claim) {
  return claim.status === 'Approved' && Number(claim.allClaimType) === 1;
}

function formatReviewStatus(status) {
  if (!status) {
    return 'Not available';
  }

  return String(status)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (match) => match.toUpperCase());
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

function formatEstimateStatus(value) {
  if (!value) {
    return 'No estimate status';
  }

  return String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export default CustomerClaimTracker;
