import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  Layout,
  List,
  Modal,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  CalendarOutlined,
  CarOutlined,
  CloudUploadOutlined,
  FileSearchOutlined,
  LogoutOutlined,
  ReloadOutlined,
  SearchOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import {
  getApprovedClaimsForPanelWorkshop,
  submitWorkshopRepairEstimate,
} from '../services/workshopService';
import { uploadFileToCloudinary } from '../services/cloudinaryService';
import ProfileScreen from './ProfileScreen';
import WorkshopRepairEstimateCard, { formatEstimateStatus, getEstimateStatusColor } from './WorkshopRepairEstimateCard';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

function PanelWorkshopDashboard({ currentUser, onSignOut }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [estimateModalOpen, setEstimateModalOpen] = useState(false);
  const [submittingEstimate, setSubmittingEstimate] = useState(false);
  const [receiptDocumentFiles, setReceiptDocumentFiles] = useState([]);
  const [supportingDocumentFiles, setSupportingDocumentFiles] = useState([]);
  const [estimateForm] = Form.useForm();

  useEffect(() => {
    refreshClaims();
  }, []);

  async function refreshClaims() {
    setLoading(true);
    try {
      const result = await getApprovedClaimsForPanelWorkshop();
      setClaims(result);
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.title ||
          (typeof error?.response?.data === 'string' ? error.response.data : null) ||
          error?.message ||
          'Unable to load approved workshop claims.'
      );
    } finally {
      setLoading(false);
    }
  }

  const upcomingClaims = useMemo(
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

  const todayClaims = useMemo(
    () =>
      upcomingClaims.filter((claim) =>
        moment(claim.workshopAppointment.preferredDate).isSame(moment(), 'day')
      ),
    [upcomingClaims]
  );

  const filteredClaims = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    if (!normalizedSearch) {
      return upcomingClaims;
    }

    return upcomingClaims.filter((claim) => {
      const haystack = [
        claim.id,
        claim.userId,
        claim.coverageId,
        claim.type,
        claim.status,
        claim.incidentDescription,
        claim.workshopAppointment?.preferredDate
          ? moment(claim.workshopAppointment.preferredDate).format('DD MMM YYYY')
          : '',
        formatTimeRange(claim.workshopAppointment?.timeSlotStart, claim.workshopAppointment?.timeSlotEnd),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [searchText, upcomingClaims]);

  const columns = [
    {
      title: 'Customer Booking',
      key: 'booking',
      width: 260,
      render: (_, claim) => (
        <Space direction="vertical" size={2}>
          <Text strong>{claim.id}</Text>
          <Text type="secondary">Customer: {claim.userId || 'Not available'}</Text>
          <Text type="secondary">Coverage: {claim.coverageId || 'Not available'}</Text>
        </Space>
      ),
    },
    {
      title: 'Claim Type',
      dataIndex: 'type',
      key: 'type',
      width: 180,
      render: (value) => value || 'Vehicle claim',
    },
    {
      title: 'Claim Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value) => <Tag color="green">{value || 'Approved'}</Tag>,
    },
    {
      title: 'Estimate',
      key: 'estimate',
      width: 180,
      render: (_, claim) =>
        claim.workshopRepairEstimate ? (
          <Space direction="vertical" size={2}>
            <Tag color={getEstimateStatusColor(claim.workshopRepairEstimate.status)}>
              {formatEstimateStatus(claim.workshopRepairEstimate.status)}
            </Tag>
            <Text type="secondary">RM {claim.workshopRepairEstimate.totalAmount.toFixed(2)}</Text>
          </Space>
        ) : (
          <Tag>Not submitted</Tag>
        ),
    },
    {
      title: 'Workshop Date',
      key: 'preferredDate',
      width: 170,
      render: (_, claim) =>
        claim.workshopAppointment?.preferredDate
          ? moment(claim.workshopAppointment.preferredDate).format('DD MMM YYYY')
          : 'Not booked',
    },
    {
      title: 'Time Slot',
      key: 'timeSlot',
      width: 150,
      render: (_, claim) => formatTimeRange(claim.workshopAppointment?.timeSlotStart, claim.workshopAppointment?.timeSlotEnd),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 240,
      render: (_, claim) => (
        <Space wrap>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              setSelectedClaim(claim);
            }}
          >
            View
          </Button>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              openEstimateModal(claim);
            }}
          >
            {claim.workshopRepairEstimate ? 'Update Submission' : 'Submit Quotation'}
          </Button>
        </Space>
      ),
    },
  ];

  const submittedEstimateCount = claims.filter((claim) => claim.workshopRepairEstimate).length;

  const buildNavItem = ({ index, title, subtitle }) => (
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={280} theme="light" style={{ boxShadow: '0 0 10px rgba(0,0,0,0.08)' }}>
        <div style={{ padding: '24px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <img src="/assets/etiqalogo.png" alt="Etiqa Logo" style={{ height: 40 }} />
        </div>

        <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
          <Avatar size={40} icon={<ToolOutlined />} style={{ backgroundColor: '#FF6600' }} />
          <div style={{ marginLeft: 12 }}>
            <Text strong style={{ display: 'block' }}>{currentUser?.fullName || currentUser?.FullName || 'Panel Workshop'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{currentUser?.email || currentUser?.Email || 'Workshop account'}</Text>
          </div>
        </div>

        <div style={{ paddingTop: 12 }}>
          {buildNavItem({ index: 0, title: 'Bookings', subtitle: 'Assigned customer claims and estimates' })}
          {buildNavItem({ index: 1, title: 'Profile', subtitle: 'Workshop details and bank account' })}
        </div>

        <div style={{ padding: 16, marginTop: 'auto' }}>
          <Button icon={<LogoutOutlined />} block onClick={onSignOut}>Sign Out</Button>
        </div>
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>Panel Workshop Dashboard</Title>
        </Header>

        <Content style={{ padding: 24 }}>
          {selectedIndex === 0 ? (
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <div>
              <Title level={2} style={{ marginBottom: 6 }}>Customer Workshop Bookings</Title>
              <Text type="secondary">
                Customers listed here chose your workshop after their vehicle claim was approved.
              </Text>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  Use <Text strong>Submit Quotation</Text> to send the repair amount and supporting documents for officer review.
                </Text>
              </div>
            </div>

            <Space size={16} wrap>
              <Card style={{ borderRadius: 16, minWidth: 220 }}>
                <Statistic title="Assigned Claims" value={claims.length} prefix={<FileSearchOutlined />} />
              </Card>
              <Card style={{ borderRadius: 16, minWidth: 220 }}>
                <Statistic title="Upcoming Appointments" value={upcomingClaims.length} prefix={<CalendarOutlined />} />
              </Card>
              <Card style={{ borderRadius: 16, minWidth: 220 }}>
                <Statistic title="Today" value={todayClaims.length} prefix={<CarOutlined />} />
              </Card>
              <Card style={{ borderRadius: 16, minWidth: 220 }}>
                <Statistic title="Estimates Submitted" value={submittedEstimateCount} prefix={<ToolOutlined />} />
              </Card>
            </Space>

            <Card style={{ borderRadius: 16 }}>
              <Space style={{ width: '100%', marginBottom: 16, justifyContent: 'space-between' }} wrap>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search claim, customer, coverage, date or time"
                  style={{ width: 420 }}
                />
                <Button icon={<ReloadOutlined />} onClick={refreshClaims} loading={loading}>
                  Refresh
                </Button>
              </Space>

              <Table
                dataSource={filteredClaims}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 8 }}
                scroll={{ x: 1100 }}
                onRow={(claim) => ({
                  onClick: (event) => {
                    if (event.target.closest('button')) {
                      return;
                    }
                    setSelectedClaim(claim);
                  },
                  style: { cursor: 'pointer' },
                })}
                locale={{ emptyText: <Empty description="No approved claims are assigned to this workshop yet" /> }}
              />
            </Card>
            </Space>
          ) : (
            <ProfileScreen
              heading="Workshop Profile"
              description="Review your workshop account details, workshop record, and bank details."
            />
          )}
        </Content>
      </Layout>

      <Modal
        open={Boolean(selectedClaim) && !estimateModalOpen}
        onCancel={() => setSelectedClaim(null)}
        footer={null}
        width={820}
        title={selectedClaim ? `Claim ${selectedClaim.id}` : 'Claim details'}
      >
        {selectedClaim ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Claim status">{selectedClaim.status}</Descriptions.Item>
              <Descriptions.Item label="Claim type">{selectedClaim.type}</Descriptions.Item>
              <Descriptions.Item label="Vehicle no">{selectedClaim.coverage?.vehicleNo || 'Not available'}</Descriptions.Item>
              <Descriptions.Item label="Coverage type">{selectedClaim.coverage?.coverageType || 'Not available'}</Descriptions.Item>
              <Descriptions.Item label="Incident date">
                {selectedClaim.incidentDate ? moment(selectedClaim.incidentDate).format('DD MMM YYYY') : 'Not available'}
              </Descriptions.Item>
              <Descriptions.Item label="Incident description">{selectedClaim.incidentDescription || 'No description'}</Descriptions.Item>
            </Descriptions>

            {selectedClaim.workshopAppointment ? (
              <Card title="Workshop appointment">
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Workshop">{selectedClaim.workshopAppointment.workshopName}</Descriptions.Item>
                  <Descriptions.Item label="Date">{moment(selectedClaim.workshopAppointment.preferredDate).format('DD MMM YYYY')}</Descriptions.Item>
                  <Descriptions.Item label="Time slot">{formatTimeRange(selectedClaim.workshopAppointment.timeSlotStart, selectedClaim.workshopAppointment.timeSlotEnd)}</Descriptions.Item>
                  <Descriptions.Item label="Status">{selectedClaim.workshopAppointment.status || 'Pending'}</Descriptions.Item>
                  <Descriptions.Item label="Notes">{selectedClaim.workshopAppointment.notes || 'No notes'}</Descriptions.Item>
                </Descriptions>
              </Card>
            ) : null}

            <WorkshopRepairEstimateCard estimate={selectedClaim.workshopRepairEstimate} />

            <Card title="Workshop Actions">
              <Space wrap>
                <Button
                  type="primary"
                  icon={<CloudUploadOutlined />}
                  onClick={() => openEstimateModal(selectedClaim)}
                >
                  {selectedClaim.workshopRepairEstimate ? 'Update Submission' : 'Submit Quotation'}
                </Button>
              </Space>
            </Card>

            <Card title="Uploaded documents">
              {selectedClaim.documents?.length ? (
                <List
                  dataSource={selectedClaim.documents}
                  renderItem={(document) => (
                    <List.Item actions={[<Button key="open" onClick={() => window.open(document.url, '_blank', 'noopener,noreferrer')}>Open</Button>]}> 
                      <List.Item.Meta title={document.label} description={document.url} />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="No documents returned by the backend" />
              )}
            </Card>
          </Space>
        ) : null}
      </Modal>

      <Modal
        open={estimateModalOpen}
        onCancel={closeEstimateModal}
        onOk={handleSubmitEstimate}
        okText="Save Submission"
        confirmLoading={submittingEstimate}
        width={760}
        title={selectedClaim ? `Quotation Submission for ${selectedClaim.id}` : 'Quotation submission'}
      >
        <Form form={estimateForm} layout="vertical">
          <Form.Item
            name="totalAmount"
            label="Total Amount"
            rules={[{ required: true, message: 'Total amount is required.' }]}
          >
            <Input type="number" min={0} step="0.01" />
          </Form.Item>
          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Receipt / Quotation Document" required>
            <Upload beforeUpload={() => false} fileList={receiptDocumentFiles} onChange={({ fileList }) => setReceiptDocumentFiles(fileList)} maxCount={1}>
              <Button icon={<CloudUploadOutlined />}>Choose Receipt / Quotation</Button>
            </Upload>
          </Form.Item>
          <Form.Item label="Supporting Documents">
            <Upload beforeUpload={() => false} fileList={supportingDocumentFiles} onChange={({ fileList }) => setSupportingDocumentFiles(fileList)} multiple>
              <Button icon={<CloudUploadOutlined />}>Choose Supporting Documents</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );

  function openEstimateModal(claim) {
    setSelectedClaim(claim);
    const estimate = claim?.workshopRepairEstimate;
    estimateForm.setFieldsValue({
      totalAmount: estimate?.totalAmount ?? 0,
      remarks: estimate?.remarks ?? '',
    });
    setReceiptDocumentFiles([]);
    setSupportingDocumentFiles([]);
    setEstimateModalOpen(true);
  }

  function closeEstimateModal() {
    setEstimateModalOpen(false);
    setReceiptDocumentFiles([]);
    setSupportingDocumentFiles([]);
    estimateForm.resetFields();
    setSelectedClaim(null);
  }

  async function handleSubmitEstimate() {
    if (!selectedClaim) {
      return;
    }

    const values = await estimateForm.validateFields();

    if (!selectedClaim.workshopRepairEstimate && receiptDocumentFiles.length === 0) {
      message.warning('Please upload the receipt or quotation document.');
      return;
    }

    setSubmittingEstimate(true);
    try {
      let receiptOrQuotationDocument = selectedClaim.workshopRepairEstimate?.receiptOrQuotationDocument || null;
      let supportingDocuments = selectedClaim.workshopRepairEstimate?.supportingDocuments || [];

      if (receiptDocumentFiles.length > 0) {
        receiptOrQuotationDocument = await uploadFileToCloudinary(receiptDocumentFiles[0].originFileObj ?? receiptDocumentFiles[0]);
      }

      if (supportingDocumentFiles.length > 0) {
        supportingDocuments = [];
        for (const file of supportingDocumentFiles) {
          supportingDocuments.push(await uploadFileToCloudinary(file.originFileObj ?? file));
        }
      }

      await submitWorkshopRepairEstimate({
        claimId: selectedClaim.id,
        totalAmount: Number(values.totalAmount || 0),
        receiptOrQuotationDocument,
        supportingDocuments,
        remarks: values.remarks || null,
      });

      message.success('Workshop submission saved.');
      closeEstimateModal();
      await refreshClaims();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.title ||
          (typeof error?.response?.data === 'string' ? error.response.data : null) ||
          error?.message ||
          'Unable to save the repair estimate.'
      );
    } finally {
      setSubmittingEstimate(false);
    }
  }
}

function formatTimeRange(start, end) {
  if (!start || !end) {
    return 'Not available';
  }

  const normalize = (value) => String(value).slice(0, 5);
  return `${moment(normalize(start), 'HH:mm').format('hh:mm A')} - ${moment(normalize(end), 'HH:mm').format('hh:mm A')}`;
}

export default PanelWorkshopDashboard;
