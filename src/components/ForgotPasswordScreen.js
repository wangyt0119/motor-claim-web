import React, { useState } from 'react';
import { Alert, Button, Card, Divider, Form, Input, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined, MailOutlined, SendOutlined } from '@ant-design/icons';
import { forgotPassword } from '../services/authService';
import { getPortalPath, PORTAL_KEYS } from '../config/portalRoutes';
import '../styles/AuthScreen.css';

const { Title, Text, Paragraph } = Typography;

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.title ||
    error?.message ||
    fallbackMessage
  );
}

function ForgotPasswordScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await forgotPassword(values.email);
      setSuccess(true);
      form.resetFields();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to send reset email right now.'));
    } finally {
      setLoading(false);
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
          <Text className="auth-screen__eyebrow">Password Recovery</Text>
          <Title level={1} className="auth-screen__title">Reset your account password</Title>
          <Paragraph className="auth-screen__description">
            Enter your registered email and we will send a secure reset link if the account exists.
          </Paragraph>
        </div>

        <Card className="auth-card" variant="borderless">
          <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} className="auth-form">
            <Title level={3} className="auth-form__title">Forgot password</Title>
            <Text type="secondary">The reset link expires after 1 hour.</Text>

            <Divider />

            {success ? (
              <Alert
                type="success"
                showIcon
                message="Check your email"
                description="If the email is registered, a password reset link has been sent."
              />
            ) : null}
            {error ? <Alert type="error" showIcon message={error} /> : null}

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please enter your email.' },
                { type: 'email', message: 'Please enter a valid email address.' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="name@email.com" size="large" autoComplete="email" />
            </Form.Item>

            <Button type="primary" htmlType="submit" size="large" icon={<SendOutlined />} loading={loading} block>
              Send Reset Link
            </Button>

            <div className="auth-form__footerLink">
              <Link to={getPortalPath(PORTAL_KEYS.CUSTOMER, '/auth')}>
                <ArrowLeftOutlined /> Back to login
              </Link>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default ForgotPasswordScreen;
