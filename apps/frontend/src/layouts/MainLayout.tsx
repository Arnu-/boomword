import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd';
import {
  HomeOutlined,
  BookOutlined,
  TrophyOutlined,
  StarOutlined,
  UserOutlined,
  LogoutOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';

const { Header, Content, Sider } = Layout;

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/wordbanks', icon: <BookOutlined />, label: '词库' },
  { key: '/learning', icon: <ReadOutlined />, label: '进度' },
  { key: '/ranking', icon: <TrophyOutlined />, label: '排行榜' },
  { key: '/achievements', icon: <StarOutlined />, label: '成就' },
];

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'wrongbook',
      icon: <BookOutlined />,
      label: '错题本',
      onClick: () => navigate('/wrongbook'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm flex items-center justify-between px-6 fixed w-full z-10">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary-600">BoomWord</span>
            <span className="ml-2 text-gray-500">单词泡泡</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Badge count={0} showZero={false}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-1 rounded-lg">
                <Avatar src={user?.avatar} icon={<UserOutlined />} />
                <span className="text-gray-700">{user?.nickname || '用户'}</span>
              </div>
            </Dropdown>
          </Badge>
        </div>
      </Header>

      <Layout className="mt-16">
        <Sider
          width={200}
          className="bg-white shadow-sm fixed h-[calc(100vh-64px)] left-0 top-16"
          theme="light"
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            className="h-full border-r-0 pt-4"
          />
        </Sider>

        <Content className="ml-[200px] p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
