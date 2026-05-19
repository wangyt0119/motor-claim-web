import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import { BankOutlined, ShopOutlined, UserOutlined } from '@ant-design/icons';
import { getMyProfile, updateMyProfile } from '../services/authService';
import { updateMyWorkshopProfile } from '../services/workshopService';

const { Title, Text } = Typography;

const idTypeOptions = [
  { label: 'NRIC', value: 1 },
  { label: 'Passport', value: 2 },
];

const mobileCountryOptions = [
  { label: 'Singapore', value: 1 },
  { label: 'Cambodia', value: 2 },
  { label: 'Indonesia', value: 3 },
  { label: 'Malaysia', value: 4 },
  { label: 'Philippines', value: 5 },
];

function ProfileScreen({ heading = 'Profile', description = 'Review your account details.', theme = 'default', fallbackProfile = null }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [workshopModalOpen, setWorkshopModalOpen] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingWorkshop, setSavingWorkshop] = useState(false);
  const [accountForm] = Form.useForm();
  const [workshopForm] = Form.useForm();

  const selectedIdType = Form.useWatch('idType', accountForm);
  const isSoftTheme = theme === 'workshop' || theme === 'customer';
  const profileLabel = theme === 'workshop' ? 'Workshop Profile' : 'My Profile';

  const workshopPhoneText = useMemo(
    () => (Array.isArray(profile?.workshop?.phone) ? profile.workshop.phone.join(', ') : ''),
    [profile]
  );

  const workshopEmailText = useMemo(
    () => (Array.isArray(profile?.workshop?.email) ? profile.workshop.email.join(', ') : ''),
    [profile]
  );

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMyProfile();
      setProfile(result || normalizeFallbackProfile(fallbackProfile));
    } catch (error) {
      const fallback = normalizeFallbackProfile(fallbackProfile);
      if (fallback) {
        setProfile(fallback);
      }
      message.error(error?.response?.data?.message || error?.message || 'Unable to load profile details.');
    } finally {
      setLoading(false);
    }
  }, [fallbackProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function openAccountEditor() {
    if (!profile) {
      return;
    }

    accountForm.setFieldsValue({
      fullName: profile.fullName,
      idType: profile.idType,
      nric: profile.nric,
      passportNo: profile.passportNo,
      issueCountry: profile.issueCountry,
      mobileCountry: profile.mobileCountry,
      mobileNumber: profile.mobileNumber,
      email: profile.email,
    });
    setAccountModalOpen(true);
  }

  function openWorkshopEditor() {
    if (!profile?.workshop) {
      return;
    }

    workshopForm.setFieldsValue({
      name: profile.workshop.name,
      state: profile.workshop.state,
      address: profile.workshop.address,
      phone: workshopPhoneText,
      fax: profile.workshop.fax,
      email: workshopEmailText,
      bankName: profile.workshop.bankName,
      bankAccountNumber: profile.workshop.bankAccountNumber,
      bankAccountHolderName: profile.workshop.bankAccountHolderName,
    });
    setWorkshopModalOpen(true);
  }

  async function handleSaveAccount() {
    const values = await accountForm.validateFields();
    setSavingAccount(true);

    try {
      const updated = await updateMyProfile({
        fullName: values.fullName,
        idType: profile.idType,
        nric: Number(profile.idType) === 1 ? profile.nric : null,
        passportNo: values.idType === 2 ? values.passportNo : null,
        issueCountry: values.idType === 2 ? values.issueCountry : null,
        mobileCountry: values.mobileCountry,
        mobileNumber: values.mobileNumber,
        email: profile.email,
      });

      setProfile(updated);
      setAccountModalOpen(false);
      message.success('Profile updated.');
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Unable to update your profile.');
    } finally {
      setSavingAccount(false);
    }
  }

  async function handleSaveWorkshop() {
    const values = await workshopForm.validateFields();
    setSavingWorkshop(true);

    try {
      const updatedWorkshop = await updateMyWorkshopProfile({
        name: values.name,
        state: values.state,
        address: values.address,
        phone: parseCommaSeparatedText(values.phone),
        fax: values.fax || null,
        email: Array.isArray(profile.workshop.email) ? profile.workshop.email : [],
        bankName: values.bankName || null,
        bankAccountNumber: values.bankAccountNumber || null,
        bankAccountHolderName: values.bankAccountHolderName || null,
      });

      setProfile((current) => (current ? { ...current, workshop: updatedWorkshop } : current));
      setWorkshopModalOpen(false);
      message.success('Workshop profile updated.');
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Unable to update workshop details.');
    } finally {
      setSavingWorkshop(false);
    }
  }

  return (
    <div className="portal-dashboard-stack">
      <div className={`portal-dashboard-hero${isSoftTheme ? ' portal-dashboard-theme-soft' : ''}`}>
        <div className="portal-dashboard-hero-content">
          <span className={`portal-dashboard-kicker${isSoftTheme ? ' portal-dashboard-kicker-soft' : ''}`}>
            {profileLabel}
          </span>
          <Title level={2} className="portal-dashboard-title">{heading}</Title>
          <Text className="portal-dashboard-description">{description}</Text>
          {theme === 'workshop' ? (
            <div className="portal-dashboard-chip-row">
              <div className={`portal-dashboard-chip${isSoftTheme ? ' portal-dashboard-chip-soft' : ''}`}>
                <span className="portal-dashboard-chip-label">Account</span>
                <span className="portal-dashboard-chip-value">{profile?.fullName ? 'Ready' : 'Pending'}</span>
              </div>
              <div className={`portal-dashboard-chip${isSoftTheme ? ' portal-dashboard-chip-soft' : ''}`}>
                <span className="portal-dashboard-chip-label">Workshop</span>
                <span className="portal-dashboard-chip-value">{profile?.workshop?.name ? 'Connected' : 'Unavailable'}</span>
              </div>
              <div className={`portal-dashboard-chip${isSoftTheme ? ' portal-dashboard-chip-soft' : ''}`}>
                <span className="portal-dashboard-chip-label">Bank</span>
                <span className="portal-dashboard-chip-value">{profile?.workshop?.bankName ? 'Saved' : 'Pending'}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Spin />
          </div>
        ) : !profile ? (
          <Card className="portal-dashboard-card" style={{ borderRadius: 16 }}>
            <Empty description="Profile not available">
              <Button type="primary" onClick={loadProfile}>Reload Profile</Button>
            </Empty>
          </Card>
        ) : (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card
              title={
                <Space>
                  <UserOutlined />
                  <span>Account Details</span>
                </Space>
              }
              extra={<Button onClick={openAccountEditor}>Edit</Button>}
              className="portal-dashboard-card"
              style={{ borderRadius: 16 }}
            >
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Full name">{profile.fullName || 'Not available'}</Descriptions.Item>
                <Descriptions.Item label="Email">{profile.email || 'Not available'}</Descriptions.Item>
                <Descriptions.Item label="Mobile number">{profile.mobileNumber || 'Not available'}</Descriptions.Item>
                <Descriptions.Item label="Role">
                  <Tag color="blue">{formatRole(profile.role)}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="ID type">{formatIdType(profile.idType)}</Descriptions.Item>
                <Descriptions.Item label="NRIC">{profile.nric || 'Not available'}</Descriptions.Item>
                <Descriptions.Item label="Passport no">{profile.passportNo || 'Not available'}</Descriptions.Item>
                <Descriptions.Item label="Issue country">{profile.issueCountry || 'Not available'}</Descriptions.Item>
                <Descriptions.Item label="Maybank employee">{profile.isMaybankGroupEmployee ? 'Yes' : 'No'}</Descriptions.Item>
              </Descriptions>
            </Card>

            {profile.workshop ? (
              <Card
                title={
                  <Space>
                    <ShopOutlined />
                    <span>Workshop Details</span>
                  </Space>
                }
                extra={<Button onClick={openWorkshopEditor}>Edit</Button>}
                className="portal-dashboard-card"
                style={{ borderRadius: 16 }}
              >
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Workshop name">{profile.workshop.name || 'Not available'}</Descriptions.Item>
                  <Descriptions.Item label="State">{profile.workshop.state || 'Not available'}</Descriptions.Item>
                  <Descriptions.Item label="Address">{profile.workshop.address || 'Not available'}</Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    {Array.isArray(profile.workshop.phone) && profile.workshop.phone.length
                      ? profile.workshop.phone.join(', ')
                      : 'Not available'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Fax">{profile.workshop.fax || 'Not available'}</Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {Array.isArray(profile.workshop.email) && profile.workshop.email.length
                      ? profile.workshop.email.join(', ')
                      : 'Not available'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Panel workshop">{profile.workshop.isPanelWorkshop ? 'Yes' : 'No'}</Descriptions.Item>
                  <Descriptions.Item label="Active">{profile.workshop.isActive ? 'Yes' : 'No'}</Descriptions.Item>
                </Descriptions>
              </Card>
            ) : null}

            {profile.workshop ? (
              <Card
                title={
                  <Space>
                    <BankOutlined />
                    <span>Bank Details</span>
                  </Space>
                }
                className="portal-dashboard-card"
                style={{ borderRadius: 16 }}
              >
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Bank name">{profile.workshop.bankName || 'Not available'}</Descriptions.Item>
                  <Descriptions.Item label="Account number">{profile.workshop.bankAccountNumber || 'Not available'}</Descriptions.Item>
                  <Descriptions.Item label="Account holder">{profile.workshop.bankAccountHolderName || 'Not available'}</Descriptions.Item>
                </Descriptions>
                <Alert
                  style={{ marginTop: 16 }}
                  type="info"
                  showIcon
                  message="Payment setup"
                  description="These workshop bank details can be used later for transfer or reimbursement flows."
                />
              </Card>
            ) : null}
          </Space>
        )}
      </div>

      <Modal
        open={accountModalOpen}
        title="Edit Profile"
        onCancel={() => setAccountModalOpen(false)}
        onOk={handleSaveAccount}
        okText="Save Profile"
        confirmLoading={savingAccount}
      >
        <Form form={accountForm} layout="vertical">
          <Form.Item name="fullName" label="Full Name" rules={[{ required: true, message: 'Full name is required.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="idType" label="ID Type" rules={[{ required: true, message: 'ID type is required.' }]}>
            <Select options={idTypeOptions} disabled />
          </Form.Item>
          {selectedIdType === 1 ? (
            <Form.Item name="nric" label="NRIC" rules={[{ required: true, message: 'NRIC is required.' }]}>
              <Input disabled />
            </Form.Item>
          ) : null}
          {selectedIdType === 2 ? (
            <>
              <Form.Item name="passportNo" label="Passport Number" rules={[{ required: true, message: 'Passport number is required.' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="issueCountry" label="Issue Country" rules={[{ required: true, message: 'Issue country is required.' }]}>
                <Input />
              </Form.Item>
            </>
          ) : null}
          <Form.Item name="mobileCountry" label="Mobile Country" rules={[{ required: true, message: 'Mobile country is required.' }]}>
            <Select options={mobileCountryOptions} />
          </Form.Item>
          <Form.Item name="mobileNumber" label="Mobile Number" rules={[{ required: true, message: 'Mobile number is required.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Email is required.' }, { type: 'email', message: 'Enter a valid email.' }]}>
            <Input disabled />
          </Form.Item>
          <Alert
            type="info"
            showIcon
            description="If you need to change your NRIC/Passport or email, Please contact etiqasupport@etiqa.com.my."
          />
        </Form>
      </Modal>

      <Modal
        open={workshopModalOpen}
        title="Edit Workshop Details"
        onCancel={() => setWorkshopModalOpen(false)}
        onOk={handleSaveWorkshop}
        okText="Save Workshop"
        confirmLoading={savingWorkshop}
        width={720}
      >
        <Form form={workshopForm} layout="vertical">
          <Form.Item name="name" label="Workshop Name" rules={[{ required: true, message: 'Workshop name is required.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="state" label="State" rules={[{ required: true, message: 'State is required.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address" rules={[{ required: true, message: 'Address is required.' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="phone" label="Phone Numbers">
            <Input placeholder="Separate multiple phone numbers with commas" />
          </Form.Item>
          <Form.Item name="fax" label="Fax">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Workshop Emails">
            <Input disabled placeholder="Separate multiple email addresses with commas" />
          </Form.Item>
          <Form.Item name="bankName" label="Bank Name">
            <Input />
          </Form.Item>
          <Form.Item name="bankAccountNumber" label="Bank Account Number">
            <Input />
          </Form.Item>
          <Form.Item name="bankAccountHolderName" label="Bank Account Holder Name">
            <Input />
          </Form.Item>
          <Alert
            type="info"
            showIcon
            message="Workshop email changes"
            description="Workshop email cannot be edited here. If you need to change the registered workshop email, please contact etiqasupport@etiqa.com.my."
          />
        </Form>
      </Modal>
    </div>
  );
}

function parseCommaSeparatedText(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeFallbackProfile(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  return {
    userId: user.userId ?? user.UserId ?? null,
    fullName: user.fullName ?? user.FullName ?? '',
    idType: user.idType ?? user.IdType ?? null,
    nric: user.nric ?? user.Nric ?? user.NRIC ?? null,
    passportNo: user.passportNo ?? user.PassportNo ?? null,
    issueCountry: user.issueCountry ?? user.IssueCountry ?? null,
    mobileCountry: user.mobileCountry ?? user.MobileCountry ?? null,
    mobileNumber: user.mobileNumber ?? user.MobileNumber ?? '',
    email: user.email ?? user.Email ?? '',
    isMaybankGroupEmployee: user.isMaybankGroupEmployee ?? user.IsMaybankGroupEmployee ?? false,
    role: user.role ?? user.Role ?? null,
    workshopId: user.workshopId ?? user.WorkshopId ?? null,
    workshop: user.workshop ?? user.Workshop ?? null,
  };
}

function formatRole(role) {
  switch (Number(role)) {
    case 1:
      return 'Customer';
    case 2:
      return 'Officer';
    case 3:
      return 'Admin';
    case 4:
      return 'Panel Workshop';
    default:
      return 'Unknown';
  }
}

function formatIdType(value) {
  if (value === null || value === undefined) {
    return 'Not available';
  }

  if (Number(value) === 1) {
    return 'NRIC';
  }

  if (Number(value) === 2) {
    return 'Passport';
  }

  return String(value);
}

export default ProfileScreen;
