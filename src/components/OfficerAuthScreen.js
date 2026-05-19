import React, { useState } from 'react';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { LockOutlined, LoginOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { loginCustomer } from '../services/authService';
import '../styles/AuthScreen.css';
import { USER_ROLE, normalizeRole } from '../constants/userRoles';

const { Title, Text, Paragraph } = Typography;

function OfficerAuthScreen({ onAuthenticated }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (values) => {
    setLoading(true);
    setError('');

    try {
      const session = await loginCustomer({
        email: values.email,
        password: values.password,
      });

      const role = normalizeRole(session?.user?.role ?? session?.user?.Role);

      if (role !== USER_ROLE.Officer) {
        throw new Error('Only officer accounts can access this portal.');
      }

      onAuthenticated(session);
    } catch (loginError) {
      setError(
        loginError?.response?.data?.message ||
          loginError?.response?.data?.title ||
          loginError?.message ||
          'Unable to sign in to the officer portal.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-screen__backdrop" />
      <div className="auth-screen__content" style={{ gridTemplateColumns: '1fr minmax(360px, 500px)' }}>
        <div className="auth-screen__intro">
          <img
            src={`${process.env.PUBLIC_URL}/assets/etiqalogo.png`}
            alt="Etiqa Logo"
            className="auth-screen__logo"
          />
          <Text className="auth-screen__eyebrow">Officer Access Portal</Text>
          <Title level={1} className="auth-screen__title">
            Sign in to the official claims dashboard
          </Title>
          <Paragraph className="auth-screen__description">
            This portal is restricted to authorized Etiqa claims officers. Use the registered officer email and password to continue.
          </Paragraph>
        </div>

        <Card className="auth-card" variant="borderless">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleLogin}
            requiredMark={false}
            className="auth-form"
          >
            <Title level={3} className="auth-form__title">
              Officer Login
            </Title>
            <Text type="secondary">Sign in with your authorized officer account.</Text>

            <div style={{ marginTop: 16 }}>
              {error ? <Alert type="error" showIcon message={error} /> : null}
            </div>

            <Form.Item
              label="Officer Email"
              name="email"
              rules={[
                { required: true, message: 'Please enter the officer email.' },
                { type: 'email', message: 'Please enter a valid email address.' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="name@etiqa.com.my"
                size="large"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please enter the officer password.' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter officer password"
                size="large"
                autoComplete="current-password"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              icon={<SafetyCertificateOutlined />}
              loading={loading}
              block
            >
              Access Officer Portal
            </Button>

            <Button
              icon={<LoginOutlined />}
              block
              style={{ marginTop: 12 }}
              onClick={() => window.location.replace('/')}
            >
              Back to Portal Selection
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default OfficerAuthScreen;
