import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Tabs } from 'antd';
import { LockOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

type LoginType = 'email' | 'phone';

const LoginPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<LoginType>('email');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (values: { email?: string; phone?: string; password: string }) => {
    setLoading(true);
    try {
      const params = loginType === 'email' 
        ? { email: values.email, password: values.password }
        : { phone: values.phone, password: values.password };
      
      const response = await authService.login(params);
      login(response.user, response.accessToken, response.refreshToken);
      message.success('登录成功');
      navigate('/');
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key: string) => {
    setLoginType(key as LoginType);
    form.resetFields();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">登录</h2>
      
      <Tabs
        activeKey={loginType}
        onChange={handleTabChange}
        centered
        items={[
          { key: 'email', label: '邮箱登录' },
          { key: 'phone', label: '手机登录' },
        ]}
      />

      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
      >
        {loginType === 'email' ? (
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
        ) : (
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input
              prefix={<PhoneOutlined className="text-gray-400" />}
              placeholder="手机号"
            />
          </Form.Item>
        )}

        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="密码"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
          >
            登录
          </Button>
        </Form.Item>
      </Form>

      <div className="text-center text-gray-500">
        还没有账号？
        <Link to="/register" className="text-primary-600 ml-1">
          立即注册
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
