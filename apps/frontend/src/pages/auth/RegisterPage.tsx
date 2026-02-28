import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

const RegisterPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    try {
      const email = form.getFieldValue('email');
      if (!email) {
        message.error('请先输入邮箱');
        return;
      }
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        message.error('请输入正确的邮箱格式');
        return;
      }

      setSendingCode(true);
      await authService.sendCode(email, 'email');
      message.success('验证码已发送');
      setCountdown(60);
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (values: {
    nickname: string;
    email: string;
    password: string;
    confirmPassword: string;
    code: string;
  }) => {
    setLoading(true);
    try {
      const response = await authService.register({
        nickname: values.nickname,
        email: values.email,
        password: values.password,
        code: values.code,
      });
      login(response.user, response.accessToken, response.refreshToken);
      message.success('注册成功');
      navigate('/');
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">注册</h2>

      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="nickname"
          rules={[
            { required: true, message: '请输入昵称' },
            { min: 2, max: 20, message: '昵称长度为2-20个字符' },
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="昵称"
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入正确的邮箱格式' },
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-gray-400" />}
            placeholder="邮箱"
          />
        </Form.Item>

        <Form.Item
          name="code"
          rules={[
            { required: true, message: '请输入验证码' },
            { pattern: /^\d{6}$/, message: '验证码为6位数字' },
          ]}
        >
          <Row gutter={8}>
            <Col flex="auto">
              <Input
                prefix={<SafetyOutlined className="text-gray-400" />}
                placeholder="验证码"
                maxLength={6}
              />
            </Col>
            <Col flex="none">
              <Button
                onClick={handleSendCode}
                loading={sendingCode}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
              </Button>
            </Col>
          </Row>
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 8, max: 20, message: '密码长度为8-20个字符' },
            { 
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
              message: '密码需包含大小写字母和数字' 
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="密码（8-20位，包含大小写字母和数字）"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: '请确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次密码输入不一致'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="确认密码"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
          >
            注册
          </Button>
        </Form.Item>
      </Form>

      <div className="text-center text-gray-500">
        已有账号？
        <Link to="/login" className="text-primary-600 ml-1">
          立即登录
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
