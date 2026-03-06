import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, theme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  BookOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  SettingOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { Spin } from 'antd';
import PageTransition from '@/components/PageTransition';
import { useAuthStore } from '@/stores/authStore';

const { Header, Sider, Content } = Layout;

// 菜单配置
const menuItems = [
  {
    key: '/admin',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: '/admin/users',
    icon: <UserOutlined />,
    label: '用户管理',
  },
  {
    key: '/admin/wordbanks',
    icon: <BookOutlined />,
    label: '词库管理',
  },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token } = theme.useToken();

  // 当前选中菜单
  const selectedKey = (() => {
    const path = location.pathname;
    if (path.startsWith('/admin/users')) return '/admin/users';
    if (path.startsWith('/admin/wordbanks')) return '/admin/wordbanks';
    return '/admin';
  })();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '返回游戏',
      onClick: () => navigate('/'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '个人设置',
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        style={{
          background: 'linear-gradient(180deg, #1a1f3a 0%, #0f1628 100%)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.3)',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        {/* Logo区域 */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
          onClick={() => navigate('/admin')}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 'bold',
              color: '#fff',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
            }}
          >
            B
          </div>
          {!collapsed && (
            <div style={{ marginLeft: 12 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
                BoomWord
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>管理后台</div>
            </div>
          )}
        </div>

        {/* 导航菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          items={menuItems}
          style={{
            background: 'transparent',
            border: 'none',
            marginTop: 8,
          }}
        />
      </Sider>

      {/* 主内容区 */}
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        {/* 顶部导航 */}
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            height: 64,
          }}
        >
          {/* 折叠按钮 */}
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: 18,
              cursor: 'pointer',
              color: token.colorTextSecondary,
              padding: '4px 8px',
              borderRadius: 6,
              transition: 'all 0.2s',
            }}
            className="hover:bg-gray-100"
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>

          {/* 右侧操作区 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={0} size="small">
              <BellOutlined style={{ fontSize: 18, color: token.colorTextSecondary, cursor: 'pointer' }} />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 8,
                  transition: 'background 0.2s',
                }}
                className="hover:bg-gray-50"
              >
                <Avatar
                  size={32}
                  src={user?.avatar}
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  {user?.nickname?.[0]?.toUpperCase()}
                </Avatar>
                <div style={{ lineHeight: 1.3 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: token.colorText }}>
                    {user?.nickname || '管理员'}
                  </div>
                  <div style={{ fontSize: 11, color: token.colorTextSecondary }}>超级管理员</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* 页面内容 */}
        <Content
          style={{
            padding: 24,
            background: '#f5f6fa',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Suspense
            fallback={
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Spin size="large" />
              </div>
            }
          >
            <PageTransition />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
}
