import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Divider, Form, Input, Typography } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeftOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { resetPassword } from '../services/authService';
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

function ResetPasswordScreen() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await resetPassword({
        token,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      setSuccess(true);
      form.resetFields();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to reset password. The link may be expired or invalid.'));
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
          <Text className="auth-screen__eyebrow">Secure Reset</Text>
          <Title level={1} className="auth-screen__title">Create a new password</Title>
          <Paragraph className="auth-screen__description">
            Use the reset link from your email to set a new password for your customer portal account.
          </Paragraph>
        </div>

        <Card className="auth-card" variant="borderless">
          <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} className="auth-form">
            <Title level={3} className="auth-form__title">Reset password</Title>
            <Text type="secondary">Choose a new password and confirm it below.</Text>

            <Divider />

            {!token ? (
              <Alert type="error" showIcon message="Reset token is missing from the link." />
            ) : null}
            {success ? (
              <Alert
                type="success"
                showIcon
                message="Password updated"
                description="You can now login with your new password."
              />
            ) : null}
            {error ? <Alert type="error" showIcon message={error} /> : null}

            <Form.Item
              label="New password"
              name="newPassword"
              rules={[
                { required: true, message: 'Please enter your new password.' },
                { min: 6, message: 'Password must be at least 6 characters.' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter new password"
                size="large"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              label="Confirm password"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Please confirm your new password.' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match.'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<SafetyOutlined />}
                placeholder="Confirm new password"
                size="large"
                autoComplete="new-password"
              />
            </Form.Item>

            <Button type="primary" htmlType="submit" size="large" loading={loading} disabled={!token} block>
              Reset Password
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

export default ResetPasswordScreen;
