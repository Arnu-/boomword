import { useState } from 'react';
import { Card, Form, Input, Button, Avatar, Upload, message, InputNumber, Divider } from 'antd';
import { UserOutlined, CameraOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordForm] = Form.useForm();
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async (values: {
    nickname: string;
    dailyGoal: number;
  }) => {
    setLoading(true);
    try {
      await api.put('/users/me', values);
      updateUser(values);
      message.success('个人信息已更新');
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values: {
    oldPassword: string;
    newPassword: string;
  }) => {
    setPasswordLoading(true);
    try {
      await api.put('/users/me/password', values);
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">个人中心</h1>

      {/* 头像和基本信息 */}
      <Card>
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <Avatar
              size={80}
              src={user?.avatar}
              icon={<UserOutlined />}
            />
            <Upload
              showUploadList={false}
              accept="image/*"
              customRequest={async ({ file }) => {
                // TODO: 实现头像上传
                message.info('头像上传功能开发中');
              }}
            >
              <Button
                type="primary"
                shape="circle"
                icon={<CameraOutlined />}
                size="small"
                className="absolute -bottom-1 -right-1"
              />
            </Upload>
          </div>
          <div>
            <div className="text-xl font-bold">{user?.nickname}</div>
            <div className="text-gray-500 flex items-center gap-4 mt-1">
              {user?.email && (
                <span>
                  <MailOutlined className="mr-1" />
                  {user.email}
                </span>
              )}
              {user?.phone && (
                <span>
                  <PhoneOutlined className="mr-1" />
                  {user.phone}
                </span>
              )}
            </div>
            <div className="text-gray-400 text-sm mt-1">
              等级 Lv.{user?.level || 1} | 经验值 {user?.experience || 0}
            </div>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            nickname: user?.nickname,
            dailyGoal: user?.dailyGoal || 50,
          }}
          onFinish={handleUpdateProfile}
        >
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[
              { required: true, message: '请输入昵称' },
              { min: 2, max: 20, message: '昵称长度为2-20个字符' },
            ]}
          >
            <Input placeholder="请输入昵称" />
          </Form.Item>

          <Form.Item
            name="dailyGoal"
            label="每日挑战目标（单词数）"
            rules={[{ required: true, message: '请设置每日目标' }]}
          >
            <InputNumber
              min={10}
              max={500}
              step={10}
              className="w-full"
              placeholder="请设置每日目标"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 修改密码 */}
      <Card title="修改密码">
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="oldPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次密码输入不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请确认新密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={passwordLoading}>
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 账号安全 */}
      <Card title="账号安全">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">绑定邮箱</div>
              <div className="text-gray-500 text-sm">
                {user?.email || '未绑定'}
              </div>
            </div>
            <Button type="link">
              {user?.email ? '更换' : '绑定'}
            </Button>
          </div>
          <Divider className="my-2" />
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">绑定手机</div>
              <div className="text-gray-500 text-sm">
                {user?.phone || '未绑定'}
              </div>
            </div>
            <Button type="link">
              {user?.phone ? '更换' : '绑定'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
