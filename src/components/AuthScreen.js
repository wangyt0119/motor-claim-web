import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  Radio,
  Row,
  Select,
  Space,
  Tabs,
  Typography,
} from 'antd';
import { LockOutlined, LoginOutlined, MailOutlined, UserAddOutlined, UserOutlined } from '@ant-design/icons';
import { loginCustomer, registerCustomer } from '../services/authService';
import '../styles/AuthScreen.css';
import { USER_ROLE, normalizeRole } from '../constants/userRoles';

const { Title, Text, Paragraph } = Typography;

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

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.title ||
    error?.message ||
    fallbackMessage
  );
}

function AuthScreen({ onAuthenticated }) {
  const [activeTab, setActiveTab] = useState('login');
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const selectedIdType = Form.useWatch('idType', registerForm);

  const registerInitialValues = useMemo(
    () => ({
      idType: 1,
      mobileCountry: 4,
      isMaybankGroupEmployee: false,
    }),
    []
  );

  const handleLogin = async (values) => {
    setLoginLoading(true);
    setLoginError('');

    try {
      const session = await loginCustomer({
        email: values.email,
        password: values.password,
      });

      const role = normalizeRole(session?.user?.role ?? session?.user?.Role);

      if (role !== USER_ROLE.Customer) {
        throw new Error('Only customer accounts can access this portal.');
      }

      onAuthenticated(session);
    } catch (error) {
      setLoginError(getErrorMessage(error, 'Unable to sign in. Please check your email and password.'));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (values) => {
    setRegisterLoading(true);
    setRegisterError('');

    const payload = {
      fullName: values.fullName,
      idType: values.idType,
      nric: values.idType === 1 ? values.nric : null,
      passportNo: values.idType === 2 ? values.passportNo : null,
      issueCountry: values.idType === 2 ? values.issueCountry : null,
      mobileCountry: values.mobileCountry,
      mobileNumber: values.mobileNumber,
      email: values.email,
      isMaybankGroupEmployee: Boolean(values.isMaybankGroupEmployee),
      password: values.password,
    };

    try {
      await registerCustomer(payload);
      const session = await loginCustomer({
        email: values.email,
        password: values.password,
      });

      const role = normalizeRole(session?.user?.role ?? session?.user?.Role);

      if (role !== USER_ROLE.Customer) {
        throw new Error('Only customer accounts can access this portal.');
      }

      onAuthenticated(session);
    } catch (error) {
      setRegisterError(getErrorMessage(error, 'Unable to create your account right now.'));
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-screen__backdrop" />
      <div className="auth-screen__content">
        <div className="auth-screen__intro">
          <img
            src={`${process.env.PUBLIC_URL}/assets/etiqalogo.png`}
            alt="Etiqa Logo"
            className="auth-screen__logo"
          />
          <Text className="auth-screen__eyebrow">Customer Access Portal</Text>
          <Title level={1} className="auth-screen__title">
            Access your motor claim account
          </Title>
          <Paragraph className="auth-screen__description">
            Sign in to track claims, or create a new account to submit and manage your motor insurance claim journey.
          </Paragraph>

          <Space direction="vertical" size={18} className="auth-screen__highlights">
            <div className="auth-screen__highlight">
              <div className="auth-screen__highlightBar" />
              <div>
                <Text strong>Secure customer sign-in</Text>
                <div>
                  <Text type="secondary">Email and password access for the customer portal.</Text>
                </div>
              </div>
            </div>
            <div className="auth-screen__highlight">
              <div className="auth-screen__highlightBar" />
              <div>
                <Text strong>Guided registration</Text>
                <div>
                  <Text type="secondary">Collects the fields required by your backend `UserEntity` model.</Text>
                </div>
              </div>
            </div>
          </Space>
        </div>

        <Card className="auth-card" bordered={false}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'login',
                label: 'Login',
                children: (
                  <Form
                    form={loginForm}
                    layout="vertical"
                    onFinish={handleLogin}
                    requiredMark={false}
                    className="auth-form"
                  >
                    <Title level={3} className="auth-form__title">
                      Welcome back
                    </Title>
                    <Text type="secondary">Use your registered email and password to continue.</Text>

                    <Divider />

                    {loginError ? <Alert type="error" showIcon message={loginError} /> : null}

                    <Form.Item
                      label="Email"
                      name="email"
                      rules={[
                        { required: true, message: 'Please enter your email.' },
                        { type: 'email', message: 'Please enter a valid email address.' },
                      ]}
                    >
                      <Input
                        prefix={<MailOutlined />}
                        placeholder="name@email.com"
                        size="large"
                        autoComplete="email"
                      />
                    </Form.Item>

                    <Form.Item
                      label="Password"
                      name="password"
                      rules={[{ required: true, message: 'Please enter your password.' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="Enter your password"
                        size="large"
                        autoComplete="current-password"
                      />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      icon={<LoginOutlined />}
                      loading={loginLoading}
                      block
                    >
                      Sign In
                    </Button>
                  </Form>
                ),
              },
              {
                key: 'register',
                label: 'Register',
                children: (
                  <Form
                    form={registerForm}
                    layout="vertical"
                    onFinish={handleRegister}
                    requiredMark={false}
                    initialValues={registerInitialValues}
                    className="auth-form"
                  >
                    <Title level={3} className="auth-form__title">
                      Create your account
                    </Title>
                    <Text type="secondary">Fill in your details to register for customer portal access.</Text>

                    <Divider />

                    {registerError ? <Alert type="error" showIcon message={registerError} /> : null}

                    <Row gutter={16}>
                      <Col xs={24}>
                        <Form.Item
                          label="Full Name"
                          name="fullName"
                          rules={[{ required: true, message: 'Please enter your full name.' }]}
                        >
                          <Input
                            prefix={<UserOutlined />}
                            placeholder="Full name"
                            size="large"
                            autoComplete="name"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24}>
                        <Form.Item
                          label="ID Type"
                          name="idType"
                          rules={[{ required: true, message: 'Please choose an ID type.' }]}
                        >
                          <Radio.Group
                            options={idTypeOptions}
                            optionType="button"
                            buttonStyle="solid"
                            className="auth-form__radioGroup"
                          />
                        </Form.Item>
                      </Col>

                      {selectedIdType === 1 ? (
                        <Col xs={24}>
                          <Form.Item
                            label="NRIC"
                            name="nric"
                            rules={[{ required: true, message: 'Please enter the NRIC.' }]}
                          >
                            <Input placeholder="NRIC number" size="large" />
                          </Form.Item>
                        </Col>
                      ) : null}

                      {selectedIdType === 2 ? (
                        <>
                          <Col xs={24} md={12}>
                            <Form.Item
                              label="Passport Number"
                              name="passportNo"
                              rules={[{ required: true, message: 'Please enter the passport number.' }]}
                            >
                              <Input placeholder="Passport number" size="large" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item
                              label="Issue Country"
                              name="issueCountry"
                              rules={[{ required: true, message: 'Please enter the issue country.' }]}
                            >
                              <Input placeholder="Issue country" size="large" />
                            </Form.Item>
                          </Col>
                        </>
                      ) : null}

                      <Col xs={24} md={10}>
                        <Form.Item
                          label="Mobile Country"
                          name="mobileCountry"
                          rules={[{ required: true, message: 'Please choose a mobile country.' }]}
                        >
                          <Select
                            options={mobileCountryOptions}
                            size="large"
                            placeholder="Select country"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={14}>
                        <Form.Item
                          label="Mobile Number"
                          name="mobileNumber"
                          rules={[{ required: true, message: 'Please enter your mobile number.' }]}
                        >
                          <Input placeholder="Mobile number" size="large" autoComplete="tel" />
                        </Form.Item>
                      </Col>

                      <Col xs={24}>
                        <Form.Item
                          label="Email"
                          name="email"
                          rules={[
                            { required: true, message: 'Please enter your email.' },
                            { type: 'email', message: 'Please enter a valid email address.' },
                          ]}
                        >
                          <Input
                            prefix={<MailOutlined />}
                            placeholder="name@email.com"
                            size="large"
                            autoComplete="email"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24}>
                        <Form.Item
                          label="Password"
                          name="password"
                          rules={[
                            { required: true, message: 'Please enter a password.' },
                            { min: 6, message: 'Password must be at least 6 characters.' },
                          ]}
                        >
                          <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Create a password"
                            size="large"
                            autoComplete="new-password"
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24}>
                        <Form.Item
                          label="Maybank Group Employee"
                          name="isMaybankGroupEmployee"
                          valuePropName="checked"
                        >
                          <Checkbox>I am a Maybank Group employee</Checkbox>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      icon={<UserAddOutlined />}
                      loading={registerLoading}
                      block
                    >
                      Create Account
                    </Button>
                  </Form>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}

export default AuthScreen;
