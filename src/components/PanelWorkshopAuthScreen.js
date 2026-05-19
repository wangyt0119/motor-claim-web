import React, { useState } from 'react';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { LockOutlined, LoginOutlined, MailOutlined, ToolOutlined } from '@ant-design/icons';
import { loginCustomer } from '../services/authService';
import '../styles/AuthScreen.css';
import { USER_ROLE, normalizeRole } from '../constants/userRoles';

const { Title, Text, Paragraph } = Typography;

function PanelWorkshopAuthScreen({ onAuthenticated }) {
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

      if (role !== USER_ROLE.PanelWorkshop) {
        throw new Error('Only panel workshop accounts can access this portal.');
      }

      onAuthenticated(session);
    } catch (loginError) {
      setError(
        loginError?.response?.data?.message ||
          loginError?.response?.data?.title ||
          loginError?.message ||
          'Unable to sign in to the panel workshop portal.'
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
          <Text className="auth-screen__eyebrow">Panel Workshop Portal</Text>
          <Title level={1} className="auth-screen__title">
            Access booked repair appointments and approved claim details
          </Title>
          <Paragraph className="auth-screen__description">
            This portal is for approved panel workshop accounts linked to a workshop record in your backend database.
          </Paragraph>
        </div>

        <Card className="auth-card" variant="borderless">
          <Form form={form} layout="vertical" onFinish={handleLogin} requiredMark={false} className="auth-form">
            <Title level={3} className="auth-form__title">
              Panel Workshop Login
            </Title>
            <Text type="secondary">Sign in with the workshop account created by the admin.</Text>

            <div style={{ marginTop: 16 }}>{error ? <Alert type="error" showIcon message={error} /> : null}</div>

            <Form.Item
              label="Workshop Email"
              name="email"
              rules={[
                { required: true, message: 'Please enter the workshop email.' },
                { type: 'email', message: 'Please enter a valid email address.' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="workshop@email.com" size="large" autoComplete="username" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please enter the workshop password.' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter workshop password"
                size="large"
                autoComplete="current-password"
              />
            </Form.Item>

            <Button type="primary" htmlType="submit" size="large" icon={<ToolOutlined />} loading={loading} block>
              Access Workshop Portal
            </Button>

            <Button icon={<LoginOutlined />} block style={{ marginTop: 12 }} onClick={() => window.location.replace('/')}>
              Back to Portal Selection
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default PanelWorkshopAuthScreen;
