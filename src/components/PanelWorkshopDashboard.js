import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  Form,
  Input,
  Layout,
  List,
  Menu,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  AppstoreOutlined,
  CalendarOutlined,
  CarOutlined,
  CloudUploadOutlined,
  DollarOutlined,
  BellOutlined,
  FileSearchOutlined,
  LogoutOutlined,
  ReloadOutlined,
  SearchOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import '../styles/MainScreen.css';
import {
  getApprovedClaimsForPanelWorkshop,
  submitWorkshopRepairEstimate,
} from '../services/workshopService';
import { uploadFileToCloudinary } from '../services/cloudinaryService';
import ProfileScreen from './ProfileScreen';
import WorkshopRepairEstimateCard, { formatEstimateStatus, getEstimateStatusColor } from './WorkshopRepairEstimateCard';
import WorkshopPaymentsScreen from './WorkshopPaymentsScreen';
import WorkshopNotificationScreen from './WorkshopNotificationScreen';

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
      title: 'Total Amount',
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
            disabled={hasSubmittedEstimate(claim)}
            onClick={(event) => {
              event.stopPropagation();
              openEstimateModal(claim);
            }}
          >
            {hasSubmittedEstimate(claim) ? 'Submitted' : 'Submit Quotation'}
          </Button>
        </Space>
      ),
    },
  ];

  const submittedEstimateCount = claims.filter((claim) => claim.workshopRepairEstimate).length;
  const hasSubmittedEstimate = (claim) => Boolean(claim?.workshopRepairEstimate);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={280} theme="light" style={{ boxShadow: '0 0 10px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' }}>
        <div className="logo-container">
          <img src="/assets/etiqalogo.png" alt="Etiqa Logo" style={{ height: 40 }} />
        </div>

        <div className="user-info">
          <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: '#FF6600' }} />
          <div className="user-details">
            <Text strong className="user-name">{currentUser?.fullName || currentUser?.FullName || 'Workshop'}</Text>
            <Text type="secondary" className="user-email">{currentUser?.email || currentUser?.Email || 'Workshop user'}</Text>
          </div>
        </div>

        <div className="sidebar-content">
          <Divider plain orientation="left">
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8 }}>
              MAIN MENU
            </Text>
          </Divider>
          <Menu mode="inline" selectedKeys={[String(selectedIndex)]} className="main-menu">
            <Menu.Item key="0" icon={<AppstoreOutlined />} onClick={() => setSelectedIndex(0)}>
              <span>Bookings</span>
            </Menu.Item>
            <Menu.Item key="1" icon={<DollarOutlined />} onClick={() => setSelectedIndex(1)}>
              <span>Payments</span>
            </Menu.Item>
            <Menu.Item key="2" icon={<BellOutlined />} onClick={() => setSelectedIndex(2)}>
              <span>Notifications</span>
            </Menu.Item>
            <Menu.Item key="3" icon={<UserOutlined />} onClick={() => setSelectedIndex(3)}>
              <span>Profile</span>
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
          {selectedIndex === 0 ? (
            <div className="portal-dashboard-stack">
            <div className="portal-dashboard-hero" style={{ background: 'linear-gradient(135deg, #ff8a00 0%, #ff5fa2 48%, #5b8def 100%)' }}>
              <div className="portal-dashboard-hero-content">
                <span className="portal-dashboard-kicker">Workshop Space</span>
                <Title level={2} className="portal-dashboard-title">
                  Welcome back, {currentUser?.fullName || currentUser?.FullName || 'Workshop'}
                </Title>
                <Text className="portal-dashboard-description">
                  Keep track of customer workshop bookings, appointments, and quotation submissions in one easy dashboard.
                </Text>
                <div className="portal-dashboard-chip-row">
                  <div className="portal-dashboard-chip">
                    <span className="portal-dashboard-chip-label">Assigned Claims</span>
                    <span className="portal-dashboard-chip-value">{claims.length}</span>
                  </div>
                  <div className="portal-dashboard-chip">
                    <span className="portal-dashboard-chip-label">Today</span>
                    <span className="portal-dashboard-chip-value">{todayClaims.length}</span>
                  </div>
                  <div className="portal-dashboard-chip">
                    <span className="portal-dashboard-chip-label">Submitted</span>
                    <span className="portal-dashboard-chip-value">{submittedEstimateCount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="portal-dashboard-grid">
              <div className="portal-dashboard-span-3">
                <WorkshopMetricCard
                  label="Assigned Claims"
                  value={claims.length}
                  subtitle="Approved claims sent to your workshop"
                  icon={<FileSearchOutlined />}
                  background="linear-gradient(135deg, #fff4e8 0%, #ffe2ca 100%)"
                  accent="#ea580c"
                />
              </div>
              <div className="portal-dashboard-span-3">
                <WorkshopMetricCard
                  label="Upcoming Appointments"
                  value={upcomingClaims.length}
                  subtitle="Bookings already scheduled"
                  icon={<CalendarOutlined />}
                  background="linear-gradient(135deg, #eef4ff 0%, #d9e7ff 100%)"
                  accent="#2563eb"
                />
              </div>
              <div className="portal-dashboard-span-3">
                <WorkshopMetricCard
                  label="Today"
                  value={todayClaims.length}
                  subtitle="Customers expected today"
                  icon={<CarOutlined />}
                  background="linear-gradient(135deg, #edfdf3 0%, #d6f8e1 100%)"
                  accent="#16a34a"
                />
              </div>
              <div className="portal-dashboard-span-3">
                <WorkshopMetricCard
                  label="Submitted"
                  value={submittedEstimateCount}
                  subtitle="Quotations already uploaded"
                  icon={<ToolOutlined />}
                  background="linear-gradient(135deg, #f7efff 0%, #ecdfff 100%)"
                  accent="#7c3aed"
                />
              </div>
            </div>

            <div className="portal-dashboard-grid">
              <div className="portal-dashboard-span-8">
                <Card className="portal-dashboard-card">
                  <div className="portal-dashboard-card-header">
                    <div>
                      <Title level={4} className="portal-dashboard-card-title">Customer Bookings</Title>
                      <Text className="portal-dashboard-card-subtitle">Review bookings and upload quotation details for officer review</Text>
                    </div>
                  </div>
                  <div className="portal-dashboard-toolbar" style={{ marginBottom: 16 }}>
                    <div className="portal-dashboard-toolbar-main">
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search claim, customer, coverage, date or time"
                  style={{ width: 420 }}
                />
                    </div>
                    <div className="portal-dashboard-toolbar-main">
                      <Button icon={<ReloadOutlined />} onClick={refreshClaims} loading={loading}>
                        Refresh
                      </Button>
                    </div>
                  </div>

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
              </div>

              <div className="portal-dashboard-span-4">
                <Card className="portal-dashboard-card">
                  <div className="portal-dashboard-card-header">
                    <div>
                      <Title level={4} className="portal-dashboard-card-title">Workshop Notes</Title>
                      <Text className="portal-dashboard-card-subtitle">A quick reminder for smooth submissions</Text>
                    </div>
                  </div>
                  <div className="portal-dashboard-list">
                    <div className="portal-dashboard-list-item portal-dashboard-list-item-soft">
                      <div className="portal-dashboard-list-meta">
                        <Text strong>Upload quotation first</Text>
                        <Text type="secondary">Include the repair amount and main quotation file for review.</Text>
                      </div>
                    </div>
                    <div className="portal-dashboard-list-item portal-dashboard-list-item-soft">
                      <div className="portal-dashboard-list-meta">
                        <Text strong>Add supporting files</Text>
                        <Text type="secondary">Photos, breakdowns, or receipts help the officer validate faster.</Text>
                      </div>
                    </div>
                    <div className="portal-dashboard-highlight">
                      <Text strong>Fast summary</Text>
                      <Text type="secondary" style={{ display: 'block', marginTop: 6 }}>
                        Once a quotation is submitted, it is locked and can no longer be changed from the workshop portal.
                      </Text>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            </div>
          ) : selectedIndex === 1 ? (
            <WorkshopPaymentsScreen scope="workshop" claims={claims} />
          ) : selectedIndex === 2 ? (
            <WorkshopNotificationScreen claims={claims} currentUser={currentUser} />
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
                {hasSubmittedEstimate(selectedClaim) ? (
                  <Tag color="green" style={{ padding: '6px 12px', borderRadius: 999 }}>
                    Quotation already submitted
                  </Tag>
                ) : (
                  <Button
                    type="primary"
                    icon={<CloudUploadOutlined />}
                    onClick={() => openEstimateModal(selectedClaim)}
                  >
                    Submit Quotation
                  </Button>
                )}
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
            label="Total Amount (RM)"
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
    if (hasSubmittedEstimate(claim)) {
      message.info('This quotation has already been submitted and can no longer be updated.');
      return;
    }

    setSelectedClaim(claim);
    estimateForm.setFieldsValue({
      totalAmount: 0,
      remarks: '',
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

    if (hasSubmittedEstimate(selectedClaim)) {
      message.info('This quotation has already been submitted and can no longer be updated.');
      closeEstimateModal();
      return;
    }

    const values = await estimateForm.validateFields();

    if (receiptDocumentFiles.length === 0) {
      message.warning('Please upload the receipt or quotation document.');
      return;
    }

    setSubmittingEstimate(true);
    try {
      let receiptOrQuotationDocument = null;
      let supportingDocuments = [];

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

function WorkshopMetricCard({ label, value, subtitle, icon, background, accent }) {
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

export default PanelWorkshopDashboard;
